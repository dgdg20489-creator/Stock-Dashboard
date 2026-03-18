import { Router, type IRouter } from "express";
import {
  GetStocksResponse,
  GetStockByTickerResponse,
  GetStockHistoryResponse,
  GetMarketSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const STOCKS_DATA = [
  {
    ticker: "005930",
    name: "삼성전자",
    basePrice: 72000,
    sector: "반도체",
    marketCap: 4295000,
    high52w: 88800,
    low52w: 59900,
    per: 14.2,
    pbr: 1.35,
    eps: 5070,
    dividendYield: 2.1,
  },
  {
    ticker: "000660",
    name: "SK하이닉스",
    basePrice: 186000,
    sector: "반도체",
    marketCap: 1352000,
    high52w: 238000,
    low52w: 138000,
    per: 8.5,
    pbr: 2.1,
    eps: 21900,
    dividendYield: 0.8,
  },
  {
    ticker: "035420",
    name: "NAVER",
    basePrice: 165000,
    sector: "IT서비스",
    marketCap: 270000,
    high52w: 235000,
    low52w: 145000,
    per: 28.3,
    pbr: 1.8,
    eps: 5830,
    dividendYield: 0.5,
  },
  {
    ticker: "035720",
    name: "카카오",
    basePrice: 38500,
    sector: "IT서비스",
    marketCap: 171500,
    high52w: 62000,
    low52w: 33000,
    per: 42.1,
    pbr: 1.2,
    eps: 915,
    dividendYield: 0.3,
  },
  {
    ticker: "373220",
    name: "LG에너지솔루션",
    basePrice: 320000,
    sector: "배터리",
    marketCap: 749000,
    high52w: 420000,
    low52w: 285000,
    per: 52.4,
    pbr: 3.8,
    eps: 6110,
    dividendYield: 0.2,
  },
  {
    ticker: "005380",
    name: "현대차",
    basePrice: 195000,
    sector: "자동차",
    marketCap: 416500,
    high52w: 287000,
    low52w: 180000,
    per: 5.8,
    pbr: 0.65,
    eps: 33620,
    dividendYield: 3.2,
  },
  {
    ticker: "051910",
    name: "LG화학",
    basePrice: 295000,
    sector: "화학",
    marketCap: 208500,
    high52w: 380000,
    low52w: 262000,
    per: 18.2,
    pbr: 0.95,
    eps: 16210,
    dividendYield: 1.8,
  },
  {
    ticker: "006400",
    name: "삼성SDI",
    basePrice: 275000,
    sector: "배터리",
    marketCap: 189200,
    high52w: 380000,
    low52w: 230000,
    per: 22.5,
    pbr: 1.2,
    eps: 12220,
    dividendYield: 0.9,
  },
  {
    ticker: "207940",
    name: "삼성바이오로직스",
    basePrice: 870000,
    sector: "바이오",
    marketCap: 620000,
    high52w: 1050000,
    low52w: 780000,
    per: 68.5,
    pbr: 6.2,
    eps: 12700,
    dividendYield: 0.1,
  },
  {
    ticker: "000270",
    name: "기아",
    basePrice: 85000,
    sector: "자동차",
    marketCap: 345000,
    high52w: 120000,
    low52w: 72000,
    per: 4.2,
    pbr: 0.72,
    eps: 20240,
    dividendYield: 4.5,
  },
];

function getSimulatedPrice(
  basePrice: number,
  ticker: string
): { price: number; change: number; changePercent: number } {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const timeBasedFactor = Math.sin(Date.now() / 1000000 + seed) * 0.03;
  const randomFactor = (Math.random() - 0.5) * 0.01;
  const totalFactor = timeBasedFactor + randomFactor;
  const price = Math.round(basePrice * (1 + totalFactor));
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;
  return { price, change, changePercent };
}

function formatVolume(ticker: string): number {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.floor((seed * 12345) % 5000000) + 500000;
}

router.get("/stocks", (_req, res) => {
  const stocks = STOCKS_DATA.map((s) => {
    const { price, change, changePercent } = getSimulatedPrice(
      s.basePrice,
      s.ticker
    );
    return {
      ticker: s.ticker,
      name: s.name,
      currentPrice: price,
      change: Math.round(change),
      changePercent: Math.round(changePercent * 100) / 100,
      volume: formatVolume(s.ticker),
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

  const { price, change, changePercent } = getSimulatedPrice(
    stock.basePrice,
    stock.ticker
  );

  const detail = {
    ticker: stock.ticker,
    name: stock.name,
    currentPrice: price,
    change: Math.round(change),
    changePercent: Math.round(changePercent * 100) / 100,
    volume: formatVolume(stock.ticker),
    marketCap: stock.marketCap,
    sector: stock.sector,
    high52w: stock.high52w,
    low52w: stock.low52w,
    per: stock.per,
    pbr: stock.pbr,
    eps: stock.eps,
    dividendYield: stock.dividendYield,
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
    case "1d":
      days = 1;
      break;
    case "1w":
      days = 7;
      break;
    case "1m":
      days = 30;
      break;
    case "3m":
      days = 90;
      break;
    case "1y":
      days = 365;
      break;
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
      volume: formatVolume(stock.ticker + i),
    });
  }

  const parsed = GetStockHistoryResponse.parse(history);
  res.json(parsed);
});

router.get("/market/summary", (_req, res) => {
  const summary = {
    kospi: {
      name: "KOSPI",
      value: 2456.3 + Math.sin(Date.now() / 500000) * 20,
      change: Math.round((Math.sin(Date.now() / 500000) * 20) * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 500000) * 0.8 * 100) / 100,
    },
    kosdaq: {
      name: "KOSDAQ",
      value: 712.5 + Math.sin(Date.now() / 600000 + 1) * 8,
      change: Math.round((Math.sin(Date.now() / 600000 + 1) * 8) * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 600000 + 1) * 1.1 * 100) / 100,
    },
    usdKrw: {
      name: "USD/KRW",
      value: 1325.5 + Math.sin(Date.now() / 700000 + 2) * 5,
      change: Math.round((Math.sin(Date.now() / 700000 + 2) * 5) * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 700000 + 2) * 0.4 * 100) / 100,
    },
    sp500: {
      name: "S&P 500",
      value: 5234.2 + Math.sin(Date.now() / 800000 + 3) * 30,
      change: Math.round((Math.sin(Date.now() / 800000 + 3) * 30) * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 800000 + 3) * 0.6 * 100) / 100,
    },
    nasdaq: {
      name: "NASDAQ",
      value: 16420.8 + Math.sin(Date.now() / 900000 + 4) * 80,
      change: Math.round((Math.sin(Date.now() / 900000 + 4) * 80) * 100) / 100,
      changePercent: Math.round(Math.sin(Date.now() / 900000 + 4) * 0.5 * 100) / 100,
    },
    updatedAt: new Date().toISOString(),
  };

  const parsed = GetMarketSummaryResponse.parse(summary);
  res.json(parsed);
});

export default router;
