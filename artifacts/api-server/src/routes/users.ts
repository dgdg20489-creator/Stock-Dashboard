import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable, tradesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetUserResponse,
  GetUserPortfolioResponse,
  GetUserTradesResponse,
} from "@workspace/api-zod";
import { getStockPrice } from "./stocksData.js";

const router: IRouter = Router();

const SEED_MONEY: Record<string, number> = {
  beginner: 10_000_000,
  intermediate: 5_000_000,
  expert: 1_000_000,
};

router.post("/users", async (req, res) => {
  try {
    const { username, avatar, difficulty } = req.body;
    if (!username || !avatar || !difficulty) {
      res.status(400).json({ message: "username, avatar, difficulty are required" });
      return;
    }
    const seed = SEED_MONEY[difficulty] ?? 10_000_000;
    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        avatar,
        difficulty,
        seedMoney: String(seed),
        cashBalance: String(seed),
      })
      .returning();

    const seedNum = Number(user.seedMoney);
    const cashNum = Number(user.cashBalance);
    const result = GetUserResponse.parse({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      difficulty: user.difficulty,
      seedMoney: seedNum,
      cashBalance: cashNum,
      totalAssets: cashNum,
      totalReturn: 0,
      totalReturnPercent: 0,
      createdAt: user.createdAt.toISOString(),
    });
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const holdings = await db
      .select()
      .from(holdingsTable)
      .where(eq(holdingsTable.userId, userId));

    let stockValue = 0;
    for (const h of holdings) {
      const { price } = getStockPrice(Number(h.avgPrice), h.ticker);
      stockValue += price * Number(h.shares);
    }

    const cashBalance = Number(user.cashBalance);
    const seedMoney = Number(user.seedMoney);
    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPercent = (totalReturn / seedMoney) * 100;

    const result = GetUserResponse.parse({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      difficulty: user.difficulty,
      seedMoney,
      cashBalance,
      totalAssets,
      totalReturn,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      createdAt: user.createdAt.toISOString(),
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:userId/portfolio", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const holdings = await db
      .select()
      .from(holdingsTable)
      .where(eq(holdingsTable.userId, userId));

    let stockValue = 0;
    const holdingItems = holdings.map((h) => {
      const { price } = getStockPrice(Number(h.avgPrice), h.ticker);
      const shares = Number(h.shares);
      const avgPrice = Number(h.avgPrice);
      const evaluationAmount = price * shares;
      const profitLoss = (price - avgPrice) * shares;
      const profitLossPercent = ((price - avgPrice) / avgPrice) * 100;
      stockValue += evaluationAmount;
      return {
        ticker: h.ticker,
        name: h.stockName,
        shares,
        avgPrice,
        currentPrice: price,
        evaluationAmount,
        profitLoss,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      };
    });

    const cashBalance = Number(user.cashBalance);
    const seedMoney = Number(user.seedMoney);
    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPercent = (totalReturn / seedMoney) * 100;

    const result = GetUserPortfolioResponse.parse({
      userId,
      cashBalance,
      totalAssets,
      totalReturn,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      holdings: holdingItems,
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:userId/trades", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const trades = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId))
      .orderBy(desc(tradesTable.createdAt))
      .limit(50);

    const result = GetUserTradesResponse.parse(
      trades.map((t) => ({
        id: t.id,
        userId: t.userId,
        ticker: t.ticker,
        stockName: t.stockName,
        type: t.type,
        shares: Number(t.shares),
        price: Number(t.price),
        totalAmount: Number(t.totalAmount),
        createdAt: t.createdAt.toISOString(),
      }))
    );
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
