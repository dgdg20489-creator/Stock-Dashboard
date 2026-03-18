import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable, tradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ExecuteTradeResponse } from "@workspace/api-zod";
import { getStockByTicker, getStockPrice } from "./stocksData.js";

const router: IRouter = Router();

router.post("/trades", async (req, res) => {
  try {
    const { userId, ticker, type, shares } = req.body;
    if (!userId || !ticker || !type || !shares || shares <= 0) {
      res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
      return;
    }

    const stockMeta = getStockByTicker(ticker);
    if (!stockMeta) {
      res.status(404).json({ success: false, message: "종목을 찾을 수 없습니다." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      return;
    }

    const { price } = getStockPrice(stockMeta.basePrice, ticker);
    const totalAmount = price * shares;
    const cashBalance = Number(user.cashBalance);

    if (type === "buy") {
      if (cashBalance < totalAmount) {
        res.status(400).json({ success: false, message: `잔액이 부족합니다. 현재 잔액: ₩${Math.floor(cashBalance).toLocaleString("ko-KR")}` });
        return;
      }

      const newBalance = cashBalance - totalAmount;
      await db.update(usersTable).set({ cashBalance: String(newBalance) }).where(eq(usersTable.id, userId));

      const [existing] = await db.select().from(holdingsTable).where(
        and(eq(holdingsTable.userId, userId), eq(holdingsTable.ticker, ticker))
      );

      if (existing) {
        const existingShares = Number(existing.shares);
        const existingAvg = Number(existing.avgPrice);
        const newShares = existingShares + shares;
        const newAvg = (existingAvg * existingShares + price * shares) / newShares;
        await db.update(holdingsTable)
          .set({ shares: String(newShares), avgPrice: String(newAvg) })
          .where(eq(holdingsTable.id, existing.id));
      } else {
        await db.insert(holdingsTable).values({
          userId,
          ticker,
          stockName: stockMeta.name,
          shares: String(shares),
          avgPrice: String(price),
        });
      }

      const [trade] = await db.insert(tradesTable).values({
        userId,
        ticker,
        stockName: stockMeta.name,
        type: "buy",
        shares: String(shares),
        price: String(price),
        totalAmount: String(totalAmount),
      }).returning();

      const result = ExecuteTradeResponse.parse({
        success: true,
        trade: {
          id: trade.id,
          userId: trade.userId,
          ticker: trade.ticker,
          stockName: trade.stockName,
          type: trade.type,
          shares: Number(trade.shares),
          price: Number(trade.price),
          totalAmount: Number(trade.totalAmount),
          createdAt: trade.createdAt.toISOString(),
        },
        newCashBalance: newBalance,
        message: `${stockMeta.name} ${shares}주 매수 완료`,
      });
      res.json(result);

    } else if (type === "sell") {
      const [existing] = await db.select().from(holdingsTable).where(
        and(eq(holdingsTable.userId, userId), eq(holdingsTable.ticker, ticker))
      );

      if (!existing || Number(existing.shares) < shares) {
        const owned = existing ? Number(existing.shares) : 0;
        res.status(400).json({ success: false, message: `보유 수량이 부족합니다. 현재 보유: ${owned}주` });
        return;
      }

      const newBalance = cashBalance + totalAmount;
      await db.update(usersTable).set({ cashBalance: String(newBalance) }).where(eq(usersTable.id, userId));

      const newShares = Number(existing.shares) - shares;
      if (newShares <= 0) {
        await db.delete(holdingsTable).where(eq(holdingsTable.id, existing.id));
      } else {
        await db.update(holdingsTable).set({ shares: String(newShares) }).where(eq(holdingsTable.id, existing.id));
      }

      const [trade] = await db.insert(tradesTable).values({
        userId,
        ticker,
        stockName: stockMeta.name,
        type: "sell",
        shares: String(shares),
        price: String(price),
        totalAmount: String(totalAmount),
      }).returning();

      const result = ExecuteTradeResponse.parse({
        success: true,
        trade: {
          id: trade.id,
          userId: trade.userId,
          ticker: trade.ticker,
          stockName: trade.stockName,
          type: trade.type,
          shares: Number(trade.shares),
          price: Number(trade.price),
          totalAmount: Number(trade.totalAmount),
          createdAt: trade.createdAt.toISOString(),
        },
        newCashBalance: newBalance,
        message: `${stockMeta.name} ${shares}주 매도 완료`,
      });
      res.json(result);
    } else {
      res.status(400).json({ success: false, message: "type은 buy 또는 sell이어야 합니다." });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

export default router;
