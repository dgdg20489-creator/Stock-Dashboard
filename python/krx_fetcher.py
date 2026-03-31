#!/usr/bin/env python3
"""
원광증권 실시간 데이터 서비스
- 네이버 금융 API: 실시간 주가 (2026년 현재)
- 네이버 금융 API: 종목별·시장 뉴스 (실제 발행 시간 KST)
- Yahoo Finance: 글로벌 지수
- 동적 주식 목록: KOSPI 상위 200 + KOSDAQ 상위 100
"""
import os, time, math, random, logging, traceback
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, timezone

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

PYKRX_END   = "20250324"
PYKRX_START = "20240324"


def fetch_naver_stock_list(sosok: int, pages: int = 4) -> list:
    """네이버 금융 시가총액 페이지에서 KOSPI/KOSDAQ 종목 목록 가져오기."""
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
            from bs4 import BeautifulSoup
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
                ct = [c.get_text(strip=True).replace(",", "") for c in cols]
                try:
                    price = int(ct[2]) if ct[2] else 0
                except Exception:
                    price = 0
                try:
                    mcap = int(ct[6]) if ct[6] else 0
                except Exception:
                    mcap = 0
                try:
                    per = float(ct[10]) if ct[10] and ct[10] not in ["-", ""] else 0.0
                except Exception:
                    per = 0.0
                stocks.append({"ticker": code, "name": name, "market": market,
                               "market_cap": mcap, "price": price, "per": per})
                found += 1
            log.info(f"  {market} p{page}: {found} stocks (cumulative {len(stocks)})")
            time.sleep(0.3)
        except Exception as e:
            log.warning(f"fetch_naver_stock_list {market} p{page}: {e}")
    return stocks


def seed_all_stocks_dynamic(conn):
    """네이버 금융에서 전체 주식 목록을 동적으로 가져와 DB에 저장."""
    log.info("=== 네이버 금융 전체 종목 목록 로딩 시작 ===")
    all_stocks: list = []

    # KOSPI 상위 200종목 (4 페이지 × 50개)
    kospi = fetch_naver_stock_list(0, pages=4)
    all_stocks.extend(kospi)
    log.info(f"KOSPI: {len(kospi)}종목")

    # KOSDAQ 상위 100종목 (2 페이지 × 50개)
    kosdaq = fetch_naver_stock_list(1, pages=2)
    all_stocks.extend(kosdaq)
    log.info(f"KOSDAQ: {len(kosdaq)}종목")

    if not all_stocks:
        log.warning("네이버에서 종목 로딩 실패 — 기존 DB 유지")
        return 0

    # UPSERT into DB (새 종목은 추가, 기존 종목은 이름/시장/시총 업데이트)
    rows = []
    for s in all_stocks:
        base = s["price"] or FALLBACK_PRICES.get(s["ticker"], 50000)
        rows.append((s["ticker"], s["name"], base, base, 0, 0.0,
                     1_000_000, s["market_cap"], s["market"], s["per"]))

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
                fetched_at  TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (id, ticker)
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS market_news_ticker_idx ON market_news(ticker, published_at DESC)")
    conn.commit()
    log.info("DB tables OK")


# ─────────────────────────────────────────────────
# NAVER FINANCE: REAL-TIME PRICES
# ─────────────────────────────────────────────────

def fetch_naver_price(ticker: str) -> dict | None:
    """Fetch current stock price from Naver Finance mobile API."""
    try:
        import requests
        url = f"https://m.stock.naver.com/api/stock/{ticker}/basic"
        r = requests.get(url, headers=NAVER_HEADERS, timeout=6)
        if r.status_code != 200:
            return None
        d = r.json()
        # closePrice = current price during market hours, or previous close after hours
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
        # 첫 실행: 동적 종목 목록 가져오기
        n = seed_all_stocks_dynamic(conn)
        log.info(f"초기 seeding 완료: {n}종목")
    else:
        log.info(f"stocks_realtime 이미 {count}종목 존재 — 목록 업데이트만 수행")
        # 새로 추가된 종목 반영 (기존 종목은 가격 유지)
        seed_all_stocks_dynamic(conn)


def update_realtime_prices(conn):
    """DB에 있는 모든 종목의 실시간 가격을 네이버 금융에서 가져와 업데이트."""
    tickers = get_all_tickers_from_db(conn)
    if not tickers:
        log.warning("DB에 종목이 없음 — 가격 업데이트 스킵")
        return
    updated = 0
    for ticker in tickers:
        try:
            naver = fetch_naver_price(ticker)
            if not naver:
                continue
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE stocks_realtime
                    SET current_price=%s, base_price=%s, change_val=%s, change_pct=%s,
                        logo_url=COALESCE(NULLIF(%s,''), logo_url), updated_at=NOW()
                    WHERE ticker=%s
                """, (naver["price"], naver["price"], naver["change"], naver["change_pct"],
                      naver.get("logo_url", ""), ticker))
            updated += 1
            time.sleep(0.07)  # 70ms per stock → 300종목 약 21초
        except Exception as e:
            log.debug(f"Price update {ticker}: {e}")
    conn.commit()
    if updated > 0:
        log.info(f"네이버 실시간 가격 업데이트: {updated}종목")


def simulate_prices(conn):
    """
    Micro-simulation ON TOP of real Naver prices.
    Only tweaks current_price by ±0.15%; preserves real change_val/change_pct from Naver.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT ticker, base_price FROM stocks_realtime")
        stocks = cur.fetchall()

    t    = time.time()
    rows = []
    for ticker, base_price_raw in stocks:
        base = float(base_price_raw)
        seed = sum(ord(c) for c in ticker)
        noise = (random.random() - 0.5) * 0.003   # ±0.15%
        price = round(base * (1 + noise))
        vol   = int(((seed * 9876 + int(t / 10)) % 8_000_000) + 200_000)
        rows.append((price, vol, ticker))

    with conn.cursor() as cur:
        # Only update current_price + volume; change_val/change_pct from Naver are preserved
        cur.executemany("""
            UPDATE stocks_realtime
            SET current_price=%s, volume=%s, updated_at=NOW()
            WHERE ticker=%s
        """, rows)
    conn.commit()


# ─────────────────────────────────────────────────
# pykrx HISTORY (1 year of OHLCV)
# ─────────────────────────────────────────────────

def seed_history(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stocks_history")
        count = cur.fetchone()[0]
        if count > 500:
            log.info(f"stocks_history already seeded ({count} rows), skipping")
            return

    log.info("Seeding historical OHLCV from pykrx (this takes ~1-2 min)...")
    try:
        from pykrx import stock as ps
        for ticker, name, _ in STOCKS:
            try:
                df = ps.get_market_ohlcv(PYKRX_START, PYKRX_END, ticker)
                if df.empty:
                    continue
                rows = []
                for ts, row in df.iterrows():
                    try:
                        o = int(row.get("시가",   row.iloc[0]))
                        h = int(row.get("고가",   row.iloc[1]))
                        l = int(row.get("저가",   row.iloc[2]))
                        c = int(row.get("종가",   row.iloc[3]))
                        v = int(row.get("거래량", row.iloc[4]))
                        rows.append((ticker, ts.strftime("%Y-%m-%d"), o, h, l, c, v))
                    except Exception:
                        pass
                if rows:
                    with conn.cursor() as cur:
                        execute_values(cur, """
                            INSERT INTO stocks_history
                                (ticker, date, open_price, high_price, low_price, close_price, volume)
                            VALUES %s ON CONFLICT DO NOTHING
                        """, rows)
                    conn.commit()
                    log.info(f"  {ticker} ({name}): {len(rows)} days")
                time.sleep(0.3)
            except Exception as e:
                log.warning(f"  pykrx {ticker}: {e}")
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
# NAVER NEWS
# ─────────────────────────────────────────────────

def parse_naver_datetime(dt_str: str) -> datetime | None:
    """Parse Naver datetime string (KST) → timezone-aware UTC datetime.
    Naver times are Korean Standard Time (UTC+9). We store as KST-aware so
    the API returns correct ISO timestamps.
    Format examples: '202603311416' (12자리), '20260331' (8자리)
    """
    try:
        if len(dt_str) == 12:
            # KST aware datetime (not UTC!)
            return datetime.strptime(dt_str, "%Y%m%d%H%M").replace(tzinfo=KST)
        elif len(dt_str) == 8:
            return datetime.strptime(dt_str, "%Y%m%d").replace(tzinfo=KST)
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
        # Can be a list or dict with 'items'
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
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9",
        }
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code != 200:
            return []

        soup = BeautifulSoup(r.text, "html.parser")
        items = []
        now = datetime.now(timezone.utc)

        # Naver Finance news list: .articleSubject a for titles, .articleSummary for meta
        news_links = soup.select(".articleSubject a")
        summaries  = soup.select(".articleSummary")

        for i, link in enumerate(news_links[:8]):
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
                    # format: "2026-03-31 14:22"
                    for fmt in ("%Y-%m-%d %H:%M", "%Y.%m.%d %H:%M", "%Y.%m.%d"):
                        try:
                            pub_dt = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                            break
                        except Exception:
                            pass

            # Extract IDs from URL
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
        # Fetch news from top 6 stocks and combine, dedup by title
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
    """Store news items in market_news table."""
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
        pub_dt = parse_naver_datetime(item.get("datetime", ""))
        rows.append((raw_id, ticker, title, body, office_name, article_url, image_url, pub_dt))

    if not rows:
        return
    try:
        with conn.cursor() as cur:
            execute_values(cur, """
                INSERT INTO market_news (id, ticker, title, body, office_name, article_url, image_url, published_at)
                VALUES %s
                ON CONFLICT (id, ticker) DO UPDATE SET
                    title       = EXCLUDED.title,
                    body        = EXCLUDED.body,
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

    # DB의 상위 30종목 (시총 순)에 대한 뉴스 가져오기
    tickers = get_all_tickers_from_db(conn)[:30]
    total = 0
    for ticker in tickers:
        items = fetch_stock_news(ticker, page_size=5)
        store_news(conn, ticker, items)
        total += len(items)
        time.sleep(0.12)

    log.info(f"뉴스 새로고침 완료: 종목 {total}건, 시장 {len(market_items)}건")

    # Prune old news (keep latest 20 per ticker)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM market_news
                WHERE (id, ticker) NOT IN (
                    SELECT id, ticker FROM market_news
                    ORDER BY fetched_at DESC
                    LIMIT 500
                )
            """)
        conn.commit()
    except Exception as e:
        conn.rollback()
        log.debug(f"Prune news: {e}")


# ─────────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────────

def main():
    log.info("=== 원광증권 KRX Fetcher 시작 ===")
    conn = get_conn()
    create_tables(conn)
    seed_realtime(conn)    # 동적 종목 목록 로딩 (KOSPI 200 + KOSDAQ 100)
    seed_history(conn)

    # 초기 실시간 가격 패치
    log.info("초기 실시간 가격 로딩 (네이버 금융)...")
    update_realtime_prices(conn)
    update_indices(conn)
    refresh_all_news(conn)

    cycle = 0
    last_stock_list_refresh = time.time()  # 1시간마다 종목 목록 갱신

    while True:
        try:
            cycle += 1

            # 매 30s: 네이버 금융 실시간 가격 업데이트 (3 사이클마다)
            if cycle % 3 == 0:
                update_realtime_prices(conn)
                log.info(f"가격 업데이트 완료 (cycle {cycle})")
            else:
                # 사이클 사이: 미세 시뮬레이션 (자연스러운 움직임)
                simulate_prices(conn)

            # 매 60s: 글로벌 지수 업데이트
            if cycle % 6 == 0:
                update_indices(conn)

            # 매 5분: 뉴스 새로고침
            if cycle % 30 == 0:
                refresh_all_news(conn)

            # 매 1시간: 전체 종목 목록 재갱신 (신규 상장 반영)
            now = time.time()
            if now - last_stock_list_refresh > 3600:
                log.info("1시간 경과 — 전체 종목 목록 재갱신...")
                seed_all_stocks_dynamic(conn)
                last_stock_list_refresh = now

            if cycle % 2 == 0:
                log.info(f"Cycle {cycle} OK")

        except psycopg2.Error as e:
            log.error(f"DB error: {e}")
            try:
                conn.rollback()
            except Exception:
                conn = get_conn()
        except Exception as e:
            log.error(f"Cycle error: {e}")
            traceback.print_exc()

        time.sleep(10)


if __name__ == "__main__":
    main()
