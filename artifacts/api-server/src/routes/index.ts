import { Router, type IRouter } from "express";
import stocksRouter from "./stocks.js";
import usersRouter from "./users.js";
import tradesRouter from "./trades.js";
import rankingsRouter from "./rankings.js";

const router: IRouter = Router();

router.use(stocksRouter);
router.use(usersRouter);
router.use(tradesRouter);
router.use(rankingsRouter);

export default router;
