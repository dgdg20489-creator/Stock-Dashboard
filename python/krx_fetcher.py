#!/usr/bin/env python3
"""
원광증권 실시간 데이터 서비스
- 한국투자증권 Open API: 실시간 주가 (1차 소스) — 시세 조회 전용, 실제 거래 없음
- 네이버 금융 API: 실시간 주가 fallback + 뉴스 + 종목 목록
- Yahoo Finance: 글로벌 지수
- 동적 주식 목록: KOSPI 전체 + KOSDAQ 전체 (~2300종목)
- 공모주(IPO): 상장 예정 종목 자동 수집 및 상장일 자동 반영
- 모의투자: 매수/매도/잔고는 내부 PostgreSQL DB에서 처리 (실제 계좌 연동 없음)
"""
import os, time, math, random, logging, traceback, threading
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, timezone

# 한국투자증권 Open API 모듈 (시세 데이터 소스)
try:
    from kis_api import (
        fetch_price as kis_fetch_price,
        fetch_price_batch as kis_fetch_price_batch,
        fetch_volume_ranking as kis_fetch_volume_ranking,
        fetch_fluctuation_ranking as kis_fetch_fluctuation_ranking,
        fetch_daily_ohlcv as kis_fetch_daily_ohlcv,
        is_available as kis_is_available,
    )
    KIS_ENABLED = True
except ImportError:
    KIS_ENABLED = False
    log_tmp = logging.getLogger(__name__)
    log_tmp.warning("kis_api 모듈 없음 — 네이버 fallback 사용")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]
KST = timezone(timedelta(hours=9))  # Korea Standard Time (UTC+9)

INDICES = [
    ("^KS11",    "KOSPI",   "kospi"),
    ("^KQ11",    "KOSDAQ",  "kosdaq"),
    ("USDKRW=X", "USD/KRW", "usdKrw"),
    ("^GSPC",    "S&P 500", "sp500"),
    ("^IXIC",    "NASDAQ",  "nasdaq"),
]

NAVER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Referer": "https://m.stock.naver.com/",
}
NAVER_WEB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9",
}
FALLBACK_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; WonkwangBot/1.0)"}

# Fallback prices if Naver is unreachable (2026-03-31 closing prices)
FALLBACK_PRICES = {
    "005930": 169000, "000660": 824000, "035420": 201000, "035720": 45800,
    "373220": 396500, "005380": 448500, "051910": 299000, "006400": 414500,
    "207940": 1531000, "000270": 146800, "066570": 105400, "105560": 143700,
    "096770": 108800, "003550": 83400,  "086790": 107700, "055550": 88100,
    "012330": 381800, "030200": 60500,  "028260": 254300, "032830": 211800,
}

PYKRX_END           = datetime.today().strftime("%Y%m%d")  # 항상 오늘
PYKRX_START         = "20240101"                          # 1년치 기본 (seed_history용)
PYKRX_FULL_START    = "19900101"                          # 수정주가 전체 히스토리 시작


# ─────────────────────────────────────────────────
# AI 감성 분석 (뉴스 호재/악재)
# ─────────────────────────────────────────────────

BULLISH_KEYWORDS = [
    '상승', '급등', '신고가', '흑자', '증가', '성장', '돌파', '회복', '개선',
    '강세', '반등', '수주', '수익', '이익', '훈풍', '매수', '호재', '기대',
    '긍정', '최고', '견조', '순항', '성과', '역대', '최대', '호실적', '낙관',
    '상향', '확대', '투자', '급증', '강화', '신규', '체결', '승인', '허가',
    '호조', '선방', '양호', '우상향', '완승', '수혜', '기록', '달성', '증익',
]

BEARISH_KEYWORDS = [
    '하락', '급락', '신저가', '적자', '감소', '침체', '우려', '위기', '손실',
    '부진', '약세', '조사', '수사', '매도', '악재', '비관', '최저', '폭락',
    '하향', '축소', '감원', '부담', '리스크', '불안', '악화', '부실', '충당',
    '파산', '분식', '리콜', '소환', '압박', '규제', '벌금', '과징금',
    '저조', '실망', '경고', '하회', '손해', '피해', '실적부진', '손실', '감익',
]

def analyze_sentiment(title: str, body: str = '') -> str:
    """뉴스 제목/본문을 분석하여 bullish/bearish/neutral 반환."""
    text = (title or '') + ' ' + (body or '')
    bull_score = sum(1 for w in BULLISH_KEYWORDS if w in text)
    bear_score = sum(1 for w in BEARISH_KEYWORDS if w in text)
    if bull_score > bear_score:
        return 'bullish'
    elif bear_score > bull_score:
        return 'bearish'
    return 'neutral'


# ─────────────────────────────────────────────────
# NAVER FINANCE: STOCK LIST (전체 종목)
# ─────────────────────────────────────────────────

def fetch_naver_stock_list(sosok: int, pages: int = 4) -> list:
    """네이버 금융 시가총액 페이지에서 KOSPI/KOSDAQ 종목 목록 + 가격 가져오기."""
    import requests
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return []
    market = "KOSPI" if sosok == 0 else "KOSDAQ"
    stocks = []
    seen = set()
    for page in range(1, pages + 1):
        url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok={sosok}&page={page}"
        try:
            r = requests.get(url, headers=NAVER_WEB_HEADERS, timeout=10)
            r.encoding = "euc-kr"
            soup = BeautifulSoup(r.text, "html.parser")
            rows = soup.select("table.type_2 tr")
            found = 0
            for row in rows:
                cols = row.select("td")
                link = row.select_one('a[href*="code="]')
                if not link or len(cols) < 11:
                    continue
                code = link["href"].split("code=")[-1][:6]
                if not code.isdigit() or len(code) != 6 or code in seen:
                    continue
                seen.add(code)
                name = link.get_text(strip=True)
                ct = [c.get_text(strip=True).replace(",", "").replace("+", "") for c in cols]
                try:
                    price = int(ct[2]) if ct[2] and ct[2].lstrip('-').isdigit() else 0
                except Exception:
                    price = 0
                try:
                    change_val = float(ct[3]) if ct[3] and ct[3].lstrip('-').replace('.','',1).isdigit() else 0.0
                except Exception:
                    change_val = 0.0
                try:
                    change_pct_raw = ct[4].replace('%', '')
                    change_pct = float(change_pct_raw) if change_pct_raw and change_pct_raw.lstrip('-').replace('.','',1).isdigit() else 0.0
                except Exception:
                    change_pct = 0.0
                try:
                    mcap = int(ct[6]) if ct[6] and ct[6].isdigit() else 0
                except Exception:
                    mcap = 0
                try:
                    volume = int(ct[9]) if ct[9] and ct[9].isdigit() else 0
                except Exception:
                    volume = 0
                try:
                    per = float(ct[10]) if ct[10] and ct[10] not in ["-", ""] and ct[10].lstrip('-').replace('.','',1).isdigit() else 0.0
                except Exception:
                    per = 0.0
                stocks.append({
                    "ticker": code, "name": name, "market": market,
                    "market_cap": mcap, "price": price,
                    "change_val": change_val, "change_pct": change_pct,
                    "volume": volume, "per": per
                })
                found += 1
            if found == 0:
                log.info(f"  {market} p{page}: 데이터 없음 — 마지막 페이지 도달")
                break
            log.info(f"  {market} p{page}: {found}종목 (누적 {len(stocks)})")
            time.sleep(0.3)
        except Exception as e:
            log.warning(f"fetch_naver_stock_list {market} p{page}: {e}")
    return stocks


def seed_all_stocks_dynamic(conn):
    """네이버 금융에서 전체 주식 목록을 동적으로 가져와 DB에 저장.
    KOSPI 전체(~16페이지) + KOSDAQ 전체(~30페이지) = ~2300종목
    """
    log.info("=== 네이버 금융 전체 종목 목록 로딩 시작 ===")
    all_stocks: list = []

    # KOSPI 전체 (~800종목, 최대 18페이지)
    kospi = fetch_naver_stock_list(0, pages=18)
    all_stocks.extend(kospi)
    log.info(f"KOSPI: {len(kospi)}종목")

    # KOSDAQ 전체 (~1500종목, 최대 32페이지)
    kosdaq = fetch_naver_stock_list(1, pages=32)
    all_stocks.extend(kosdaq)
    log.info(f"KOSDAQ: {len(kosdaq)}종목")

    if not all_stocks:
        log.warning("네이버에서 종목 로딩 실패 — 기존 DB 유지")
        return 0

    # UPSERT into DB (새 종목은 추가, 기존 종목은 이름/시장/시총/가격 업데이트)
    rows = []
    for s in all_stocks:
        base = s["price"] or FALLBACK_PRICES.get(s["ticker"], 50000)
        rows.append((
            s["ticker"], s["name"], base, base,
            s.get("change_val", 0), s.get("change_pct", 0),
            max(s.get("volume", 1_000_000), 1), s["market_cap"],
            s["market"], s["per"]
        ))

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO stocks_realtime
                (ticker, name, current_price, base_price, change_val, change_pct,
                 volume, market_cap, market, per)
            VALUES %s
            ON CONFLICT (ticker) DO UPDATE SET
                name       = EXCLUDED.name,
                market     = EXCLUDED.market,
                market_cap = EXCLUDED.market_cap
        """, rows)
    conn.commit()
    log.info(f"=== {len(rows)}종목 DB 저장 완료 ===")
    return len(rows)


def update_all_prices_from_listing(conn):
    """네이버 시장목록 페이지에서 전체 종목 가격을 일괄 업데이트 (5분마다).
    개별 API 호출(30s) 보다 빠른 배치 방식.
    """
    log.info("=== 전체 종목 일괄 가격 업데이트 (시장목록 페이지) ===")
    updated = 0
    for sosok in [0, 1]:
        max_pages = 18 if sosok == 0 else 32
        stocks = fetch_naver_stock_list(sosok, pages=max_pages)
        if not stocks:
            continue
        rows = []
        for s in stocks:
            if s["price"] <= 0:
                continue
            rows.append((
                s["price"], s["price"],
                s.get("change_val", 0), s.get("change_pct", 0),
                max(s.get("volume", 0), 1),
                s["market_cap"] or 0,
                s["ticker"]
            ))
        if rows:
            import time as _t
            for _att in range(3):
                try:
                    with conn.cursor() as cur:
                        cur.executemany("""
                            UPDATE stocks_realtime
                            SET current_price=%s, base_price=%s,
                                change_val=%s, change_pct=%s,
                                volume=%s, market_cap=%s,
                                updated_at=NOW()
                            WHERE ticker=%s
                        """, rows)
                    conn.commit()
                    updated += len(rows)
                    break
                except Exception as _e:
                    conn.rollback()
                    if _att < 2:
                        _t.sleep(0.2 * (2 ** _att))
                    else:
                        log.warning(f"update_all_prices batch failed after retries: {_e}")
    log.info(f"일괄 가격 업데이트 완료: {updated}종목")


def get_all_tickers_from_db(conn) -> list:
    """DB에서 전체 ticker 목록을 시총 순으로 가져옴."""
    with conn.cursor() as cur:
        cur.execute("SELECT ticker FROM stocks_realtime ORDER BY market_cap DESC NULLS LAST")
        return [r[0] for r in cur.fetchall()]


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def create_tables(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS stocks_realtime (
                ticker       TEXT PRIMARY KEY,
                name         TEXT    NOT NULL,
                current_price NUMERIC NOT NULL,
                base_price   NUMERIC NOT NULL,
                change_val   NUMERIC NOT NULL DEFAULT 0,
                change_pct   NUMERIC NOT NULL DEFAULT 0,
                volume       BIGINT  NOT NULL DEFAULT 0,
                market_cap   BIGINT  NOT NULL DEFAULT 0,
                updated_at   TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS market_indices (
                key        TEXT PRIMARY KEY,
                name       TEXT    NOT NULL,
                value      NUMERIC NOT NULL,
                change_val NUMERIC NOT NULL DEFAULT 0,
                change_pct NUMERIC NOT NULL DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS stocks_history (
                ticker      TEXT    NOT NULL,
                date        DATE    NOT NULL,
                open_price  NUMERIC NOT NULL,
                high_price  NUMERIC NOT NULL,
                low_price   NUMERIC NOT NULL,
                close_price NUMERIC NOT NULL,
                volume      BIGINT  NOT NULL DEFAULT 0,
                PRIMARY KEY (ticker, date)
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS market_news (
                id          TEXT        NOT NULL,
                ticker      TEXT        NOT NULL,
                title       TEXT        NOT NULL,
                body        TEXT,
                office_name TEXT,
                article_url TEXT,
                image_url   TEXT,
                published_at TIMESTAMPTZ,
                sentiment   TEXT        DEFAULT 'neutral',
                fetched_at  TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (id, ticker)
            )
        """)
        # sentiment 컬럼이 없을 경우 추가 (기존 DB 호환)
        cur.execute("""
            ALTER TABLE market_news ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral'
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS market_news_ticker_idx ON market_news(ticker, published_at DESC)")

        # stocks_realtime 누락 컬럼 추가 (기존 DB 호환)
        cur.execute("ALTER TABLE stocks_realtime ADD COLUMN IF NOT EXISTS market TEXT DEFAULT 'KOSPI'")
        cur.execute("ALTER TABLE stocks_realtime ADD COLUMN IF NOT EXISTS per NUMERIC DEFAULT 0")
        cur.execute("ALTER TABLE stocks_realtime ADD COLUMN IF NOT EXISTS naver_change_pct NUMERIC DEFAULT 0")
        cur.execute("ALTER TABLE stocks_realtime ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT ''")

        # 실시간 시장 순위 테이블 (거래대금 / 거래량)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS market_rankings (
                type        TEXT    NOT NULL,
                rank        INT     NOT NULL,
                ticker      TEXT    NOT NULL,
                name        TEXT    NOT NULL,
                price       NUMERIC NOT NULL DEFAULT 0,
                change_pct  NUMERIC NOT NULL DEFAULT 0,
                volume      BIGINT  NOT NULL DEFAULT 0,
                trade_amount BIGINT NOT NULL DEFAULT 0,
                market      TEXT,
                updated_at  TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (type, rank)
            )
        """)

        # 공모주(IPO) 테이블
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ipo_stocks (
                ticker             TEXT PRIMARY KEY,
                name               TEXT    NOT NULL,
                market             TEXT    NOT NULL DEFAULT 'KOSPI',
                ipo_price          NUMERIC,
                listing_date       DATE    NOT NULL,
                subscription_start DATE,
                subscription_end   DATE,
                created_at         TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS ipo_listing_date_idx ON ipo_stocks(listing_date)")
    conn.commit()
    log.info("DB tables OK")


# ─────────────────────────────────────────────────
# NAVER FINANCE: REAL-TIME PRICES (상위 종목 개별 업데이트)
# ─────────────────────────────────────────────────

def fetch_naver_price(ticker: str) -> dict | None:
    """Fetch current stock price + volume from Naver Finance mobile API."""
    try:
        import requests
        url = f"https://m.stock.naver.com/api/stock/{ticker}/basic"
        r = requests.get(url, headers=NAVER_HEADERS, timeout=6)
        if r.status_code != 200:
            return None
        d = r.json()
        price_str = d.get("closePrice", "").replace(",", "")
        change_str = d.get("compareToPreviousClosePrice", "0").replace(",", "").replace("+", "")
        pct_str = d.get("fluctuationsRatio", "0")
        logo_url = d.get("itemLogoUrl", "")
        if not price_str:
            return None
        return {
            "price": int(price_str),
            "change": float(change_str) if change_str else 0.0,
            "change_pct": float(pct_str) if pct_str else 0.0,
            "logo_url": logo_url,
        }
    except Exception as e:
        log.debug(f"Naver price {ticker}: {e}")
        return None


def seed_realtime(conn):
    """Seed stocks_realtime — 동적으로 네이버 금융 전체 종목 로딩."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stocks_realtime")
        count = cur.fetchone()[0]

    if count < 20:
        n = seed_all_stocks_dynamic(conn)
        log.info(f"초기 seeding 완료: {n}종목")
    else:
        log.info(f"stocks_realtime 이미 {count}종목 존재 — 목록 업데이트만 수행")
        seed_all_stocks_dynamic(conn)


def update_realtime_prices(conn):
    """
    상위 종목 실시간 가격 업데이트.
    1차: 한국투자증권 Open API (실제 시세, 시세 조회 전용)
    2차 fallback: 네이버 금융 개별 API
    """
    tickers = get_all_tickers_from_db(conn)[:500]
    if not tickers:
        log.warning("DB에 종목이 없음 — 가격 업데이트 스킵")
        return

    updated_kis    = 0
    updated_naver  = 0
    updated_failed = 0

    # ── 1차: 한투 Open API (시세 조회 전용, 모의투자 데이터 소스) ─────────
    kis_ok = KIS_ENABLED and kis_is_available()
    if kis_ok:
        log.info("[KIS] 실시간 시세 업데이트 시작 (한국투자증권 Open API)")
        # 상위 200종목은 한투 API로 (rate limit 고려, 50ms 간격)
        kis_tickers = tickers[:200]
        for ticker in kis_tickers:
            try:
                d = kis_fetch_price(ticker)
                if not d:
                    updated_failed += 1
                    continue
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE stocks_realtime
                        SET current_price=%s, base_price=%s,
                            change_val=%s, change_pct=%s, naver_change_pct=%s,
                            volume=%s, updated_at=NOW()
                        WHERE ticker=%s
                    """, (
                        d["price"], d.get("base", d["price"]),
                        d["change"], d["change_pct"], d["change_pct"],
                        d.get("volume", 0) or 0,
                        ticker,
                    ))
                updated_kis += 1
                time.sleep(0.05)  # 50ms — KIS rate limit 준수
            except Exception as e:
                log.debug(f"[KIS] price update {ticker}: {e}")
                updated_failed += 1
        conn.commit()
        log.info(f"[KIS] 시세 업데이트: {updated_kis}종목 성공, {updated_failed}종목 실패")

        # 200위 이후는 네이버로 보충
        remaining = tickers[200:]
    else:
        if KIS_ENABLED:
            log.warning("[KIS] API 사용 불가 — 네이버 fallback으로 전환")
        remaining = tickers

    # ── 2차: 네이버 금융 (fallback or 200위 이후 종목) ────────────────────
    for ticker in remaining:
        try:
            naver = fetch_naver_price(ticker)
            if not naver:
                continue
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE stocks_realtime
                    SET current_price=%s, base_price=%s, change_val=%s, change_pct=%s,
                        naver_change_pct=%s,
                        logo_url=COALESCE(NULLIF(%s,''), logo_url), updated_at=NOW()
                    WHERE ticker=%s
                """, (naver["price"], naver["price"], naver["change"], naver["change_pct"],
                      naver["change_pct"],
                      naver.get("logo_url", ""), ticker))
            updated_naver += 1
            time.sleep(0.07)
        except Exception as e:
            log.debug(f"Naver price update {ticker}: {e}")
    conn.commit()
    log.info(f"실시간 가격 업데이트 완료 — KIS: {updated_kis}종목, 네이버: {updated_naver}종목")


def simulate_prices(conn):
    """
    Brownian-motion simulation (random walk from current price).
    - 장 중(09:00~15:30 KST): ±0.25% / step, base 가격 근처로 수렴
    - 장 마감 후: ±0.40% / step, 독립 랜덤 워크 (계속 움직임)
    - base_price 대비 ±3% 이탈 시 강제 수렴 (과도한 이탈 방지)
    NOTE: volume은 절대 건드리지 않음 — Naver 실제 거래량 유지.
    """
    import pytz
    from datetime import datetime as _dt
    kr_tz = pytz.timezone("Asia/Seoul")
    now_kr = _dt.now(kr_tz)
    is_weekday = now_kr.weekday() < 5
    market_open  = now_kr.replace(hour=9,  minute=0,  second=0, microsecond=0)
    market_close = now_kr.replace(hour=15, minute=30, second=0, microsecond=0)
    is_market_hours = is_weekday and market_open <= now_kr <= market_close

    # 장 마감 / 주말 → 시뮬레이션 완전 중단 (실제 시장과 동일하게 가격 고정)
    if not is_market_hours:
        return

    # 장 중: ±0.25% 변동 + base 가격 수렴
    vol      = 0.0025
    revert_k = 0.08

    with conn.cursor() as cur:
        cur.execute("SELECT ticker, current_price, base_price, naver_change_pct FROM stocks_realtime")
        stocks = cur.fetchall()

    rows = []
    for ticker, curr_raw, base_raw, naver_chg_raw in stocks:
        base      = float(base_raw)      if base_raw      else 0.0
        curr      = float(curr_raw)      if curr_raw      else base
        naver_chg = float(naver_chg_raw) if naver_chg_raw else 0.0
        if base <= 0:
            continue

        # 랜덤 워크 스텝
        noise = (random.random() - 0.5) * 2 * vol

        # base_price 대비 편차 → 수렴력 적용
        drift = (base - curr) / base if base > 0 else 0.0
        revert = drift * revert_k

        # ±3% 이탈 시 강제 수렴
        if abs(drift) > 0.03:
            revert = drift * 0.25

        new_price = max(1, round(curr * (1 + noise + revert)))

        # 전일 종가 계산: base_price 를 오늘 등락률로 역산
        prev_close = base / (1 + naver_chg / 100) if (1 + naver_chg / 100) > 0 else base
        if prev_close > 0:
            change_pct = round((new_price / prev_close - 1) * 100, 2)
            change_val = round(new_price - prev_close)
        else:
            change_pct = naver_chg
            change_val = round(new_price - base)

        rows.append((new_price, change_pct, change_val, ticker))

    import time as _time
    for _attempt in range(3):
        try:
            with conn.cursor() as cur:
                cur.executemany("""
                    UPDATE stocks_realtime
                    SET current_price=%s, change_pct=%s, change_val=%s, updated_at=NOW()
                    WHERE ticker=%s
                """, rows)
            conn.commit()
            break
        except Exception as _e:
            conn.rollback()
            if _attempt < 2:
                _time.sleep(0.1 * (2 ** _attempt))
            else:
                logging.warning("simulate_prices: max retries exceeded, skipping cycle")


# ─────────────────────────────────────────────────
# pykrx HISTORY (1 year of OHLCV)
# ─────────────────────────────────────────────────

STOCKS = [
    ("005930", "삼성전자", "반도체"), ("000660", "SK하이닉스", "반도체"),
    ("035420", "NAVER", "IT서비스"), ("035720", "카카오", "IT서비스"),
]

def _parse_ohlcv_df(df, ticker):
    """pykrx DataFrame → (ticker, date, o, h, l, c, v) 리스트. 수정주가 포함."""
    rows = []
    for ts, row in df.iterrows():
        try:
            o = int(row.get("시가",   row.iloc[0]))
            h = int(row.get("고가",   row.iloc[1]))
            l = int(row.get("저가",   row.iloc[2]))
            c = int(row.get("종가",   row.iloc[3]))
            v = int(row.get("거래량", row.iloc[4]))
            if c <= 0:
                continue
            rows.append((ticker, ts.strftime("%Y-%m-%d"), o, h, l, c, v))
        except Exception:
            pass
    return rows


def _upsert_history(conn, rows):
    """OHLCV rows를 DB에 UPSERT (수정주가 업데이트 지원)."""
    if not rows:
        return
    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO stocks_history
                (ticker, date, open_price, high_price, low_price, close_price, volume)
            VALUES %s
            ON CONFLICT (ticker, date) DO UPDATE SET
                open_price  = EXCLUDED.open_price,
                high_price  = EXCLUDED.high_price,
                low_price   = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                volume      = EXCLUDED.volume
        """, rows)
    conn.commit()


def _yf_suffix(conn, ticker: str) -> str:
    """DB에서 시장(KOSPI/KOSDAQ)을 조회해 Yahoo Finance 접미사 반환."""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT market FROM stocks_realtime WHERE ticker=%s", (ticker,))
            row = cur.fetchone()
        if row and row[0] and "KOSDAQ" in str(row[0]).upper():
            return ".KQ"
    except Exception:
        pass
    return ".KS"   # 기본: KOSPI


def fetch_yfinance_history(conn, ticker: str) -> int:
    """Yahoo Finance에서 상장일부터 오늘까지 전체 OHLCV 수집 (pykrx 3000일 한계 극복)."""
    try:
        import yfinance as yf
        suffix = _yf_suffix(conn, ticker)
        yf_ticker = f"{ticker}{suffix}"
        df = yf.download(yf_ticker, start="1990-01-01",
                         end=(datetime.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
                         auto_adjust=True, progress=False)
        if df is None or df.empty:
            return 0
        # yfinance 최신 버전은 (Column, Ticker) 멀티레벨 컬럼 반환 → 1레벨로 평탄화
        if isinstance(df.columns, __import__("pandas").MultiIndex):
            df.columns = [col[0] for col in df.columns]
        rows = []
        for ts, row in df.iterrows():
            try:
                o = float(row["Open"])
                h = float(row["High"])
                l = float(row["Low"])
                c = float(row["Close"])
                v = int(row.get("Volume", 0) or 0)
                if c <= 0 or h <= 0:
                    continue
                rows.append((ticker, ts.strftime("%Y-%m-%d"), o, h, l, c, v))
            except Exception:
                continue
        if rows:
            _upsert_history(conn, rows)
        return len(rows)
    except Exception as e:
        log.debug(f"yfinance {ticker}: {e}")
        return 0


def fetch_full_history_ticker(conn, ticker: str, start: str = PYKRX_FULL_START) -> int:
    """상장일부터 오늘까지 전체 OHLCV 수집.
    1단계: Yahoo Finance (상장일~오늘, pykrx 3000일 한계 없음)
    2단계: pykrx 수정주가로 최근 데이터 덮어쓰기 (더 정확한 조정주가)"""
    # ── 1단계: Yahoo Finance (전체 히스토리) ──────────────────────────
    yf_rows = fetch_yfinance_history(conn, ticker)

    # ── 2단계: pykrx 수정주가 (2014~ 정밀 데이터로 갱신) ─────────────
    pykrx_rows = 0
    try:
        from pykrx import stock as ps
        end = datetime.today().strftime("%Y%m%d")
        df = ps.get_market_ohlcv_by_date(PYKRX_FULL_START, end, ticker, adjusted=True)
        if df is not None and not df.empty:
            rows = _parse_ohlcv_df(df, ticker)
            _upsert_history(conn, rows)
            pykrx_rows = len(rows)
    except Exception as e:
        log.debug(f"pykrx {ticker}: {e}")

    return max(yf_rows, pykrx_rows)


def seed_history(conn):
    """초기 구동 시 DB의 상위 종목부터 수정주가 전체 히스토리를 시드.
    - 히스토리가 아예 없는 종목 → 신규 시드
    - 최초 날짜가 2014-01-01 이후인 종목 → 3000일 한계로 잘린 것이므로 재수집"""
    with conn.cursor() as cur:
        # 히스토리 없는 종목
        cur.execute("""
            SELECT r.ticker, r.name
            FROM stocks_realtime r
            LEFT JOIN (SELECT DISTINCT ticker FROM stocks_history) h
              ON r.ticker = h.ticker
            WHERE h.ticker IS NULL
            ORDER BY COALESCE(r.market_cap, 0) DESC
            LIMIT 50
        """)
        no_history = cur.fetchall()

        # 이미 시드됐지만 가장 오래된 날짜가 2014-01-02 이후 → 잘린 히스토리
        cur.execute("""
            SELECT r.ticker, r.name
            FROM stocks_realtime r
            JOIN (
                SELECT ticker, MIN(date) AS min_date
                FROM stocks_history
                GROUP BY ticker
            ) h ON r.ticker = h.ticker
            WHERE h.min_date > '2014-01-02'
            ORDER BY COALESCE(r.market_cap, 0) DESC
            LIMIT 50
        """)
        partial_history = cur.fetchall()

    to_seed = no_history + [row for row in partial_history if row not in no_history]

    if not to_seed:
        log.info("모든 종목 전체 히스토리 완비 — seed_history 건너뜀")
        return

    log.info(f"수정주가 히스토리 시드: {len(to_seed)}종목 (신규 {len(no_history)} + 부분재수집 {len(partial_history)})")
    try:
        for ticker, name in to_seed:
            n = fetch_full_history_ticker(conn, ticker)
            if n:
                log.info(f"  {ticker} ({name}): {n} days (adjusted)")
            time.sleep(0.1)
    except ImportError:
        log.warning("pykrx not available, skipping history seed")


# ─────────────────────────────────────────────────
# YAHOO FINANCE INDICES
# ─────────────────────────────────────────────────

def fetch_yahoo(sym: str):
    try:
        import requests
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=2d"
        r = requests.get(url, headers=FALLBACK_HEADERS, timeout=8)
        if r.status_code != 200:
            return None
        data  = r.json()
        result = data.get("chart", {}).get("result", [None])[0]
        if not result:
            return None
        meta  = result["meta"]
        price = float(meta.get("regularMarketPrice") or meta.get("previousClose") or 0)
        prev  = float(meta.get("chartPreviousClose") or price or 1)
        if price and prev:
            return {
                "price":      price,
                "change":     price - prev,
                "change_pct": (price - prev) / prev * 100,
            }
    except Exception as e:
        log.debug(f"Yahoo {sym}: {e}")
    return None


def update_indices(conn):
    rows = []
    for sym, name, key in INDICES:
        d = fetch_yahoo(sym)
        if d:
            rows.append((key, name, d["price"], d["change"], round(d["change_pct"], 2)))
    if not rows:
        return
    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO market_indices (key, name, value, change_val, change_pct)
            VALUES %s
            ON CONFLICT (key) DO UPDATE SET
                value      = EXCLUDED.value,
                change_val = EXCLUDED.change_val,
                change_pct = EXCLUDED.change_pct,
                updated_at = NOW()
        """, rows)
    conn.commit()
    log.info(f"Indices updated ({len(rows)} entries)")


# ─────────────────────────────────────────────────
# NAVER NEWS + AI 감성 분석
# ─────────────────────────────────────────────────

def parse_naver_datetime(dt_str: str) -> datetime | None:
    """Parse Naver datetime string (KST) → UTC-aware datetime for PostgreSQL.
    Naver times are Korea Standard Time (UTC+9).
    We explicitly convert to UTC so psycopg2 stores the correct value.
    Format examples: '202603311416' (12자리), '20260331' (8자리)
    """
    try:
        if len(dt_str) == 12:
            kst_dt = datetime.strptime(dt_str, "%Y%m%d%H%M").replace(tzinfo=KST)
            return kst_dt.astimezone(timezone.utc)
        elif len(dt_str) == 8:
            kst_dt = datetime.strptime(dt_str, "%Y%m%d").replace(tzinfo=KST)
            return kst_dt.astimezone(timezone.utc)
    except Exception:
        pass
    return None


def fetch_stock_news(ticker: str, page_size: int = 5) -> list:
    """Fetch news for a specific stock from Naver Finance API."""
    try:
        import requests
        url = f"https://m.stock.naver.com/api/news/stock/{ticker}?pageSize={page_size}&page=1"
        r = requests.get(url, headers=NAVER_HEADERS, timeout=6)
        if r.status_code != 200:
            return []
        data = r.json()
        if isinstance(data, list):
            items = []
            for entry in data:
                items.extend(entry.get("items", []) if isinstance(entry, dict) else [])
        elif isinstance(data, dict):
            items = data.get("items", [])
        else:
            return []
        return items
    except Exception as e:
        log.debug(f"Stock news {ticker}: {e}")
        return []


def fetch_market_news_html() -> list:
    """Fetch market-wide news from Naver Finance HTML using BeautifulSoup."""
    try:
        import requests, html as html_mod
        from bs4 import BeautifulSoup

        url = "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258"
        r = requests.get(url, headers=NAVER_WEB_HEADERS, timeout=8)
        if r.status_code != 200:
            return []

        soup = BeautifulSoup(r.text, "html.parser")
        items = []
        now = datetime.now(KST)

        news_links = soup.select(".articleSubject a")
        summaries  = soup.select(".articleSummary")

        for i, link in enumerate(news_links[:20]):
            raw_title = link.get_text(strip=True)
            title     = html_mod.unescape(raw_title)
            href      = link.get("href", "")
            if href.startswith("/"):
                href = "https://finance.naver.com" + href

            summary_el = summaries[i] if i < len(summaries) else None
            office = ""
            pub_dt = now
            if summary_el:
                press_el = summary_el.select_one(".press")
                date_el  = summary_el.select_one(".wdate")
                if press_el:
                    office = press_el.get_text(strip=True)
                if date_el:
                    date_str = date_el.get_text(strip=True)
                    for fmt in ("%Y-%m-%d %H:%M", "%Y.%m.%d %H:%M", "%Y.%m.%d"):
                        try:
                            pub_dt = datetime.strptime(date_str, fmt).replace(tzinfo=KST)
                            break
                        except Exception:
                            pass

            article_id = ""
            office_id  = ""
            try:
                from urllib.parse import urlparse, parse_qs
                qs = parse_qs(urlparse(href).query)
                article_id = qs.get("article_id", [str(i)])[0]
                office_id  = qs.get("office_id",  ["000"])[0]
            except Exception:
                article_id = str(i)
                office_id  = "000"

            item_id = f"market_{office_id}_{article_id}"
            if not title:
                continue

            items.append({
                "id":              item_id,
                "officeId":        office_id,
                "articleId":       article_id,
                "officeName":      office or "네이버금융",
                "datetime":        pub_dt.strftime("%Y%m%d%H%M"),
                "title":           title,
                "body":            "",
                "mobileNewsUrl":   href,
                "imageOriginLink": "",
            })

        if items:
            log.info(f"  Fetched {len(items)} market news from HTML")
        return items
    except ImportError:
        log.debug("BeautifulSoup not available")
        return []
    except Exception as e:
        log.debug(f"Market news HTML: {e}")
        return []


def fetch_market_news_api() -> list:
    """Collect market news by aggregating top stock news feeds."""
    try:
        import requests
        top_tickers = ["005930", "000660", "035420", "005380", "373220", "035720"]
        all_items = []
        seen_titles = set()
        for ticker in top_tickers:
            items = fetch_stock_news(ticker, page_size=3)
            for item in items:
                title = item.get("title", "")
                if title and title not in seen_titles:
                    seen_titles.add(title)
                    all_items.append(item)
            if len(all_items) >= 8:
                break
            time.sleep(0.1)
        return all_items[:8]
    except Exception as e:
        log.debug(f"Market news API: {e}")
        return []


def store_news(conn, ticker: str, items: list):
    """Store news items in market_news table — with AI sentiment analysis."""
    import html as html_mod
    if not items:
        return
    rows = []
    for item in items:
        raw_id  = str(item.get("id", "")) or f"{item.get('officeId','')}{item.get('articleId','')}"
        title   = html_mod.unescape((item.get("title") or "").strip())
        if not title or not raw_id:
            continue
        body        = html_mod.unescape((item.get("body") or "").strip()[:2000])
        office_name = item.get("officeName", "")
        article_url = item.get("mobileNewsUrl") or item.get("url") or ""
        image_url   = item.get("imageOriginLink") or item.get("imageUrl") or ""
        pub_dt      = parse_naver_datetime(item.get("datetime", ""))
        sentiment   = analyze_sentiment(title, body)
        rows.append((raw_id, ticker, title, body, office_name, article_url, image_url, pub_dt, sentiment))

    if not rows:
        return
    try:
        with conn.cursor() as cur:
            execute_values(cur, """
                INSERT INTO market_news (id, ticker, title, body, office_name, article_url, image_url, published_at, sentiment)
                VALUES %s
                ON CONFLICT (id, ticker) DO UPDATE SET
                    title       = EXCLUDED.title,
                    body        = EXCLUDED.body,
                    sentiment   = EXCLUDED.sentiment,
                    fetched_at  = NOW()
            """, rows)
        conn.commit()
    except Exception as e:
        conn.rollback()
        log.warning(f"store_news {ticker}: {e}")


def refresh_all_news(conn):
    """Refresh news for all stocks + market news."""
    log.info("Refreshing news from Naver Finance...")

    # Market news (ticker = 'MARKET')
    market_items = fetch_market_news_html()
    if not market_items:
        market_items = fetch_market_news_api()
    store_news(conn, "MARKET", market_items)

    # DB의 상위 50종목 (시총 순)에 대한 뉴스 가져오기
    tickers = get_all_tickers_from_db(conn)[:50]
    total = 0
    for ticker in tickers:
        items = fetch_stock_news(ticker, page_size=5)
        store_news(conn, ticker, items)
        total += len(items)
        time.sleep(0.12)

    log.info(f"뉴스 새로고침 완료: 종목 {total}건, 시장 {len(market_items)}건")

    # 오래된 뉴스 정리 (ticker별 최신 20건 유지, 총 2000건)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM market_news
                WHERE ctid NOT IN (
                    SELECT ctid FROM (
                        SELECT ctid, ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY published_at DESC NULLS LAST) as rn
                        FROM market_news
                    ) ranked WHERE rn <= 20
                )
            """)
        conn.commit()
    except Exception as e:
        conn.rollback()
        log.debug(f"Prune news: {e}")


# ─────────────────────────────────────────────────
# 실시간 시장 순위 (거래대금 / 거래량)
# ─────────────────────────────────────────────────

def fetch_naver_rankings(conn):
    """시장 순위 갱신:
    1차: 한국투자증권 Open API (거래량 순위 / 등락률 순위)
    2차: 네이버 sise_quant.naver 스크래핑 (KOSPI+KOSDAQ 합산, 100위까지)
    """
    # ── 1차: 한투 Open API 순위 ───────────────────────────────────────────
    if KIS_ENABLED and kis_is_available():
        try:
            now = datetime.now(KST)
            vol_items = kis_fetch_volume_ranking(top_n=50)
            flu_items = kis_fetch_fluctuation_ranking(top_n=50)

            if vol_items or flu_items:
                # 가격 정보를 stocks_realtime에도 반영
                all_items = {i["ticker"]: i for i in vol_items + flu_items}
                with conn.cursor() as cur:
                    for ticker, d in all_items.items():
                        if d.get("price", 0) > 0:
                            cur.execute("""
                                UPDATE stocks_realtime
                                SET current_price=%s, change_pct=%s,
                                    naver_change_pct=%s,
                                    volume=GREATEST(volume, %s), updated_at=NOW()
                                WHERE ticker=%s
                            """, (d["price"], d["change_pct"], d["change_pct"],
                                  d.get("volume", 0), ticker))
                conn.commit()

                with conn.cursor() as cur:
                    if vol_items:
                        cur.execute("DELETE FROM market_rankings WHERE type='volume'")
                        execute_values(cur, """
                            INSERT INTO market_rankings
                                (type, rank, ticker, name, price, change_pct, volume, trade_amount, updated_at)
                            VALUES %s
                        """, [("volume", i+1, s["ticker"], s["name"], s["price"],
                                s["change_pct"], s.get("volume",0), s.get("trade_amount",0), now)
                              for i, s in enumerate(vol_items)])
                    if flu_items:
                        cur.execute("DELETE FROM market_rankings WHERE type='fluctuation'")
                        execute_values(cur, """
                            INSERT INTO market_rankings
                                (type, rank, ticker, name, price, change_pct, volume, trade_amount, updated_at)
                            VALUES %s
                        """, [("fluctuation", i+1, s["ticker"], s["name"], s["price"],
                                s["change_pct"], s.get("volume",0), 0, now)
                              for i, s in enumerate(flu_items)])
                conn.commit()
                log.info(f"[KIS] 순위 업데이트: 거래량 {len(vol_items)}개, 등락률 {len(flu_items)}개")
                return  # 성공 시 네이버 스크래핑 스킵
        except Exception as e:
            log.warning(f"[KIS] 순위 업데이트 실패, 네이버 fallback: {e}")

    # ── 2차: 네이버 스크래핑 (fallback) ──────────────────────────────────
    import requests
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return

    def _sint(s: str) -> int:
        s = s.strip().replace(",", "").replace("+", "").replace("%", "")
        try:
            return int(float(s)) if s and s.replace(".", "", 1).lstrip("-").isdigit() else 0
        except Exception:
            return 0

    def _parse_quant(sosok: int, market: str) -> list:
        """네이버 sise_quant.naver (거래대금 상위) 스크래핑"""
        url = f"https://finance.naver.com/sise/sise_quant.naver?sosok={sosok}&page=1"
        try:
            r = requests.get(url, headers=NAVER_WEB_HEADERS, timeout=8)
            r.encoding = "euc-kr"
            soup = BeautifulSoup(r.text, "html.parser")
            items = []
            for row in soup.select("table.type_2 tr"):
                link = row.select_one('a[href*="code="]')
                if not link:
                    continue
                code = link["href"].split("code=")[-1][:6]
                if not code.isdigit() or len(code) != 6:
                    continue
                name = link.get_text(strip=True)
                tds = row.select("td")
                ct = [td.get_text(strip=True) for td in tds]
                n = len(ct)
                price  = _sint(ct[2]) if n > 2 else 0
                volume = _sint(ct[5]) if n > 5 else 0
                # ct[6] = 거래대금(백만원 단위) in sise_quant
                ta     = _sint(ct[6]) * 1_000_000 if n > 6 else price * volume
                chg    = 0.0
                try:
                    raw = ct[4].strip().replace(",", "").replace("+", "").replace("%", "") if n > 4 else ""
                    sign = -1 if ct[4].strip().startswith("-") else 1
                    chg  = float(raw.lstrip("-")) * sign if raw else 0.0
                except Exception:
                    pass
                if price <= 0:
                    continue
                items.append({
                    "ticker": code, "name": name, "price": price,
                    "change_pct": chg, "volume": volume, "trade_amount": ta, "market": market,
                })
            return items
        except Exception as e:
            log.debug(f"_parse_quant sosok={sosok}: {e}")
            return []

    try:
        now = datetime.now(KST)

        # ── 거래대금 + 거래량: Naver sise_quant 스크래핑 (KOSPI + KOSDAQ 각 2페이지) ──
        ta_k  = _parse_quant(0, "KOSPI")
        ta_kq = _parse_quant(1, "KOSDAQ")
        combined = ta_k + ta_kq  # 실제 Naver 거래대금/거래량 데이터

        all_ta  = sorted(combined, key=lambda x: x["trade_amount"], reverse=True)[:100]
        all_vol = sorted(combined, key=lambda x: x["volume"],       reverse=True)[:100]

        # ── sise_quant에서 얻은 실제 거래량을 stocks_realtime에도 반영 ──
        if combined:
            with conn.cursor() as cur:
                for s in combined:
                    if s["volume"] > 0:
                        cur.execute("""
                            UPDATE stocks_realtime
                            SET volume=%s, current_price=%s, base_price=%s,
                                change_pct=%s, naver_change_pct=%s, updated_at=NOW()
                            WHERE ticker=%s
                        """, (s["volume"], s["price"], s["price"],
                              s["change_pct"], s["change_pct"], s["ticker"]))
            conn.commit()
            log.info(f"거래량 DB 반영: {len(combined)}종목 (sise_quant 실데이터)")

        with conn.cursor() as cur:
            if all_ta:
                cur.execute("DELETE FROM market_rankings WHERE type='trade_amount'")
                execute_values(cur, """
                    INSERT INTO market_rankings
                        (type, rank, ticker, name, price, change_pct, volume, trade_amount, market, updated_at)
                    VALUES %s
                """, [("trade_amount", i+1, s["ticker"], s["name"], s["price"],
                        s["change_pct"], s["volume"], s["trade_amount"], s["market"], now)
                      for i, s in enumerate(all_ta)])

            if all_vol:
                cur.execute("DELETE FROM market_rankings WHERE type='volume'")
                execute_values(cur, """
                    INSERT INTO market_rankings
                        (type, rank, ticker, name, price, change_pct, volume, trade_amount, market, updated_at)
                    VALUES %s
                """, [("volume", i+1, s["ticker"], s["name"], s["price"],
                        s["change_pct"], s["volume"], s["trade_amount"], s["market"], now)
                      for i, s in enumerate(all_vol)])

        conn.commit()
        log.info(f"Rankings OK: 거래대금 {len(all_ta)}개 거래량 {len(all_vol)}개")
    except Exception as e:
        log.warning(f"fetch_naver_rankings: {e}")
        conn.rollback()


def simulate_rankings_dynamic(conn):
    """
    단기 거래량/거래대금 시뮬레이션 — 10초마다 호출.
    현재 stocks_realtime에서 상위 150종목 추출 후,
    ±40% 랜덤 노이즈를 곱해 단기 순위를 매 사이클마다 변동시킴.
    장 중(09:00~15:30 KST 평일)에만 실행.
    """
    import pytz
    from datetime import datetime as _dt
    kr_tz = pytz.timezone("Asia/Seoul")
    now_kr = _dt.now(kr_tz)
    is_weekday = now_kr.weekday() < 5
    market_open  = now_kr.replace(hour=9,  minute=0,  second=0, microsecond=0)
    market_close = now_kr.replace(hour=15, minute=30, second=0, microsecond=0)
    if not (is_weekday and market_open <= now_kr <= market_close):
        return  # 장 마감 / 주말 → 순위 변동 없음

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ticker, name, current_price, change_pct, volume, market
                FROM stocks_realtime
                WHERE volume > 0 AND current_price > 0
                ORDER BY volume DESC
                LIMIT 150
            """)
            rows = cur.fetchall()

        if not rows:
            return

        now = datetime.now(KST)
        # 단기 가중치: 기본 volume에 ±40% 랜덤 노이즈 적용
        candidates = []
        for ticker, name, price, chg_pct, volume, market in rows:
            p = float(price) if price else 0
            v = int(volume) if volume else 0
            c = float(chg_pct) if chg_pct else 0.0
            weight = random.uniform(0.60, 1.40)
            recent_vol = int(v * weight)
            recent_ta  = int(p * recent_vol)
            candidates.append({
                "ticker": ticker, "name": name, "price": p,
                "change_pct": c, "volume": recent_vol,
                "trade_amount": recent_ta, "market": market or "KOSPI",
            })

        all_ta  = sorted(candidates, key=lambda x: x["trade_amount"], reverse=True)[:100]
        all_vol = sorted(candidates, key=lambda x: x["volume"],       reverse=True)[:100]

        with conn.cursor() as cur:
            cur.execute("DELETE FROM market_rankings WHERE type='trade_amount'")
            execute_values(cur, """
                INSERT INTO market_rankings
                    (type, rank, ticker, name, price, change_pct, volume, trade_amount, market, updated_at)
                VALUES %s
            """, [("trade_amount", i+1, s["ticker"], s["name"], s["price"],
                    s["change_pct"], s["volume"], s["trade_amount"], s["market"], now)
                  for i, s in enumerate(all_ta)])

            cur.execute("DELETE FROM market_rankings WHERE type='volume'")
            execute_values(cur, """
                INSERT INTO market_rankings
                    (type, rank, ticker, name, price, change_pct, volume, trade_amount, market, updated_at)
                VALUES %s
            """, [("volume", i+1, s["ticker"], s["name"], s["price"],
                    s["change_pct"], s["volume"], s["trade_amount"], s["market"], now)
                  for i, s in enumerate(all_vol)])
        conn.commit()
    except Exception as e:
        log.warning(f"simulate_rankings_dynamic: {e}")
        conn.rollback()


# ─────────────────────────────────────────────────
# IPO (공모주) 데이터
# ─────────────────────────────────────────────────

def fetch_ipo_from_naver(conn):
    """네이버 금융 공모주 페이지에서 상장 예정 종목 가져오기."""
    try:
        import requests
        from bs4 import BeautifulSoup

        url = "https://finance.naver.com/ipo/ipo_schedule.naver"
        r = requests.get(url, headers=NAVER_WEB_HEADERS, timeout=10)
        if r.status_code != 200:
            log.warning(f"IPO page HTTP {r.status_code}")
            return

        r.encoding = "euc-kr"
        soup = BeautifulSoup(r.text, "html.parser")

        ipos = []
        rows = soup.select("table.type_1 tr, table.type_2 tr")

        for row in rows:
            cols = row.select("td")
            link = row.select_one('a[href*="code="], a[href*="ipoCode="]')
            if not cols or len(cols) < 4:
                continue

            name = ""
            ticker = ""
            if link:
                name = link.get_text(strip=True)
                href = link.get("href", "")
                for param in ["code=", "ipoCode="]:
                    if param in href:
                        ticker = href.split(param)[-1][:6]
                        break

            if not name:
                name_col = cols[0].get_text(strip=True)
                if name_col:
                    name = name_col

            if not name or not name[0].isalpha() and not name[0] in '가나다라마바사아자차카타파하':
                continue

            ct = [c.get_text(strip=True).replace(",", "") for c in cols]

            # 종목코드가 없으면 스킵
            if not ticker or len(ticker) != 6:
                continue

            # 상장일 파싱
            listing_date = None
            for val in ct:
                for fmt in ("%Y.%m.%d", "%Y-%m-%d", "%Y/%m/%d"):
                    try:
                        listing_date = datetime.strptime(val, fmt).date()
                        break
                    except Exception:
                        pass
                if listing_date:
                    break

            if not listing_date:
                continue

            # 공모가
            ipo_price = None
            for val in ct:
                clean = val.replace(",", "").replace("원", "")
                if clean.isdigit() and 1000 <= int(clean) <= 2000000:
                    ipo_price = int(clean)
                    break

            ipos.append({
                "ticker": ticker,
                "name": name,
                "market": "KOSPI",
                "ipo_price": ipo_price,
                "listing_date": listing_date,
            })

        if ipos:
            with conn.cursor() as cur:
                execute_values(cur, """
                    INSERT INTO ipo_stocks (ticker, name, market, ipo_price, listing_date)
                    VALUES %s
                    ON CONFLICT (ticker) DO UPDATE SET
                        name         = EXCLUDED.name,
                        ipo_price    = COALESCE(EXCLUDED.ipo_price, ipo_stocks.ipo_price),
                        listing_date = EXCLUDED.listing_date
                """, [(s["ticker"], s["name"], s["market"], s["ipo_price"], s["listing_date"]) for s in ipos])
            conn.commit()
            log.info(f"IPO 데이터 저장: {len(ipos)}건")
        else:
            log.info("IPO 파싱 결과 없음 — 대체 방식 시도")
            _seed_ipo_from_naver_api(conn)

    except ImportError:
        log.warning("BeautifulSoup not available for IPO fetch")
        _seed_ipo_from_naver_api(conn)
    except Exception as e:
        log.warning(f"IPO fetch: {e}")
        _seed_ipo_from_naver_api(conn)


def _seed_ipo_from_naver_api(conn):
    """Naver Mobile API에서 공모주 데이터 가져오기 (대체 방식)."""
    try:
        import requests
        # Naver mobile API - 공모주 상장 예정
        endpoints = [
            "https://m.stock.naver.com/api/stocks/newstock/list?category=upcoming",
            "https://m.stock.naver.com/api/stocks/ipo?page=0&pageSize=20",
        ]
        for url in endpoints:
            try:
                r = requests.get(url, headers=NAVER_HEADERS, timeout=6)
                if r.status_code == 200:
                    data = r.json()
                    items = data if isinstance(data, list) else data.get("list", data.get("items", []))
                    if items:
                        ipos = []
                        for item in items[:20]:
                            ticker = item.get("stockCode", item.get("code", ""))
                            name = item.get("stockName", item.get("name", ""))
                            if not ticker or not name:
                                continue
                            listing_str = item.get("listingDate", item.get("ipoDate", ""))
                            try:
                                listing_date = datetime.strptime(listing_str[:10], "%Y-%m-%d").date()
                            except Exception:
                                continue
                            ipo_price_str = str(item.get("ipoPrice", "0")).replace(",", "")
                            ipo_price = int(ipo_price_str) if ipo_price_str.isdigit() else None
                            ipos.append((ticker, name, "KOSPI", ipo_price, listing_date))

                        if ipos:
                            with conn.cursor() as cur:
                                execute_values(cur, """
                                    INSERT INTO ipo_stocks (ticker, name, market, ipo_price, listing_date)
                                    VALUES %s ON CONFLICT (ticker) DO UPDATE SET
                                        listing_date = EXCLUDED.listing_date,
                                        ipo_price = COALESCE(EXCLUDED.ipo_price, ipo_stocks.ipo_price)
                                """, ipos)
                            conn.commit()
                            log.info(f"IPO API 저장: {len(ipos)}건")
                            return
            except Exception:
                continue
    except Exception as e:
        log.debug(f"IPO API: {e}")


def promote_ipo_to_realtime(conn):
    """상장일이 된 IPO 종목을 stocks_realtime에 자동 추가."""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT i.ticker, i.name, i.market, i.ipo_price
                FROM ipo_stocks i
                LEFT JOIN stocks_realtime s ON s.ticker = i.ticker
                WHERE i.listing_date <= CURRENT_DATE
                  AND s.ticker IS NULL
            """)
            to_promote = cur.fetchall()

        for ticker, name, market, ipo_price in to_promote:
            base = int(ipo_price) if ipo_price else FALLBACK_PRICES.get(ticker, 10000)
            # 첫날은 공모가 기준으로 최대 ±30% 범위
            current = int(base * (1 + (random.random() - 0.3) * 0.3))
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO stocks_realtime
                        (ticker, name, current_price, base_price, change_val, change_pct, volume, market_cap, market)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO NOTHING
                """, (ticker, name, current, base,
                      current - base, round((current - base) / base * 100, 2),
                      500000, current * 100000, market))
            conn.commit()
            log.info(f"신규 상장: {name}({ticker}) → {current:,}원")
    except Exception as e:
        log.warning(f"promote_ipo: {e}")


# ─────────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────────

def main():
    log.info("=== 원광증권 KRX Fetcher 시작 ===")

    # 한투 Open API 초기화 확인
    if KIS_ENABLED:
        if kis_is_available():
            log.info("[KIS] 한국투자증권 Open API 연결 성공 — 실시간 시세 조회 활성화")
            log.info("[KIS] ※ 시세 조회 전용, 모의투자 매수/매도는 내부 DB에서 처리")
        else:
            log.warning("[KIS] API 키 설정됨 but 토큰 발급 실패 — 네이버 fallback 사용")
    else:
        log.info("[KIS] kis_api 모듈 없음 — 네이버 금융으로 시세 조회")

    conn = get_conn()
    create_tables(conn)
    seed_realtime(conn)    # 전체 종목 목록 로딩 (KOSPI+KOSDAQ 전체) — 필수 동기

    # 나머지 초기화는 백그라운드에서 실행 (메인 루프 차단 방지)
    def _init_bg():
        bg = get_conn()
        try:
            seed_history(bg)
            src = "한국투자증권 Open API + 네이버 금융" if (KIS_ENABLED and kis_is_available()) else "네이버 금융"
            log.info(f"초기 실시간 가격 로딩 ({src}, 백그라운드)...")
            update_realtime_prices(bg)
            update_indices(bg)
            refresh_all_news(bg)
            fetch_ipo_from_naver(bg)
            log.info("초기화 백그라운드 작업 완료")
        except Exception as e:
            log.error(f"[INIT_BG] {e}")
            traceback.print_exc()
        finally:
            try:
                bg.close()
            except Exception:
                pass

    threading.Thread(target=_init_bg, name="bg-init", daemon=True).start()
    log.info("초기화 백그라운드 시작 — 메인 루프 즉시 진입")

    # ── 백그라운드 스레드 헬퍼 ──────────────────────────────────────────────
    # 각 느린 작업은 자체 DB 커넥션을 갖는 데몬 스레드에서 실행.
    # 메인 루프는 simulate_prices(매 1초)만 담당 → 블로킹 없음.
    _bg_threads: dict = {}

    def _bg_run(name: str, fn, *args):
        """name 키로 단일 인스턴스 백그라운드 스레드 실행. 이미 실행 중이면 스킵."""
        existing = _bg_threads.get(name)
        if existing and existing.is_alive():
            return  # 이전 작업이 아직 완료되지 않음 — 중복 실행 방지

        def _worker():
            bg_conn = None
            try:
                bg_conn = get_conn()
                fn(bg_conn, *args)
            except Exception as exc:
                log.error(f"[BG:{name}] {exc}")
                traceback.print_exc()
            finally:
                if bg_conn:
                    try:
                        bg_conn.close()
                    except Exception:
                        pass

        t = threading.Thread(target=_worker, name=f"bg-{name}", daemon=True)
        _bg_threads[name] = t
        t.start()

    # 히스토리 배치 상태 (메인 스레드에서 관리, 실제 I/O는 백그라운드)
    full_history_ticker_idx = 0
    full_history_tickers: list = []
    full_history_lock = threading.Lock()

    def _history_batch_worker(bg_conn):
        nonlocal full_history_ticker_idx, full_history_tickers
        with full_history_lock:
            if not full_history_tickers:
                with bg_conn.cursor() as cur:
                    cur.execute("SELECT ticker FROM stocks_realtime ORDER BY COALESCE(market_cap,0) DESC")
                    full_history_tickers = [r[0] for r in cur.fetchall()]
                full_history_ticker_idx = 0
                log.info(f"수정주가 히스토리 배치 시작: {len(full_history_tickers)}종목 큐")
            batch = full_history_tickers[full_history_ticker_idx:full_history_ticker_idx + 5]
            full_history_ticker_idx += 5
            if full_history_ticker_idx >= len(full_history_tickers):
                full_history_ticker_idx = 0
                log.info("수정주가 히스토리 배치 1라운드 완료")
        for t in batch:
            try:
                n = fetch_full_history_ticker(bg_conn, t)
                if n > 0:
                    log.debug(f"  수정주가 히스토리: {t} → {n}일")
            except Exception as e:
                log.debug(f"  히스토리 스킵 {t}: {e}")

    # ── 메인 루프 (simulate_prices 전용, 나머지는 백그라운드) ────────────
    cycle = 0
    last_stock_list_refresh = time.time()
    last_batch_price_update = time.time()
    last_ipo_check          = time.time()

    while True:
        try:
            cycle += 1
            now = time.time()

            # ★ 매 1s: 브라운 운동 시뮬레이션 — 절대 블로킹 없음
            simulate_prices(conn)

            # 매 10s: 단기 동적 순위 시뮬레이션 (장 중에만 변동)
            if cycle % 10 == 0:
                _bg_run("rankings", simulate_rankings_dynamic)

            # 매 60s: 네이버 실제 랭킹 동기화 (백그라운드)
            if cycle % 60 == 0:
                _bg_run("naver_rankings", fetch_naver_rankings)

            # 매 60s: 네이버 상위 500종목 실제 가격 업데이트 (~35초, 백그라운드)
            if cycle % 60 == 0:
                _bg_run("price_update", update_realtime_prices)

            # 매 120s: 글로벌 지수 (백그라운드)
            if cycle % 120 == 0:
                _bg_run("indices", update_indices)

            # 매 5분: 뉴스 (백그라운드)
            if cycle % 300 == 0:
                _bg_run("news", refresh_all_news)

            # 매 5분: 전체 종목 일괄 가격 (백그라운드)
            if now - last_batch_price_update > 300:
                log.info("5분 경과 — 전체 종목 일괄 가격 업데이트 (백그라운드)...")
                _bg_run("listing_prices", update_all_prices_from_listing)
                last_batch_price_update = now

            # 매 1시간: 종목 목록 재갱신 (백그라운드)
            if now - last_stock_list_refresh > 3600:
                log.info("1시간 경과 — 전체 종목 목록 재갱신 (백그라운드)...")
                _bg_run("stock_list", seed_all_stocks_dynamic)
                last_stock_list_refresh = now

            # 매 1시간: IPO 체크 (백그라운드)
            if now - last_ipo_check > 3600:
                log.info("1시간 경과 — IPO 체크 (백그라운드)...")
                def _ipo_worker(bg_conn):
                    fetch_ipo_from_naver(bg_conn)
                    promote_ipo_to_realtime(bg_conn)
                _bg_run("ipo", _ipo_worker)
                last_ipo_check = now

            # 매 50s: 수정주가 히스토리 배치 5종목 (백그라운드)
            if cycle % 50 == 0:
                _bg_run("history", _history_batch_worker)

            if cycle % 30 == 0:
                alive = sum(1 for t in _bg_threads.values() if t.is_alive())
                log.info(f"Cycle {cycle} OK (BG threads alive: {alive})")

        except psycopg2.Error as e:
            log.error(f"DB error: {e}")
            try:
                conn.rollback()
            except Exception:
                conn = get_conn()
        except Exception as e:
            log.error(f"Cycle error: {e}")
            traceback.print_exc()

        time.sleep(1)  # 1초 주기 — simulate_prices 전용


if __name__ == "__main__":
    main()
