import app from "./app";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initDb() {
  console.log("=== DB 초기화 시작 ===");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        password TEXT NOT NULL DEFAULT '',
        avatar TEXT NOT NULL DEFAULT 'basic_m',
        gender TEXT NOT NULL DEFAULT '남',
        difficulty TEXT NOT NULL,
        seed_money NUMERIC(18,2) NOT NULL,
        cash_balance NUMERIC(18,2) NOT NULL,
        accessories TEXT NOT NULL DEFAULT '[]',
        equipped_items TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        shares NUMERIC(18,4) NOT NULL,
        avg_price NUMERIC(18,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        ticker TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        type TEXT NOT NULL,
        shares NUMERIC(18,4) NOT NULL,
        price NUMERIC(18,2) NOT NULL,
        total_amount NUMERIC(18,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stocks_realtime (
        id SERIAL PRIMARY KEY,
        ticker TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        current_price NUMERIC(18,2),
        change_price NUMERIC(18,2) DEFAULT 0,
        change_percent NUMERIC(8,4) DEFAULT 0,
        volume BIGINT DEFAULT 0,
        market_cap BIGINT DEFAULT 0,
        sector TEXT DEFAULT '',
        market TEXT DEFAULT 'KOSPI',
        high52w NUMERIC(18,2),
        low52w NUMERIC(18,2),
        per NUMERIC(10,2),
        pbr NUMERIC(10,2),
        eps NUMERIC(18,2),
        dividend_yield NUMERIC(8,4),
        open_price NUMERIC(18,2),
        high_price NUMERIC(18,2),
        low_price NUMERIC(18,2),
        logo_url TEXT DEFAULT '',
        trade_value BIGINT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stocks_history (
        id SERIAL PRIMARY KEY,
        ticker TEXT NOT NULL,
        date DATE NOT NULL,
        open_price NUMERIC(18,2),
        high_price NUMERIC(18,2),
        low_price NUMERIC(18,2),
        close_price NUMERIC(18,2),
        volume BIGINT,
        UNIQUE(ticker, date)
      );

      CREATE TABLE IF NOT EXISTS market_indices (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        value NUMERIC(18,4),
        change_percent NUMERIC(8,4),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS market_news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        source TEXT,
        url TEXT,
        ticker TEXT,
        sentiment TEXT DEFAULT 'neutral',
        published_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ipo_stocks (
        id SERIAL PRIMARY KEY,
        ticker TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        listing_date DATE,
        offer_price NUMERIC(18,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("=== DB 초기화 완료 ===");
  } catch (e) {
    console.error("DB 초기화 실패:", e);
  }
}

initDb().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
