import { Router, type IRouter } from "express";
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

router.get("/stocks", (_req, res) => {
  const stocks = STOCKS_DATA.map((s) => {
    const { price, change, changePercent } = getStockPrice(s.basePrice, s.ticker);
    return {
      ticker: s.ticker,
      name: s.name,
      currentPrice: price,
      change: Math.round(change),
      changePercent,
      volume: getVolume(s.ticker),
      marketCap: s.marketCap,
      sector: s.sector,
    };
  });
  const parsed = GetStocksResponse.parse(stocks);
  res.json(parsed);
});

router.get("/stocks/:ticker", (req, res) => {
  const stock = STOCKS_DATA.find((s) => s.ticker === req.params.ticker);
  if (!stock) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }
  const { price, change, changePercent } = getStockPrice(stock.basePrice, stock.ticker);
  const highOffset = stock.basePrice * 0.015;
  const lowOffset = stock.basePrice * 0.012;

  const detail = {
    ticker: stock.ticker,
    name: stock.name,
    currentPrice: price,
    change: Math.round(change),
    changePercent,
    volume: getVolume(stock.ticker),
    marketCap: stock.marketCap,
    sector: stock.sector,
    high52w: stock.high52w,
    low52w: stock.low52w,
    per: stock.per,
    pbr: stock.pbr,
    eps: stock.eps,
    dividendYield: stock.dividendYield,
    openPrice: Math.round(stock.basePrice * 1.001),
    highPrice: Math.round(price + highOffset),
    lowPrice: Math.round(price - lowOffset),
  };
  const parsed = GetStockByTickerResponse.parse(detail);
  res.json(parsed);
});

router.get("/stocks/:ticker/history", (req, res) => {
  const stock = STOCKS_DATA.find((s) => s.ticker === req.params.ticker);
  if (!stock) {
    res.status(404).json({ message: "Stock not found" });
    return;
  }

  const period = (req.query.period as string) || "1m";
  let days = 30;
  switch (period) {
    case "1d": days = 1; break;
    case "1w": days = 7; break;
    case "1m": days = 30; break;
    case "3m": days = 90; break;
    case "1y": days = 365; break;
  }

  const history = [];
  const now = new Date();
  let price = stock.basePrice;
  const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayFactor = Math.sin(i * 0.1 + seed * 0.01) * 0.02;
    const noiseFactor = (Math.sin(i * 7.3 + seed) * 0.5 + 0.5) * 0.02 - 0.01;
    price = Math.round(price * (1 + dayFactor * 0.1 + noiseFactor));
    price = Math.max(price, stock.low52w * 0.9);
    price = Math.min(price, stock.high52w * 1.1);

    const highOffset = Math.abs(Math.sin(i * 3.7 + seed)) * price * 0.015;
    const lowOffset = Math.abs(Math.cos(i * 2.9 + seed)) * price * 0.015;
    const openOffset = (Math.random() - 0.5) * price * 0.01;

    history.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(price + openOffset),
      high: Math.round(price + highOffset),
      low: Math.round(price - lowOffset),
      close: price,
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

router.get("/market/summary", (_req, res) => {
  const summary = {
    kospi: {
      name: "KOSPI",
      value: Math.round((2456.3 + Math.sin(Date.now() / 500000) * 20) * 100) / 100,
      change: Math.round(Math.sin(Date.now() / 500000) * 20 * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 500000) * 0.8 * 100) / 100,
    },
    kosdaq: {
      name: "KOSDAQ",
      value: Math.round((712.5 + Math.sin(Date.now() / 600000 + 1) * 8) * 100) / 100,
      change: Math.round(Math.sin(Date.now() / 600000 + 1) * 8 * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 600000 + 1) * 1.1 * 100) / 100,
    },
    usdKrw: {
      name: "USD/KRW",
      value: Math.round((1325.5 + Math.sin(Date.now() / 700000 + 2) * 5) * 100) / 100,
      change: Math.round(Math.sin(Date.now() / 700000 + 2) * 5 * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 700000 + 2) * 0.4 * 100) / 100,
    },
    sp500: {
      name: "S&P 500",
      value: Math.round((5234.2 + Math.sin(Date.now() / 800000 + 3) * 30) * 100) / 100,
      change: Math.round(Math.sin(Date.now() / 800000 + 3) * 30 * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 800000 + 3) * 0.6 * 100) / 100,
    },
    nasdaq: {
      name: "NASDAQ",
      value: Math.round((16420.8 + Math.sin(Date.now() / 900000 + 4) * 80) * 100) / 100,
      change: Math.round(Math.sin(Date.now() / 900000 + 4) * 80 * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 900000 + 4) * 0.5 * 100) / 100,
    },
    updatedAt: new Date().toISOString(),
  };
  const parsed = GetMarketSummaryResponse.parse(summary);
  res.json(parsed);
});

export default router;
