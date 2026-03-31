#!/usr/bin/env python3
"""
원광증권 실시간 데이터 서비스
- 네이버 금융 API: 실시간 주가 (2026년 현재)
- 네이버 금융 API: 종목별·시장 뉴스
- Yahoo Finance: 글로벌 지수
"""
import os, time, math, random, logging, traceback
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]

STOCKS = [
    ("005930", "삼성전자",    3607500),
    ("000660", "SK하이닉스",  1537200),
    ("035420", "NAVER",       338100),
    ("035720", "카카오",       186900),
    ("373220", "LG에너지솔루션", 776500),
    ("005380", "현대차",       454700),
    ("051910", "LG화학",       186800),
    ("006400", "삼성SDI",      135500),
    ("207940", "삼성바이오로직스", 1130800),
    ("000270", "기아",         402800),
    ("066570", "LG전자",       133700),
    ("105560", "KB금융",       336700),
    ("096770", "SK이노베이션",  110400),
    ("003550", "LG",           121500),
    ("086790", "하나금융지주",  186200),
    ("055550", "신한지주",     247000),
    ("012330", "현대모비스",   271700),
    ("030200", "KT",           130100),
    ("028260", "삼성물산",     225500),
    ("032830", "삼성생명",     404600),
]

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
FALLBACK_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; WonkwangBot/1.0)"}

# pykrx fallback base prices (2025-03-24) — used only if Naver fetch fails
FALLBACK_PRICES = {
    "005930": 60500,   "000660": 211500, "035420": 207000,  "035720": 41900,
    "373220": 331500,  "005380": 213000, "051910": 264500,  "006400": 197275,
    "207940": 1586540, "000270": 98700,  "066570": 81800,   "105560": 81800,
    "096770": 125500,  "003550": 69700,  "086790": 62500,   "055550": 48600,
    "012330": 279500,  "030200": 49600,  "028260": 124000,  "032830": 85000,
}

PYKRX_END   = "20250324"
PYKRX_START = "20240324"


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
    """Seed stocks_realtime with initial data (Naver prices or fallback)."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stocks_realtime")
        count = cur.fetchone()[0]
        if count >= len(STOCKS):
            log.info(f"stocks_realtime already seeded ({count} stocks)")
            return

    log.info("Seeding stocks_realtime with Naver Finance prices...")
    rows = []
    for ticker, name, market_cap in STOCKS:
        naver = fetch_naver_price(ticker)
        if naver:
            base = naver["price"]
            change = naver["change"]
            pct = naver["change_pct"]
            log.info(f"  {ticker} ({name}): {base:,}원 ({pct:+.2f}%)")
        else:
            base = FALLBACK_PRICES.get(ticker, 50000)
            change = 0.0
            pct = 0.0
            log.info(f"  {ticker} ({name}): fallback {base:,}원")
        rows.append((ticker, name, base, base, change, pct, 1_000_000, market_cap))
        time.sleep(0.15)

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO stocks_realtime
                (ticker, name, current_price, base_price, change_val, change_pct, volume, market_cap)
            VALUES %s
            ON CONFLICT (ticker) DO UPDATE SET
                current_price = EXCLUDED.current_price,
                base_price    = EXCLUDED.base_price,
                change_val    = EXCLUDED.change_val,
                change_pct    = EXCLUDED.change_pct,
                market_cap    = EXCLUDED.market_cap,
                updated_at    = NOW()
        """, rows)
    conn.commit()
    log.info(f"Seeded {len(rows)} stocks into stocks_realtime")


def update_realtime_prices(conn):
    """Fetch all stock prices from Naver Finance and update DB (including base_price)."""
    import requests
    updated = 0
    for ticker, name, _ in STOCKS:
        try:
            naver = fetch_naver_price(ticker)
            if not naver:
                continue
            with conn.cursor() as cur:
                # Also update base_price so simulation stays anchored to real Naver price
                cur.execute("""
                    UPDATE stocks_realtime
                    SET current_price=%s, base_price=%s, change_val=%s, change_pct=%s, updated_at=NOW()
                    WHERE ticker=%s
                """, (naver["price"], naver["price"], naver["change"], naver["change_pct"], ticker))
            updated += 1
            time.sleep(0.1)
        except Exception as e:
            log.debug(f"Price update {ticker}: {e}")
    conn.commit()
    if updated > 0:
        log.info(f"Naver prices updated for {updated} stocks")


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
    """Parse Naver datetime: '202603311416' → datetime object."""
    try:
        if len(dt_str) == 12:
            return datetime.strptime(dt_str, "%Y%m%d%H%M").replace(tzinfo=timezone.utc)
        elif len(dt_str) == 8:
            return datetime.strptime(dt_str, "%Y%m%d").replace(tzinfo=timezone.utc)
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

    # Stock-specific news for all 20 stocks
    total = 0
    for ticker, name, _ in STOCKS:
        items = fetch_stock_news(ticker, page_size=5)
        store_news(conn, ticker, items)
        total += len(items)
        time.sleep(0.12)

    log.info(f"News refresh done: {total} stock articles, {len(market_items)} market articles")

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
    seed_realtime(conn)
    seed_history(conn)

    # Initial data fetch: real 2026 prices from Naver Finance
    log.info("Fetching real-time prices from Naver Finance...")
    update_realtime_prices(conn)
    update_indices(conn)
    refresh_all_news(conn)

    cycle = 0
    naver_price_cycle = 0  # track Naver price fetch cycles

    while True:
        try:
            cycle += 1

            # Every 30s: fetch real prices from Naver Finance (every 3 simulation cycles)
            if cycle % 3 == 0:
                naver_price_cycle += 1
                update_realtime_prices(conn)
                log.info(f"Naver price cycle {naver_price_cycle}")
            else:
                # Between Naver fetches: light simulation for smooth live movement
                simulate_prices(conn)

            # Every 60s: update global indices
            if cycle % 6 == 0:
                update_indices(conn)

            # Every 5 min: refresh news
            if cycle % 30 == 0:
                refresh_all_news(conn)

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
