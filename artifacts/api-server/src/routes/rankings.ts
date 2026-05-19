import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { usersTable, holdingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetRankingsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

/** stocks_realtime DB에서 현재가 조회, 없으면 avg_price 폴백 */
async function getLivePrice(ticker: string, avgPrice: number): Promise<number> {
  try {
    const res = await pool.query<{ current_price: string }>(
      "SELECT current_price FROM stocks_realtime WHERE ticker = $1 LIMIT 1",
      [ticker]
    );
    if (res.rows.length > 0 && res.rows[0].current_price) {
      const p = Number(res.rows[0].current_price);
      if (p > 0) return p;
    }
  } catch (_) {}
  return avgPrice;
}

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
          const livePrice = await getLivePrice(h.ticker, Number(h.avgPrice));
          stockValue += livePrice * Number(h.shares);
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
