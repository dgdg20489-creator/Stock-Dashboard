import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetRankingsResponse } from "@workspace/api-zod";
import { getStockPrice } from "./stocksData.js";

const router: IRouter = Router();

router.get("/rankings", async (req, res) => {
  try {
    const difficulty = (req.query.difficulty as string) || "all";

    const users = await db.select().from(usersTable);

    const ranked = await Promise.all(
      users.map(async (user) => {
        const holdings = await db
          .select()
          .from(holdingsTable)
          .where(eq(holdingsTable.userId, user.id));

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

        return {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          difficulty: user.difficulty,
          seedMoney,
          totalAssets,
          totalReturn,
          totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
        };
      })
    );

    const filtered =
      difficulty === "all"
        ? ranked
        : ranked.filter((u) => u.difficulty === difficulty);

    const sorted = filtered
      .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
      .slice(0, 100)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    const result = GetRankingsResponse.parse(sorted);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
