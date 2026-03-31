import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable, tradesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetUserResponse,
  GetUserPortfolioResponse,
  GetUserTradesResponse,
  EquipItemsResponse,
} from "@workspace/api-zod";
import { getStockPrice, getStockByTicker } from "./stocksData.js";

const router: IRouter = Router();

const SEED_MONEY: Record<string, number> = {
  beginner: 10_000_000,
  intermediate: 5_000_000,
  expert: 1_000_000,
};

function parseAccessories(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function parseEquipped(raw: string): Record<string, string> {
  try { return JSON.parse(raw); } catch { return {}; }
}

function buildUserResponse(user: typeof usersTable.$inferSelect, totalAssets: number, totalReturn: number, totalReturnPercent: number) {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    difficulty: user.difficulty,
    seedMoney: Number(user.seedMoney),
    cashBalance: Number(user.cashBalance),
    totalAssets,
    totalReturn,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
    accessories: parseAccessories(user.accessories),
    equippedItems: parseEquipped(user.equippedItems),
    createdAt: user.createdAt.toISOString(),
  };
}

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
        accessories: "[]",
        equippedItems: "{}",
      })
      .returning();

    const cashNum = Number(user.cashBalance);
    const result = GetUserResponse.parse(buildUserResponse(user, cashNum, 0, 0));
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
      const stockMeta = getStockByTicker(h.ticker);
      const { price } = getStockPrice(stockMeta?.basePrice ?? Number(h.avgPrice), h.ticker);
      stockValue += price * Number(h.shares);
    }

    const cashBalance = Number(user.cashBalance);
    const seedMoney = Number(user.seedMoney);
    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPercent = (totalReturn / seedMoney) * 100;

    const result = GetUserResponse.parse(buildUserResponse(user, totalAssets, totalReturn, totalReturnPercent));
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
      const stockMeta = getStockByTicker(h.ticker);
      const { price } = getStockPrice(stockMeta?.basePrice ?? Number(h.avgPrice), h.ticker);
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

    // 자동 승격/강등 체크 (승격 우선)
    let promoted = false;
    let demoted = false;
    let newDifficulty: string | undefined;

    // 승격 조건
    if (user.difficulty === "beginner" && totalReturnPercent >= 20) {
      await db.update(usersTable).set({ difficulty: "intermediate" }).where(eq(usersTable.id, userId));
      promoted = true;
      newDifficulty = "intermediate";
    } else if (user.difficulty === "intermediate" && totalReturnPercent >= 50) {
      await db.update(usersTable).set({ difficulty: "expert" }).where(eq(usersTable.id, userId));
      promoted = true;
      newDifficulty = "expert";
    }
    // 강등 조건 (수익률 -20% 이하)
    else if (user.difficulty === "expert" && totalReturnPercent <= -20) {
      await db.update(usersTable).set({ difficulty: "intermediate" }).where(eq(usersTable.id, userId));
      demoted = true;
      newDifficulty = "intermediate";
    } else if (user.difficulty === "intermediate" && totalReturnPercent <= -20) {
      await db.update(usersTable).set({ difficulty: "beginner" }).where(eq(usersTable.id, userId));
      demoted = true;
      newDifficulty = "beginner";
    }

    const result = GetUserPortfolioResponse.parse({
      userId,
      cashBalance,
      totalAssets,
      totalReturn,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      holdings: holdingItems,
      ...(promoted && { promoted, newDifficulty }),
      ...(demoted && { demoted, newDifficulty }),
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
      .limit(100);

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

router.put("/users/:userId/equip", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { slot, itemId } = req.body as { slot: string; itemId?: string | null };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const equipped = parseEquipped(user.equippedItems);
    if (itemId) {
      equipped[slot] = itemId;
    } else {
      delete equipped[slot];
    }

    await db.update(usersTable)
      .set({ equippedItems: JSON.stringify(equipped) })
      .where(eq(usersTable.id, userId));

    const result = EquipItemsResponse.parse({ success: true, equippedItems: equipped });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
