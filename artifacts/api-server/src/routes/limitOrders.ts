import { Router, type IRouter } from "express";
import { pool, db } from "@workspace/db";
import { usersTable, holdingsTable, tradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.post("/limit-orders", async (req, res) => {
  try {
    const { userId, ticker, stockName, orderType, priceType, limitPrice, shares } = req.body;
    if (!userId || !ticker || !orderType || !priceType || !limitPrice || !shares || shares <= 0 || limitPrice <= 0) {
      return res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    if (orderType === "sell" || priceType === "scheduled_sell") {
      const [holding] = await db.select().from(holdingsTable).where(
        and(eq(holdingsTable.userId, userId), eq(holdingsTable.ticker, ticker))
      );
      if (!holding || Number(holding.shares) < shares) {
        return res.status(400).json({ success: false, message: `보유 수량이 부족합니다. 현재 보유: ${holding ? Number(holding.shares) : 0}주` });
      }
    }

    if (orderType === "buy" && priceType === "limit") {
      const required = limitPrice * shares;
      if (Number(user.cashBalance) < required) {
        return res.status(400).json({ success: false, message: `잔액이 부족합니다. 필요금액: ₩${required.toLocaleString("ko-KR")}` });
      }
    }

    await pool.query(
      `INSERT INTO limit_orders (user_id, ticker, stock_name, order_type, price_type, limit_price, shares)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, ticker, stockName, orderType, priceType, limitPrice, shares]
    );

    const typeLabel = priceType === "scheduled_sell" ? "예약매도" : `지정가 ${orderType === "buy" ? "매수" : "매도"}`;
    res.json({
      success: true,
      message: `${stockName} ${shares}주 ${typeLabel} 주문이 등록되었습니다. (${new Intl.NumberFormat("ko-KR").format(limitPrice)}원)`,
    });
  } catch (e) {
    console.error("[limit-orders] error:", e);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

router.get("/limit-orders/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await pool.query(
      `SELECT * FROM limit_orders WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      ticker: r.ticker,
      stockName: r.stock_name,
      orderType: r.order_type,
      priceType: r.price_type,
      limitPrice: Number(r.limit_price),
      shares: Number(r.shares),
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/limit-orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.body.userId);
    await pool.query(
      `UPDATE limit_orders SET status = 'cancelled' WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
