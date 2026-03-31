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
  current_price: string;
  change_val: string;
  change_pct: string;
  volume: string;
}

async function getRealtimePrices(): Promise<Map<string, { price: number; change: number; changePercent: number; volume: number }>> {
  try {
    const result = await pool.query<RealtimeRow>(`
      SELECT ticker, current_price, change_val, change_pct, volume
      FROM stocks_realtime
      WHERE updated_at > NOW() - INTERVAL '120 seconds'
    `);
    const map = new Map<string, { price: number; change: number; changePercent: number; volume: number }>();
    for (const row of result.rows) {
      map.set(row.ticker, {
        price:         Math.round(parseFloat(row.current_price)),
        change:        Math.round(parseFloat(row.change_val)),
        changePercent: Math.round(parseFloat(row.change_pct) * 100) / 100,
        volume:        parseInt(row.volume),
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

async function getHistoryFromDB(ticker: string, days: number) {
  try {
    const result = await pool.query<HistoryRow>(`
      SELECT date, open_price, high_price, low_price, close_price, volume
      FROM stocks_history
      WHERE ticker = $1
      ORDER BY date DESC
      LIMIT $2
    `, [ticker, days]);
    if (result.rows.length < 5) return null;
    return result.rows.reverse().map((r) => ({
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
  const rtPrices = await getRealtimePrices();
  const stocks = STOCKS_DATA.map((s) => {
    const rt = rtPrices.get(s.ticker);
    const { price, change, changePercent } = rt
      ? rt
      : getStockPrice(s.basePrice, s.ticker);
    return {
      ticker:       s.ticker,
      name:         s.name,
      currentPrice: rt ? rt.price : price,
      change:       rt ? rt.change : Math.round(change),
      changePercent: rt ? rt.changePercent : changePercent,
      volume:       rt ? rt.volume : getVolume(s.ticker),
      marketCap:    s.marketCap,
      sector:       s.sector,
    };
  });
  const parsed = GetStocksResponse.parse(stocks);
  res.json(parsed);
});

router.get("/stocks/search", async (req, res) => {
  const q = ((req.query.q as string) || "").trim().toLowerCase();
  const rtPrices = await getRealtimePrices();
  const filtered = STOCKS_DATA.filter(
    (s) => s.name.toLowerCase().includes(q) || s.ticker.includes(q) || s.sector.toLowerCase().includes(q)
  );
  const stocks = filtered.map((s) => {
    const rt = rtPrices.get(s.ticker);
    const { price, change, changePercent } = rt ?? getStockPrice(s.basePrice, s.ticker);
    return {
      ticker:        s.ticker,
      name:          s.name,
      currentPrice:  rt ? rt.price : price,
      change:        rt ? rt.change : Math.round(change),
      changePercent: rt ? rt.changePercent : changePercent,
      volume:        rt ? rt.volume : getVolume(s.ticker),
      marketCap:     s.marketCap,
      sector:        s.sector,
    };
  });
  const parsed = GetStocksResponse.parse(stocks);
  res.json(parsed);
});

router.get("/stocks/:ticker/history", async (req, res) => {
  const stock = STOCKS_DATA.find((s) => s.ticker === req.params.ticker);
  if (!stock) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }

  const period = (req.query.period as string) || "1m";
  let days = 30;
  switch (period) {
    case "1d": days = 1;   break;
    case "1w": days = 7;   break;
    case "1m": days = 30;  break;
    case "3m": days = 90;  break;
    case "1y": days = 365; break;
  }

  // Try DB first (real pykrx data)
  const dbHistory = await getHistoryFromDB(stock.ticker, days);
  if (dbHistory) {
    const parsed = GetStockHistoryResponse.parse(dbHistory);
    res.json(parsed);
    return;
  }

  // Fallback: generate synthetic OHLCV
  const history = [];
  const now = new Date();
  let price = stock.basePrice;
  const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayFactor  = Math.sin(i * 0.1 + seed * 0.01) * 0.02;
    const noiseFactor = (Math.sin(i * 7.3 + seed) * 0.5 + 0.5) * 0.02 - 0.01;
    price = Math.round(price * (1 + dayFactor * 0.1 + noiseFactor));
    price = Math.max(price, stock.low52w * 0.9);
    price = Math.min(price, stock.high52w * 1.1);
    const highOffset = Math.abs(Math.sin(i * 3.7 + seed)) * price * 0.015;
    const lowOffset  = Math.abs(Math.cos(i * 2.9 + seed)) * price * 0.015;
    const openOffset = (Math.random() - 0.5) * price * 0.01;
    history.push({
      date:   date.toISOString().split("T")[0],
      open:   Math.round(price + openOffset),
      high:   Math.round(price + highOffset),
      low:    Math.round(price - lowOffset),
      close:  price,
      volume: getVolume(stock.ticker + i),
    });
  }
  const parsed = GetStockHistoryResponse.parse(history);
  res.json(parsed);
});

router.get("/stocks/:ticker/news", (req, res) => {
  const news = getNews(req.params.ticker);
  const parsed = GetStockNewsResponse.parse(news);
  res.json(parsed);
});

router.get("/stocks/:ticker", async (req, res) => {
  const stock = STOCKS_DATA.find((s) => s.ticker === req.params.ticker);
  if (!stock) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }
  const rtPrices = await getRealtimePrices();
  const rt = rtPrices.get(stock.ticker);
  const { price, change, changePercent } = rt ?? getStockPrice(stock.basePrice, stock.ticker);
  const currentPrice = rt ? rt.price : price;
  const highOffset   = stock.basePrice * 0.015;
  const lowOffset    = stock.basePrice * 0.012;

  const detail = {
    ticker:        stock.ticker,
    name:          stock.name,
    currentPrice,
    change:        rt ? rt.change : Math.round(change),
    changePercent: rt ? rt.changePercent : changePercent,
    volume:        rt ? rt.volume : getVolume(stock.ticker),
    marketCap:     stock.marketCap,
    sector:        stock.sector,
    high52w:       stock.high52w,
    low52w:        stock.low52w,
    per:           stock.per,
    pbr:           stock.pbr,
    eps:           stock.eps,
    dividendYield: stock.dividendYield,
    openPrice:     Math.round(stock.basePrice * 1.001),
    highPrice:     Math.round(currentPrice + highOffset),
    lowPrice:      Math.round(currentPrice - lowOffset),
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
