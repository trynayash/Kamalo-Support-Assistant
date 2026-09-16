import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import feedbackRouter from "./feedback";
import knowledgeRouter from "./knowledge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(feedbackRouter);
router.use(knowledgeRouter);

export default router;
