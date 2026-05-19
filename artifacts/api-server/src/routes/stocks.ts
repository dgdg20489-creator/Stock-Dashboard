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
  bps: string | null;
  roe: string | null;
  dividend_yield: string | null;
  open_price: string | null;
  high_price: string | null;
  low_price: string | null;
  logo_url: string | null;
}

// ── 네이버 integration API 실시간 재무지표 캐시 (10분) ──────────────────
const _naverFinCache = new Map<string, { data: NaverFinData; ts: number }>();
interface NaverFinData {
  per: number; eps: number; pbr: number; bps: number;
  dividendYield: number; high52w: number; low52w: number;
}
const NAVER_FIN_TTL = 10 * 60 * 1000; // 10분

async function fetchNaverIntegration(ticker: string): Promise<NaverFinData | null> {
  const cached = _naverFinCache.get(ticker);
  if (cached && Date.now() - cached.ts < NAVER_FIN_TTL) return cached.data;
  try {
    const url = `https://m.stock.naver.com/api/stock/${ticker}/integration`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://m.stock.naver.com/",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const d = await res.json() as { totalInfos?: Array<{ code: string; value: string }> };
    const infos: Record<string, string> = {};
    for (const item of d.totalInfos ?? []) {
      if (item.code) infos[item.code] = item.value ?? "";
    }
    const parseNum = (s: string) => {
      if (!s) return 0;
      const n = parseFloat(s.replace(/[^0-9.]/g, ""));
      return isNaN(n) ? 0 : n;
    };
    const data: NaverFinData = {
      per:           parseNum(infos.per            ?? ""),
      eps:           parseNum(infos.eps            ?? ""),
      pbr:           parseNum(infos.pbr            ?? ""),
      bps:           parseNum(infos.bps            ?? ""),
      dividendYield: parseNum(infos.dividendYieldRatio ?? ""),
      high52w:       parseNum(infos.highPriceOf52Weeks ?? ""),
      low52w:        parseNum(infos.lowPriceOf52Weeks  ?? ""),
    };
    _naverFinCache.set(ticker, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  }
}

async function getAllStocksFromDB(): Promise<RealtimeRow[]> {
  try {
    const result = await pool.query<RealtimeRow>(`
      SELECT ticker, name, current_price, change_val, change_pct, volume,
             market_cap, sector, market,
             high52w, low52w, per, pbr, eps, bps, roe, dividend_yield,
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
             high52w, low52w, per, pbr, eps, bps, roe, dividend_yield,
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

// ── 종목 수 (반드시 /stocks/:ticker 앞에 위치해야 함) ─────────────
router.get("/stocks/count", async (_req, res) => {
  try {
    const result = await pool.query<{ count: string }>("SELECT COUNT(*) as count FROM stocks_realtime");
    res.json({ count: parseInt(result.rows[0]?.count ?? "0") });
  } catch {
    res.json({ count: 0 });
  }
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
  // Guard: high52w/low52w가 0이면 basePrice 기준으로 계산 (0이면 price가 0이 돼버림)
  const raw52High = dbRow?.high52w ? parseFloat(dbRow.high52w) : 0;
  const raw52Low  = dbRow?.low52w  ? parseFloat(dbRow.low52w)  : 0;
  const high52w   = raw52High > 0 ? raw52High : basePrice * 1.3;
  const low52w    = raw52Low  > 0 ? raw52Low  : basePrice * 0.7;

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
      SELECT id, ticker, title, body, office_name, article_url, published_at,
             COALESCE(sentiment, 'neutral') as sentiment
      FROM market_news
      ORDER BY published_at DESC NULLS LAST, id DESC
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
    // listing_date nullable 대응: NULL인 종목도 반환 (상장일 미정)
    const { rows } = await pool.query<{
      ticker: string; name: string; market: string;
      ipo_price: string | null; listing_date: string | null;
      sub_start: string | null;
    }>(`
      SELECT ticker, name, market, ipo_price,
             listing_date::text, sub_start::text
      FROM ipo_stocks
      ORDER BY listing_date ASC NULLS LAST, sub_start ASC NULLS LAST
    `);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = rows.map((r) => {
      let status = "pending";
      let dDay: number | null = null;
      if (r.listing_date) {
        const listing = new Date(r.listing_date);
        listing.setHours(0, 0, 0, 0);
        const diff = Math.round((listing.getTime() - today.getTime()) / 86400000);
        status = diff === 0 ? "today" : diff > 0 ? "upcoming" : "listed";
        dDay = diff;
      }
      return {
        ticker: r.ticker,
        name: r.name,
        market: r.market,
        ipoPrice: r.ipo_price ? Number(r.ipo_price) : null,
        listingDate: r.listing_date ?? "미정",
        subStart: r.sub_start ?? null,
        status,
        dDay,
      };
    });
    res.json(items);
  } catch (e) {
    console.error("IPO route error:", e);
    res.json([]);
  }
});

router.get("/stocks/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  // DB + Naver integration API 동시 조회 (빠른 응답)
  const [dbRow, naverFin] = await Promise.all([
    getStockFromDB(ticker),
    fetchNaverIntegration(ticker),
  ]);
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

  // 재무지표: 네이버 실시간 API 우선, DB fallback
  const per           = naverFin?.per           || (dbRow?.per  ? parseFloat(dbRow.per)  : (legacy?.per     ?? 0));
  const eps           = naverFin?.eps           || (dbRow?.eps  ? parseFloat(dbRow.eps)  : (legacy?.eps     ?? 0));
  const pbr           = naverFin?.pbr           || (dbRow?.pbr  ? parseFloat(dbRow.pbr)  : (legacy?.pbr     ?? 0));
  const bps           = naverFin?.bps           || (dbRow?.bps  ? parseFloat(dbRow.bps)  : 0);
  const dividendYield = naverFin?.dividendYield || (dbRow?.dividend_yield ? parseFloat(dbRow.dividend_yield) : (legacy?.dividendYield ?? 0));
  const high52w       = naverFin?.high52w       || (dbRow?.high52w ? parseFloat(dbRow.high52w) : (legacy?.high52w ?? currentPrice * 1.3));
  const low52w        = naverFin?.low52w        || (dbRow?.low52w  ? parseFloat(dbRow.low52w)  : (legacy?.low52w  ?? currentPrice * 0.7));
  const roe           = dbRow?.roe ? parseFloat(dbRow.roe) : 0;

  const openPrice = dbRow?.open_price ? Math.round(parseFloat(dbRow.open_price)) : Math.round(currentPrice * 1.001);
  const highPrice = dbRow?.high_price ? Math.round(parseFloat(dbRow.high_price)) : Math.round(currentPrice * 1.015);
  const lowPrice  = dbRow?.low_price  ? Math.round(parseFloat(dbRow.low_price))  : Math.round(currentPrice * 0.988);

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
  // bps, roe는 스키마에 없으므로 별도 추가
  res.json({ ...parsed, bps, roe });
});

// ─── 실시간 시장 순위 (거래대금 / 거래량) ───────────────────────────────
router.get("/market/rankings", async (req, res) => {
  try {
    const type = (req.query.type as string) || "trade_amount"; // trade_amount | volume
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    // 1차: market_rankings + stocks_realtime JOIN → 실시간 change_pct & price 반영
    const dbResult = await pool.query<{
      rank: string; ticker: string; name: string; price: string;
      change_pct: string; volume: string; trade_amount: string; market: string | null;
      updated_at: string;
    }>(
      `SELECT mr.rank, mr.ticker, mr.name,
              COALESCE(sr.current_price, mr.price)::text AS price,
              COALESCE(sr.change_pct, mr.change_pct)::text AS change_pct,
              mr.volume, mr.trade_amount, mr.market, mr.updated_at
       FROM market_rankings mr
       LEFT JOIN stocks_realtime sr ON mr.ticker = sr.ticker
       WHERE mr.type = $1
       ORDER BY mr.rank LIMIT $2`,
      [type, limit]
    );

    // 급상승: 네이버 sise_rise 실제 랭킹 (market_rankings.top_gainers) 우선 사용
    // market_rankings가 비어있으면 stocks_realtime에서 change_pct 정렬로 폴백
    if (type === "top_gainers") {
      // market_rankings에서 네이버 실제 상승률 순위 조회
      const mrResult = await pool.query<{
        rank: string; ticker: string; name: string; price: string;
        change_pct: string; volume: string; trade_amount: string; market: string | null;
        updated_at: string;
      }>(
        `SELECT mr.rank, mr.ticker, mr.name,
                COALESCE(sr.current_price, mr.price)::text AS price,
                COALESCE(sr.change_pct, mr.change_pct)::text AS change_pct,
                mr.volume, mr.trade_amount, mr.market, mr.updated_at
         FROM market_rankings mr
         LEFT JOIN stocks_realtime sr ON mr.ticker = sr.ticker
         WHERE mr.type = 'top_gainers'
         ORDER BY mr.rank LIMIT $1`,
        [limit]
      );

      if (mrResult.rows.length > 0) {
        // 네이버 실제 상승률 데이터 사용
        const rows = mrResult.rows.map(r => ({
          rank: Number(r.rank),
          ticker: r.ticker,
          name: r.name,
          price: Number(r.price),
          changePercent: Number(r.change_pct),
          changeValue: 0,
          volume: Number(r.volume),
          tradeAmount: Number(r.trade_amount),
          market: r.market,
          updatedAt: r.updated_at,
        }));
        return res.json(rows);
      }

      // 폴백: market_rankings 없으면 stocks_realtime에서 정렬
      const fallResult = await pool.query<{
        ticker: string; name: string; current_price: string;
        change_pct: string; change_val: string; volume: string; market: string | null;
      }>(
        `SELECT ticker, name, current_price, change_pct, change_val, volume, market
         FROM stocks_realtime
         WHERE volume > 0
         ORDER BY change_pct DESC NULLS LAST
         LIMIT $1`,
        [limit]
      );
      const rows = fallResult.rows.map((r, i) => ({
        rank: i + 1,
        ticker: r.ticker,
        name: r.name,
        price: Number(r.current_price),
        changePercent: Number(r.change_pct),
        changeValue: Number(r.change_val),
        volume: Number(r.volume),
        tradeAmount: Number(r.current_price) * Number(r.volume),
        market: r.market,
        updatedAt: new Date().toISOString(),
      }));
      return res.json(rows);
    }

    // 2차 fallback: market_rankings가 비어있으면 stocks_realtime에서 실시간 정렬
    if (dbResult.rows.length === 0) {
      const orderBy = type === "trade_amount"
        ? "(current_price::numeric * volume::numeric) DESC"
        : "volume DESC";
      const fallback = await pool.query<{
        ticker: string; name: string; current_price: string;
        change_pct: string; volume: string; market: string | null;
      }>(
        `SELECT ticker, name, current_price, change_pct, volume, market
         FROM stocks_realtime WHERE volume > 0 ORDER BY ${orderBy} LIMIT $1`,
        [limit]
      );
      const rows = fallback.rows.map((r, i) => ({
        rank: i + 1,
        ticker: r.ticker,
        name: r.name,
        price: Number(r.current_price),
        changePercent: Number(r.change_pct),
        volume: Number(r.volume),
        tradeAmount: Number(r.current_price) * Number(r.volume),
        market: r.market,
        updatedAt: new Date().toISOString(),
      }));
      return res.json(rows);
    }

    const rows = dbResult.rows.map((r) => ({
      rank: Number(r.rank),
      ticker: r.ticker,
      name: r.name,
      price: Number(r.price),
      changePercent: Number(r.change_pct),
      volume: Number(r.volume),
      tradeAmount: Number(r.trade_amount),
      market: r.market,
      updatedAt: r.updated_at,
    }));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
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

// ── 한국 장 운영 상태 ─────────────────────────────────────────────
router.get("/market/status", (_req, res) => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  const kstH = kst.getUTCHours();
  const kstM = kst.getUTCMinutes();
  const dayOfWeek = kst.getUTCDay(); // 0=Sun, 6=Sat
  const kstTime = `${String(kstH).padStart(2,"0")}:${String(kstM).padStart(2,"0")}`;
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const totalMin = kstH * 60 + kstM;
  const openMin  = 9 * 60;        // 09:00
  const closeMin = 15 * 60 + 30;  // 15:30
  const isOpen = isWeekday && totalMin >= openMin && totalMin < closeMin;
  const isPreMarket = isWeekday && totalMin >= openMin - 60 && totalMin < openMin; // 08:00~09:00 동시호가

  let message: string;
  let nextEventLabel: string;
  let nextEventTime: string;

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    message = "주말 – 장 휴장";
    // 다음 월요일 09:00
    const daysToMon = dayOfWeek === 6 ? 2 : 1;
    const nextMon = new Date(kst.getTime() + daysToMon * 86_400_000);
    nextEventLabel = "다음 개장";
    nextEventTime = `${nextMon.getUTCFullYear()}-${String(nextMon.getUTCMonth()+1).padStart(2,"0")}-${String(nextMon.getUTCDate()).padStart(2,"0")} 09:00 KST`;
  } else if (isOpen) {
    message = "장 개장 중 (09:00 ~ 15:30)";
    nextEventLabel = "오늘 마감";
    const todayDate = kst.toISOString().slice(0,10);
    nextEventTime = `${todayDate} 15:30 KST`;
  } else if (isPreMarket) {
    message = "동시호가 진행 중 (08:00 ~ 09:00)";
    nextEventLabel = "정규장 개장";
    const todayDate = kst.toISOString().slice(0,10);
    nextEventTime = `${todayDate} 09:00 KST`;
  } else if (totalMin < openMin) {
    message = "장 개장 전";
    nextEventLabel = "오늘 개장";
    const todayDate = kst.toISOString().slice(0,10);
    nextEventTime = `${todayDate} 09:00 KST`;
  } else {
    message = "장 마감 (15:30 이후)";
    // 다음 거래일
    let daysAhead = 1;
    const tomorrow = new Date(kst.getTime() + 86_400_000);
    if (tomorrow.getUTCDay() === 6) daysAhead = 3; // Sat→Mon
    if (tomorrow.getUTCDay() === 0) daysAhead = 2; // Sun→Mon
    const nextDay = new Date(kst.getTime() + daysAhead * 86_400_000);
    nextEventLabel = "다음 개장";
    nextEventTime = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth()+1).padStart(2,"0")}-${String(nextDay.getUTCDate()).padStart(2,"0")} 09:00 KST`;
  }

  res.json({
    isOpen,
    isPreMarket,
    isWeekday,
    kstTime,
    dayOfWeek,
    message,
    nextEventLabel,
    nextEventTime,
    openTime: "09:00",
    closeTime: "15:30",
  });
});

// ── 네이버 실시간 현재가 (단일 종목 즉시 조회) ─────────────────
router.get("/stocks/:ticker/live", async (req, res) => {
  const { ticker } = req.params;
  try {
    // 1차: 네이버 모바일 API 직접 조회
    const naverUrl = `https://m.stock.naver.com/api/stock/${ticker}/basic`;
    let naverPrice = 0, naverChange = 0, naverChangePct = 0;
    try {
      const naverRes = await fetch(naverUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
          "Referer": "https://m.stock.naver.com/",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (naverRes.ok) {
        const d = await naverRes.json() as Record<string, string>;
        naverPrice     = parseInt((d.closePrice ?? "0").replace(/,/g, "")) || 0;
        naverChange    = parseFloat((d.compareToPreviousClosePrice ?? "0").replace(/,/g, "").replace("+", "")) || 0;
        naverChangePct = parseFloat(d.fluctuationsRatio ?? "0") || 0;
      }
    } catch { /* ignore, fall through to DB */ }

    if (naverPrice > 0) {
      // DB에도 반영 (fire-and-forget)
      pool.query(
        `UPDATE stocks_realtime
         SET current_price=$1, change_val=$2, change_pct=$3, updated_at=NOW()
         WHERE ticker=$4`,
        [naverPrice, naverChange, naverChangePct, ticker]
      ).catch(() => {});

      return res.json({
        ticker,
        price:     naverPrice,
        change:    naverChange,
        changePct: naverChangePct,
        open:      0,
        high:      0,
        low:       0,
        volume:    0,
        source:    "naver",
      });
    }

    // 2차 fallback: DB에서 최신 가격 반환
    const row = await getStockFromDB(ticker);
    if (row) {
      return res.json({
        ticker,
        price:     Math.round(parseFloat(row.current_price) || 0),
        change:    Math.round(parseFloat(row.change_val) || 0),
        changePct: Math.round((parseFloat(row.change_pct) || 0) * 100) / 100,
        open:      0,
        high:      0,
        low:       0,
        volume:    parseInt(row.volume) || 0,
        source:    "db",
      });
    }
    return res.status(404).json({ message: "종목 없음" });
  } catch (e) {
    console.error("[Naver] live price error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── 캔들 (일봉/주봉/월봉/년봉) — stocks_history DB 기반 ──────────
router.get("/stocks/:ticker/candles", async (req, res) => {
  const { ticker } = req.params;
  const period = (String(req.query.period ?? "D")).toUpperCase();
  if (!["D","W","M","Y"].includes(period)) {
    return res.status(400).json({ message: "period must be D, W, M, or Y" });
  }
  try {
    // Fetch raw daily candles from DB
    const result = await pool.query<{
      date: string; open_price: string; high_price: string;
      low_price: string; close_price: string; volume: string;
    }>(
      `SELECT date::text, open_price, high_price, low_price, close_price, volume
       FROM stocks_history WHERE ticker = $1 ORDER BY date ASC`,
      [ticker]
    );
    if (!result.rows.length) {
      // ETF/종목 데이터 없으면 현재가 기반 합성 데이터 반환
      const row = await getStockFromDB(ticker);
      const basePrice = row ? Math.round(parseFloat(row.current_price) || 10000) : 10000;
      const seed = ticker.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const synth = [];
      let p = basePrice;
      for (let i = 120; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const chg = (Math.sin(i * 0.13 + seed * 0.01) * 0.012 + (Math.sin(i * 7.1 + seed) * 0.5 + 0.5 - 0.5) * 0.008);
        p = Math.round(Math.max(p * (1 + chg), 1));
        synth.push({
          date: d.toISOString().split("T")[0],
          open: Math.round(p * (1 - 0.003)),
          high: Math.round(p * (1 + 0.008)),
          low: Math.round(p * (1 - 0.008)),
          close: p,
          volume: 500000 + Math.round(Math.abs(Math.sin(i + seed)) * 1500000),
        });
      }
      synth[synth.length - 1].close = basePrice;
      return res.json(synth);
    }
    let candles = result.rows.map(r => ({
      date:   String(r.date).split("T")[0],
      open:   Math.round(parseFloat(r.open_price)),
      high:   Math.round(parseFloat(r.high_price)),
      low:    Math.round(parseFloat(r.low_price)),
      close:  Math.round(parseFloat(r.close_price)),
      volume: parseInt(r.volume),
    }));

    // Aggregate for non-daily periods
    if (period === "W") {
      candles = aggregateCandles(candles, d => {
        const dt = new Date(d);
        const day = dt.getUTCDay();
        const diff = dt.getUTCDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(dt);
        mon.setUTCDate(diff);
        return mon.toISOString().split("T")[0];
      });
    } else if (period === "M") {
      candles = aggregateCandles(candles, d => d.slice(0, 7) + "-01");
    } else if (period === "Y") {
      candles = aggregateCandles(candles, d => d.slice(0, 4) + "-01-01");
    }

    res.json(candles);
  } catch (e) {
    console.error("[candles] error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

function aggregateCandles(
  daily: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>,
  keyFn: (date: string) => string
) {
  const map = new Map<string, typeof daily[0]>();
  for (const c of daily) {
    const key = keyFn(c.date);
    const ex = map.get(key);
    if (!ex) {
      map.set(key, { ...c, date: key });
    } else {
      ex.high   = Math.max(ex.high,   c.high);
      ex.low    = Math.min(ex.low,    c.low);
      ex.close  = c.close;
      ex.volume += c.volume;
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── 체결내역 — 네이버 기반 데이터 없음, 빈 배열 반환 ────────────
// ── 체결내역 — 네이버 분봉 API에서 최근 분별 체결 추출 ──────────────
router.get("/stocks/:ticker/executions", async (req, res) => {
  const { ticker } = req.params;
  try {
    const naverUrl = `https://api.stock.naver.com/chart/domestic/item/${ticker}/minute?chartType=minute&requestType=0&timeFrame=1`;
    const naverRes = await fetch(naverUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://finance.naver.com/",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (naverRes.ok) {
      const raw = await naverRes.json() as Array<{
        localDateTime: string;
        currentPrice: number;
        openPrice: number;
        accumulatedTradingVolume: number;
      }>;
      if (Array.isArray(raw) && raw.length > 0) {
        // 최근 분봉에서 분별 체결량 계산 (누적거래량 차분)
        const recent = raw.slice(-25).reverse(); // 최근 25분, 역순(최신 먼저)
        const executions = recent.map((c, i) => {
          const prev = recent[i + 1];
          const volume = prev
            ? Math.max(c.accumulatedTradingVolume - prev.accumulatedTradingVolume, 0)
            : c.accumulatedTradingVolume;
          const dt = String(c.localDateTime ?? "");
          const time = dt.length >= 12
            ? `${dt.slice(8,10)}:${dt.slice(10,12)}`
            : dt;
          const isBuy = c.currentPrice >= c.openPrice;
          return { time, price: Math.round(c.currentPrice), volume, isBuy };
        }).filter(e => e.price > 0);
        return res.json(executions);
      }
    }
  } catch { /* fallback */ }
  res.json([]);
});

// ── 당일 분봉 — 네이버 차트 API → 시뮬레이션 fallback ──────────
router.get("/stocks/:ticker/minute-candles", async (req, res) => {
  const { ticker } = req.params;
  try {
    // 네이버 차트 API (올바른 엔드포인트)
    try {
      const naverUrl = `https://api.stock.naver.com/chart/domestic/item/${ticker}/minute?chartType=minute&requestType=0&timeFrame=1`;
      const naverRes = await fetch(naverUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
          "Referer": "https://m.stock.naver.com/",
          "Origin": "https://m.stock.naver.com",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (naverRes.ok) {
        const raw = await naverRes.json() as any[];
        if (Array.isArray(raw) && raw.length > 0) {
          // localDateTime 형식: "20260518090000" → "2026-05-18T09:00:00"
          const candles = raw.map(r => {
            const dt = String(r.localDateTime ?? "");
            const date = dt.length >= 14
              ? `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}T${dt.slice(8,10)}:${dt.slice(10,12)}:${dt.slice(12,14)}`
              : dt;
            return {
              date,
              open:   Math.round(r.openPrice  ?? 0),
              high:   Math.round(r.highPrice  ?? 0),
              low:    Math.round(r.lowPrice   ?? 0),
              close:  Math.round(r.currentPrice ?? 0),
              volume: Math.round(r.accumulatedTradingVolume ?? 0),
            };
          }).filter(c => c.close > 0);
          if (candles.length > 0) return res.json(candles);
        }
      }
    } catch { /* fallback */ }

    // 시뮬레이션: 현재가 기반 9:00~15:30 분봉 생성
    const row = await getStockFromDB(ticker);
    const basePrice = row ? Math.round(parseFloat(row.current_price) || 10000) : 10000;
    const seed = ticker.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 3_600_000);
    const dateStr = kst.toISOString().slice(0, 10);
    const candles = [];
    let p = Math.round(basePrice * (1 - 0.01));
    for (let m = 0; m <= 390; m += 5) {
      const h = Math.floor(m / 60) + 9;
      const min = m % 60;
      if (h > 15 || (h === 15 && min > 30)) break;
      const chg = (Math.sin(m * 0.11 + seed * 0.003) * 0.003 + (Math.random() - 0.5) * 0.004);
      p = Math.round(Math.max(p * (1 + chg), 1));
      candles.push({
        date: `${dateStr}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}:00`,
        open: Math.round(p * (1 - 0.001)),
        high: Math.round(p * (1 + 0.003)),
        low:  Math.round(p * (1 - 0.003)),
        close: p,
        volume: 50000 + Math.round(Math.abs(Math.sin(m + seed)) * 200000),
      });
    }
    if (candles.length > 0) candles[candles.length - 1].close = basePrice;
    res.json(candles);
  } catch (e) {
    console.error("[minute-candles] error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── 호가창 — 네이버 실시간 거래량 기반 현실적 시뮬레이션 ────────────
router.get("/stocks/:ticker/orderbook", async (req, res) => {
  const { ticker } = req.params;

  // DB에서 현재가 + 거래량 조회
  let basePrice = 50000;
  let dailyVolume = 1_000_000;
  try {
    const row = await getStockFromDB(ticker);
    if (row) {
      basePrice    = Math.round(parseFloat(row.current_price) || 50000);
      dailyVolume  = parseInt(row.volume) || 1_000_000;
    }
  } catch { /* fallback */ }

  // 호가 단위 (한국거래소 기준)
  const unit =
    basePrice <    1_000 ? 1 :
    basePrice <    5_000 ? 5 :
    basePrice <   10_000 ? 10 :
    basePrice <   50_000 ? 50 :
    basePrice <  100_000 ? 100 :
    basePrice <  500_000 ? 500 : 1_000;

  // 현재가를 호가 단위로 정렬 (예: 272,350원 → 272,000원)
  const roundedBase = Math.round(basePrice / unit) * unit;

  // 20분 지연 호가: 가격 기반 고정 시드 → 값이 안정적으로 유지됨
  // 잔량 기준: 하루 거래량의 약 2~6% 가 각 호가에 걸려 있음
  const avgBase = Math.round(dailyVolume * 0.04);
  // 고정 시드: ticker 문자 + 현재가를 500원 단위로 버림 → 가격 큰 변동 없으면 고정
  const seedStr = ticker + String(Math.floor(basePrice / 500));
  const seed    = seedStr.split("").reduce((a, c, i2) => (a * 31 + c.charCodeAt(0) + i2) >>> 0, 17);

  // LCG 난수 (시드 기반, 호출마다 순서 고정)
  let rngState = seed;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 0x100000000;
  };

  const asks = Array.from({ length: 5 }, (_, i) => {
    const price = roundedBase + unit * (i + 1);
    // 가격 멀수록 잔량 증가 + 약간의 불규칙성
    const factor = 1 + i * 0.5;
    const noise  = 0.6 + rng() * 0.9;
    const qty    = Math.round(avgBase * factor * noise);
    return { price, qty };
  });

  const bids = Array.from({ length: 5 }, (_, i) => {
    const price = Math.max(roundedBase - unit * i, 1);
    const factor = 1 + i * 0.4;
    const noise  = 0.6 + rng() * 0.9;
    const qty    = Math.round(avgBase * factor * noise);
    return { price, qty };
  });

  const totalAskQty = asks.reduce((s, a) => s + a.qty, 0);
  const totalBidQty = bids.reduce((s, b) => s + b.qty, 0);
  res.json({ asks, bids, totalAskQty, totalBidQty });
});

export default router;
