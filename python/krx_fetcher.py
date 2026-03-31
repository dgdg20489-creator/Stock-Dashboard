#!/usr/bin/env python3
"""
원광증권 실시간 데이터 서비스
pykrx 실제 한국 주식 데이터 + Yahoo Finance 글로벌 지수
"""
import os, time, math, random, logging, traceback
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta

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

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; WonkwangBot/1.0)"}

# Real pykrx prices (2025-03-24)
REAL_PRICES = {
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
    conn.commit()
    log.info("DB tables OK")


def seed_realtime(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stocks_realtime")
        count = cur.fetchone()[0]
        if count >= len(STOCKS):
            log.info(f"stocks_realtime already seeded ({count} stocks)")
            return

    rows = []
    for ticker, name, market_cap in STOCKS:
        base = REAL_PRICES.get(ticker, 50000)
        rows.append((ticker, name, base, base, 0.0, 0.0, 1_000_000, market_cap))

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO stocks_realtime
                (ticker, name, current_price, base_price, change_val, change_pct, volume, market_cap)
            VALUES %s
            ON CONFLICT (ticker) DO UPDATE SET
                base_price  = EXCLUDED.base_price,
                market_cap  = EXCLUDED.market_cap
        """, rows)
    conn.commit()
    log.info(f"Seeded {len(rows)} stocks into stocks_realtime")


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


def fetch_yahoo(sym: str):
    try:
        import requests
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=2d"
        r = requests.get(url, headers=HEADERS, timeout=8)
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


def simulate_prices(conn):
    """
    Realistic intraday price simulation:
    - Slow sine trend (period ~5 min) + micro noise
    - Separate daily drift per stock seeded by ticker
    """
    with conn.cursor() as cur:
        cur.execute("SELECT ticker, base_price FROM stocks_realtime")
        stocks = cur.fetchall()

    t    = time.time()
    rows = []
    for ticker, base_price_raw in stocks:
        base  = float(base_price_raw)
        seed  = sum(ord(c) for c in ticker)

        # Slow trend: period ~5 min, amplitude ±2%
        trend = math.sin(t / 300 + seed * 0.17) * 0.02
        # Fast noise: ±0.3%
        noise = (random.random() - 0.5) * 0.006
        # Very slow daily drift: period ~3 hours, amplitude ±1.5%
        drift = math.sin(t / 10800 + seed * 0.41) * 0.015

        factor = trend + noise + drift
        price  = round(base * (1 + factor))
        change = price - base
        pct    = round((change / base) * 100, 2)

        # Volume: large variation, realistic for Korean market
        vol = int(((seed * 9876 + int(t / 10)) % 8_000_000) + 200_000)
        rows.append((price, change, pct, vol, ticker))

    with conn.cursor() as cur:
        cur.executemany("""
            UPDATE stocks_realtime
            SET current_price=%s, change_val=%s, change_pct=%s, volume=%s, updated_at=NOW()
            WHERE ticker=%s
        """, rows)
    conn.commit()


def main():
    log.info("=== 원광증권 KRX Fetcher 시작 ===")
    conn  = get_conn()
    create_tables(conn)
    seed_realtime(conn)
    seed_history(conn)

    # Initial index update
    update_indices(conn)

    cycle = 0
    while True:
        try:
            simulate_prices(conn)
            cycle += 1
            if cycle % 6 == 0:          # every 60 s update indices
                update_indices(conn)
            if cycle % 2 == 0:
                log.info(f"Cycle {cycle} — prices simulated")
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
