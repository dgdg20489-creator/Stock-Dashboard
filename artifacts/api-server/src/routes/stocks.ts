import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  GetStocksResponse,
  GetStockByTickerResponse,
  GetStockHistoryResponse,
  GetMarketSummaryResponse,
  GetStockNewsResponse,
} from "@workspace/api-zod";
import {
  STOCKS_DATA,
  getStockPrice,
  getVolume,
  getNews,
} from "./stocksData.js";

const router: IRouter = Router();

// --- Helpers: read from DB (populated by python/krx_fetcher.py) ---

interface RealtimeRow {
  ticker: string;
  name: string;
  current_price: string;
  change_val: string;
  change_pct: string;
  volume: string;
  market_cap: string;
  sector: string | null;
  market: string | null;
  high52w: string | null;
  low52w: string | null;
  per: string | null;
  pbr: string | null;
  eps: string | null;
  dividend_yield: string | null;
  open_price: string | null;
  high_price: string | null;
  low_price: string | null;
  logo_url: string | null;
}

async function getAllStocksFromDB(): Promise<RealtimeRow[]> {
  try {
    const result = await pool.query<RealtimeRow>(`
      SELECT ticker, name, current_price, change_val, change_pct, volume,
             market_cap, sector, market,
             high52w, low52w, per, pbr, eps, dividend_yield,
             open_price, high_price, low_price, logo_url
      FROM stocks_realtime
      ORDER BY COALESCE(market_cap, 0) DESC
    `);
    return result.rows;
  } catch {
    return [];
  }
}

async function getStockFromDB(ticker: string): Promise<RealtimeRow | null> {
  try {
    const result = await pool.query<RealtimeRow>(`
      SELECT ticker, name, current_price, change_val, change_pct, volume,
             market_cap, sector, market,
             high52w, low52w, per, pbr, eps, dividend_yield,
             open_price, high_price, low_price, logo_url
      FROM stocks_realtime
      WHERE ticker = $1
    `, [ticker]);
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

function rowToStockItem(row: RealtimeRow) {
  const price    = Math.round(parseFloat(row.current_price) || 0);
  const change   = Math.round(parseFloat(row.change_val)    || 0);
  const changePct = Math.round((parseFloat(row.change_pct) || 0) * 100) / 100;
  const volume   = parseInt(row.volume) || 1_000_000;
  const mcap     = parseInt(row.market_cap) || 0;
  const sector   = row.sector || (row.market === "KOSDAQ" ? "코스닥" : "종합");

  return { ticker: row.ticker, name: row.name, currentPrice: price, change, changePercent: changePct, volume, marketCap: mcap, sector };
}

// Keep legacy getRealtimePrices for history/other routes that still need it
async function getRealtimePrices(): Promise<Map<string, { price: number; change: number; changePercent: number; volume: number }>> {
  try {
    const rows = await getAllStocksFromDB();
    const map = new Map<string, { price: number; change: number; changePercent: number; volume: number }>();
    for (const row of rows) {
      map.set(row.ticker, {
        price:         Math.round(parseFloat(row.current_price) || 0),
        change:        Math.round(parseFloat(row.change_val)    || 0),
        changePercent: Math.round((parseFloat(row.change_pct) || 0) * 100) / 100,
        volume:        parseInt(row.volume) || 1_000_000,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

interface IndexRow {
  key: string;
  name: string;
  value: string;
  change_val: string;
  change_pct: string;
}

async function getMarketIndicesFromDB(): Promise<Map<string, { name: string; value: number; change: number; changePercent: number }>> {
  try {
    const result = await pool.query<IndexRow>(`
      SELECT key, name, value, change_val, change_pct
      FROM market_indices
      WHERE updated_at > NOW() - INTERVAL '600 seconds'
    `);
    const map = new Map<string, { name: string; value: number; change: number; changePercent: number }>();
    for (const row of result.rows) {
      map.set(row.key, {
        name:         row.name,
        value:        Math.round(parseFloat(row.value) * 100) / 100,
        change:       Math.round(parseFloat(row.change_val) * 100) / 100,
        changePercent: Math.round(parseFloat(row.change_pct) * 100) / 100,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

interface HistoryRow {
  date: Date;
  open_price: string;
  high_price: string;
  low_price: string;
  close_price: string;
  volume: string;
}

async function getHistoryFromDB(ticker: string, days: number | null) {
  try {
    const query = days === null
      ? {
          text: `SELECT date, open_price, high_price, low_price, close_price, volume
                 FROM stocks_history WHERE ticker = $1
                 ORDER BY date ASC`,
          values: [ticker],
        }
      : {
          text: `SELECT date, open_price, high_price, low_price, close_price, volume
                 FROM stocks_history WHERE ticker = $1
                 ORDER BY date DESC LIMIT $2`,
          values: [ticker, days],
        };
    const result = await pool.query<HistoryRow>(query.text, query.values);
    if (result.rows.length < 5) return null;
    const rows = days === null ? result.rows : result.rows.reverse();
    return rows.map((r) => ({
      date:   r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
      open:   Math.round(parseFloat(r.open_price)),
      high:   Math.round(parseFloat(r.high_price)),
      low:    Math.round(parseFloat(r.low_price)),
      close:  Math.round(parseFloat(r.close_price)),
      volume: parseInt(r.volume),
    }));
  } catch {
    return null;
  }
}

// --- Routes ---

router.get("/stocks", async (_req, res) => {
  const rows = await getAllStocksFromDB();
  if (rows.length === 0) {
    // Fallback to STOCKS_DATA if DB is empty
    const rtPrices = await getRealtimePrices();
    const stocks = STOCKS_DATA.map((s) => {
      const rt = rtPrices.get(s.ticker);
      const { price, change, changePercent } = rt ?? getStockPrice(s.basePrice, s.ticker);
      return { ticker: s.ticker, name: s.name, currentPrice: rt ? rt.price : price,
               change: rt ? rt.change : Math.round(change), changePercent: rt ? rt.changePercent : changePercent,
               volume: rt ? rt.volume : getVolume(s.ticker), marketCap: s.marketCap, sector: s.sector };
    });
    res.json(GetStocksResponse.parse(stocks));
    return;
  }
  const parsed = GetStocksResponse.parse(rows.map(rowToStockItem));
  res.json(parsed);
});

router.get("/stocks/search", async (req, res) => {
  const q = ((req.query.q as string) || "").trim().toLowerCase();
  const rows = await getAllStocksFromDB();
  const filtered = rows.filter(
    (r) => r.name.toLowerCase().includes(q) || r.ticker.includes(q) ||
           (r.sector || "").toLowerCase().includes(q) || (r.market || "").toLowerCase().includes(q)
  );
  const parsed = GetStocksResponse.parse(filtered.map(rowToStockItem));
  res.json(parsed);
});

router.get("/stocks/:ticker/history", async (req, res) => {
  const ticker = req.params.ticker;
  const period = (req.query.period as string) || "1m";
  // null = no LIMIT (return all available rows)
  let days: number | null = 30;
  switch (period) {
    case "1d":  days = 1;    break;
    case "1w":  days = 7;    break;
    case "1m":  days = 30;   break;
    case "3m":  days = 90;   break;
    case "1y":  days = 365;  break;
    case "all": days = null; break;
  }

  // Try DB first (real pykrx data)
  const dbHistory = await getHistoryFromDB(ticker, days);
  if (dbHistory) {
    const parsed = GetStockHistoryResponse.parse(dbHistory);
    res.json(parsed);
    return;
  }

  // Fallback: generate synthetic OHLCV from DB price
  const dbRow = await getStockFromDB(ticker);
  const stock = STOCKS_DATA.find((s) => s.ticker === ticker);
  const basePrice = dbRow ? Math.round(parseFloat(dbRow.current_price) || 0) : (stock?.basePrice ?? 50000);
  const high52w   = dbRow?.high52w ? parseFloat(dbRow.high52w) : basePrice * 1.3;
  const low52w    = dbRow?.low52w  ? parseFloat(dbRow.low52w)  : basePrice * 0.7;

  if (basePrice === 0) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }

  const history = [];
  const now = new Date();
  let price = basePrice;
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // days===null means "all" → use 365 for synthetic fallback
  const loopDays = days ?? 365;

  for (let i = loopDays; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayFactor   = Math.sin(i * 0.1 + seed * 0.01) * 0.02;
    const noiseFactor = (Math.sin(i * 7.3 + seed) * 0.5 + 0.5) * 0.02 - 0.01;
    price = Math.round(price * (1 + dayFactor * 0.1 + noiseFactor));
    price = Math.max(price, low52w * 0.9);
    price = Math.min(price, high52w * 1.1);
    const highOffset = Math.abs(Math.sin(i * 3.7 + seed)) * price * 0.015;
    const lowOffset  = Math.abs(Math.cos(i * 2.9 + seed)) * price * 0.015;
    const openOffset = (Math.random() - 0.5) * price * 0.01;
    history.push({
      date:   date.toISOString().split("T")[0],
      open:   Math.round(price + openOffset),
      high:   Math.round(price + highOffset),
      low:    Math.round(price - lowOffset),
      close:  price,
      volume: getVolume(ticker + i),
    });
  }
  const parsed = GetStockHistoryResponse.parse(history);
  res.json(parsed);
});

router.get("/stocks/:ticker/news", async (req, res) => {
  const ticker = req.params.ticker;
  try {
    const result = await pool.query(`
      SELECT id, ticker, title, body, office_name, article_url, published_at,
             COALESCE(sentiment, 'neutral') as sentiment
      FROM market_news
      WHERE ticker = $1
      ORDER BY published_at DESC NULLS LAST, fetched_at DESC
      LIMIT 10
    `, [ticker]);

    if (result.rows.length > 0) {
      const news = result.rows.map((r) => ({
        id:          r.id,
        title:       r.title,
        summary:     r.body || "",
        source:      r.office_name || "네이버금융",
        publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
        url:         r.article_url || `https://finance.naver.com/item/news.naver?code=${ticker}`,
        sentiment:   r.sentiment || "neutral",
      }));
      const parsed = GetStockNewsResponse.parse(news);
      res.json(parsed);
      return;
    }
  } catch { /* fall through to mock */ }

  // Fallback to mock news
  const news = getNews(ticker);
  const parsed = GetStockNewsResponse.parse(news);
  res.json(parsed);
});

router.get("/news", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (id) id, ticker, title, body, office_name, article_url, published_at,
             COALESCE(sentiment, 'neutral') as sentiment
      FROM market_news
      ORDER BY id, published_at DESC NULLS LAST
      LIMIT $1
    `, [limit]);

    const news = result.rows.map((r) => ({
      id:          r.id,
      title:       r.title,
      summary:     r.body || "",
      source:      r.office_name || "네이버금융",
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
      url:         r.article_url || "https://finance.naver.com/news/",
      sentiment:   r.sentiment || "neutral",
    }));
    res.json(news);
  } catch (e) {
    res.json([]);
  }
});

router.get("/ipo", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT ticker, name, market, ipo_price, listing_date,
             subscription_start, subscription_end,
             CASE WHEN listing_date <= CURRENT_DATE THEN 'listed' ELSE 'upcoming' END as status
      FROM ipo_stocks
      ORDER BY listing_date ASC
      LIMIT 50
    `);
    const ipos = result.rows.map((r) => ({
      ticker:            r.ticker,
      name:              r.name,
      market:            r.market,
      ipoPrice:          r.ipo_price ? parseFloat(r.ipo_price) : null,
      listingDate:       r.listing_date ? new Date(r.listing_date).toISOString().split("T")[0] : "",
      subscriptionStart: r.subscription_start ? new Date(r.subscription_start).toISOString().split("T")[0] : null,
      subscriptionEnd:   r.subscription_end   ? new Date(r.subscription_end).toISOString().split("T")[0]   : null,
      status:            r.status,
    }));
    res.json(ipos);
  } catch (e) {
    res.json([]);
  }
});

router.get("/stocks/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  // Try DB first
  const dbRow = await getStockFromDB(ticker);
  // STOCKS_DATA fallback for metadata
  const legacy = STOCKS_DATA.find((s) => s.ticker === ticker);

  if (!dbRow && !legacy) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }

  const currentPrice = dbRow ? Math.round(parseFloat(dbRow.current_price) || 0) : (legacy?.basePrice ?? 0);
  const change       = dbRow ? Math.round(parseFloat(dbRow.change_val)    || 0) : 0;
  const changePct    = dbRow ? Math.round((parseFloat(dbRow.change_pct)   || 0) * 100) / 100 : 0;
  const volume       = dbRow ? (parseInt(dbRow.volume) || 1_000_000) : getVolume(ticker);
  const mcap         = dbRow ? (parseInt(dbRow.market_cap) || 0)    : (legacy?.marketCap ?? 0);
  const sector       = dbRow?.sector || legacy?.sector || "종합";
  const high52w      = dbRow?.high52w ? parseFloat(dbRow.high52w) : (legacy?.high52w ?? currentPrice * 1.3);
  const low52w       = dbRow?.low52w  ? parseFloat(dbRow.low52w)  : (legacy?.low52w  ?? currentPrice * 0.7);
  const per          = dbRow?.per     ? parseFloat(dbRow.per)     : (legacy?.per     ?? 0);
  const pbr          = dbRow?.pbr     ? parseFloat(dbRow.pbr)     : (legacy?.pbr     ?? 0);
  const eps          = dbRow?.eps     ? parseFloat(dbRow.eps)     : (legacy?.eps     ?? 0);
  const dividendYield = dbRow?.dividend_yield ? parseFloat(dbRow.dividend_yield) : (legacy?.dividendYield ?? 0);
  const openPrice    = dbRow?.open_price ? Math.round(parseFloat(dbRow.open_price)) : Math.round(currentPrice * 1.001);
  const highOffset   = currentPrice * 0.015;
  const lowOffset    = currentPrice * 0.012;
  const highPrice    = dbRow?.high_price ? Math.round(parseFloat(dbRow.high_price)) : Math.round(currentPrice + highOffset);
  const lowPrice     = dbRow?.low_price  ? Math.round(parseFloat(dbRow.low_price))  : Math.round(currentPrice - lowOffset);

  const detail = {
    ticker,
    name:          dbRow?.name ?? legacy?.name ?? ticker,
    currentPrice,
    change,
    changePercent: changePct,
    volume,
    marketCap:     mcap,
    sector,
    high52w,
    low52w,
    per,
    pbr,
    eps,
    dividendYield,
    openPrice,
    highPrice,
    lowPrice,
  };
  const parsed = GetStockByTickerResponse.parse(detail);
  res.json(parsed);
});

router.get("/market/summary", async (_req, res) => {
  const indices = await getMarketIndicesFromDB();

  function getOrSim(key: string, name: string, base: number, amplitude: number, phase: number) {
    const db = indices.get(key);
    if (db) return { name: db.name, value: db.value, change: db.change, changePercent: db.changePercent };
    const t = Date.now();
    const v = Math.round((base + Math.sin(t / 500000 + phase) * amplitude) * 100) / 100;
    const c = Math.round(Math.sin(t / 500000 + phase) * amplitude * 100) / 100;
    const cp = Math.round((c / base) * 100 * 100) / 100;
    return { name, value: v, change: c, changePercent: cp };
  }

  const summary = {
    kospi:  getOrSim("kospi",  "KOSPI",   2456.3,  20,  0),
    kosdaq: getOrSim("kosdaq", "KOSDAQ",   712.5,   8,  1),
    usdKrw: getOrSim("usdKrw", "USD/KRW", 1325.5,   5,  2),
    sp500:  getOrSim("sp500",  "S&P 500", 5234.2,  30,  3),
    nasdaq: getOrSim("nasdaq", "NASDAQ", 16420.8,  80,  4),
    updatedAt: new Date().toISOString(),
  };
  const parsed = GetMarketSummaryResponse.parse(summary);
  res.json(parsed);
});

export default router;
