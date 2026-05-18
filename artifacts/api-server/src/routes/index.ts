import { Router, type IRouter } from "express";
import stocksRouter from "./stocks.js";
import usersRouter from "./users.js";
import tradesRouter from "./trades.js";
import rankingsRouter from "./rankings.js";
import communityRouter from "./community.js";
import aiAdvisorRouter from "./ai-advisor.js";
import limitOrdersRouter from "./limitOrders.js";

const router: IRouter = Router();

router.use(stocksRouter);
router.use(usersRouter);
router.use(tradesRouter);
router.use(rankingsRouter);
router.use(communityRouter);
router.use(aiAdvisorRouter);
router.use(limitOrdersRouter);

export default router;
