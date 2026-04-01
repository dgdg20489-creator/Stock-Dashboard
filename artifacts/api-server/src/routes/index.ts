import { Router, type IRouter } from "express";
import stocksRouter from "./stocks.js";
import usersRouter from "./users.js";
import tradesRouter from "./trades.js";
import rankingsRouter from "./rankings.js";
import communityRouter from "./community.js";
import aiAdvisorRouter from "./ai-advisor.js";

const router: IRouter = Router();

router.use(stocksRouter);
router.use(usersRouter);
router.use(tradesRouter);
router.use(rankingsRouter);
router.use(communityRouter);
router.use(aiAdvisorRouter);

export default router;
