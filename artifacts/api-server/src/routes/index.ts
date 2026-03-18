import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import stocksRouter from "./stocks.js";
import usersRouter from "./users.js";
import tradesRouter from "./trades.js";
import rankingsRouter from "./rankings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stocksRouter);
router.use(usersRouter);
router.use(tradesRouter);
router.use(rankingsRouter);

export default router;
