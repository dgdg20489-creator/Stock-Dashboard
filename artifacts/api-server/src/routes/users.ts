import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { usersTable, holdingsTable, tradesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetUserResponse,
  GetUserPortfolioResponse,
  GetUserTradesResponse,
  EquipItemsResponse,
} from "@workspace/api-zod";
import { getStockByTicker } from "./stocksData.js";

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

/** stocks_realtime DB에서 현재가를 직접 조회 */
async function getCurrentPriceFromDB(pool: pg.Pool, ticker: string): Promise<number | null> {
  try {
    const res = await pool.query(
      "SELECT current_price FROM stocks_realtime WHERE ticker = $1 LIMIT 1",
      [ticker]
    );
    if (res.rows.length > 0 && res.rows[0].current_price) {
      return Number(res.rows[0].current_price);
    }
    return null;
  } catch {
    return null;
  }
}

/** stocks_realtime DB에서 현재가 + 등락률을 한 번에 조회 */
async function getStockRealtimeData(pool: pg.Pool, ticker: string): Promise<{ price: number | null; changePercent: number }> {
  try {
    const res = await pool.query(
      "SELECT current_price, change_pct FROM stocks_realtime WHERE ticker = $1 LIMIT 1",
      [ticker]
    );
    if (res.rows.length > 0 && res.rows[0].current_price) {
      return {
        price: Number(res.rows[0].current_price),
        changePercent: Math.round(Number(res.rows[0].change_pct || 0) * 100) / 100,
      };
    }
    return { price: null, changePercent: 0 };
  } catch {
    return { price: null, changePercent: 0 };
  }
}

router.post("/users", async (req, res) => {
  try {
    const { username, avatar, difficulty, phone, password } = req.body;
    if (!username || !avatar || !difficulty || !phone || !password) {
      res.status(400).json({ message: "username, avatar, difficulty, phone, password are required" });
      return;
    }

    // 전화번호 중복 체크
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.phone, phone));
    if (existing.length > 0) {
      res.status(409).json({ message: "이미 가입된 전화번호입니다." });
      return;
    }

    const seed = SEED_MONEY[difficulty] ?? 10_000_000;
    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        phone,
        password,
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

router.post("/users/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ message: "phone, password are required" });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, phone));

    if (!user) {
      res.status(401).json({ message: "전화번호가 등록되지 않았습니다." });
      return;
    }
    if (user.password !== password) {
      res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
      return;
    }

    const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, user.id));
    let stockValue = 0;
    for (const h of holdings) {
      const dbPrice = await getCurrentPriceFromDB(pool, h.ticker);
      const price = dbPrice ?? Number(h.avgPrice);
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
      const dbPrice = await getCurrentPriceFromDB(pool, h.ticker);
      const price = dbPrice ?? Number(h.avgPrice);
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
    const holdingItems = await Promise.all(holdings.map(async (h) => {
      const realtimeData = await getStockRealtimeData(pool, h.ticker);
      const stockMeta = getStockByTicker(h.ticker);
      const price = realtimeData.price ?? stockMeta?.basePrice ?? Number(h.avgPrice);
      const shares = Number(h.shares);
      const avgPrice = Number(h.avgPrice);
      const evaluationAmount = price * shares;
      const profitLoss = (price - avgPrice) * shares;
      const profitLossPercent = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;
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
        changePercent: realtimeData.changePercent,
      };
    }));

    const cashBalance = Number(user.cashBalance);
    const seedMoney = Number(user.seedMoney);
    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPercent = (totalReturn / seedMoney) * 100;

    // 자동 승격/강등 체크 (승격 우선)
    let promoted = false;
    let demoted = false;
    let newDifficulty: string | undefined;

    if (user.difficulty === "beginner" && totalReturnPercent >= 20) {
      await db.update(usersTable).set({ difficulty: "intermediate" }).where(eq(usersTable.id, userId));
      promoted = true;
      newDifficulty = "intermediate";
    } else if (user.difficulty === "intermediate" && totalReturnPercent >= 50) {
      await db.update(usersTable).set({ difficulty: "expert" }).where(eq(usersTable.id, userId));
      promoted = true;
      newDifficulty = "expert";
    } else if (user.difficulty === "expert" && totalReturnPercent <= -20) {
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

router.get("/users/:userId/public-profile", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId));
    const trades = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId))
      .orderBy(desc(tradesTable.createdAt))
      .limit(20);

    let stockValue = 0;
    const publicHoldings = await Promise.all(holdings.map(async (h) => {
      const dbPrice = await getCurrentPriceFromDB(pool, h.ticker);
      const stockMeta = getStockByTicker(h.ticker);
      const price = dbPrice ?? stockMeta?.basePrice ?? Number(h.avgPrice);
      const shares = Number(h.shares);
      const avgPrice = Number(h.avgPrice);
      const evaluationAmount = price * shares;
      const profitLossPercent = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;
      stockValue += evaluationAmount;
      return {
        ticker: h.ticker,
        name: h.stockName,
        shares,
        returnPercent: Math.round(profitLossPercent * 100) / 100,
      };
    }));

    const cashBalance = Number(user.cashBalance);
    const seedMoney = Number(user.seedMoney);
    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPercent = Math.round((totalReturn / seedMoney) * 10000) / 100;

    const publicTrades = trades.map((t) => ({
      id: t.id,
      type: t.type as "buy" | "sell",
      ticker: t.ticker,
      stockName: t.stockName,
      shares: Number(t.shares),
      returnPercent: null as number | null,
      createdAt: t.createdAt.toISOString(),
    }));

    res.json({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      difficulty: user.difficulty,
      totalReturnPercent,
      holdings: publicHoldings,
      recentTrades: publicTrades,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/users/:userId/username", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { username } = req.body as { username?: string };

    if (!username || typeof username !== "string" || username.trim().length < 2) {
      res.status(400).json({ message: "닉네임은 2자 이상이어야 합니다." });
      return;
    }

    const trimmed = username.trim();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ username: trimmed })
      .where(eq(usersTable.id, userId))
      .returning();

    const cashNum = Number(updated.cashBalance);
    const result = GetUserResponse.parse(buildUserResponse(updated, cashNum, 0, 0));
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await db.delete(tradesTable).where(eq(tradesTable.userId, userId));
    await db.delete(holdingsTable).where(eq(holdingsTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    res.json({ success: true, message: "계정이 삭제되었습니다." });
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
