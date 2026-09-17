import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import feedbackRouter from "./feedback";
import knowledgeRouter from "./knowledge";
import ticketsRouter from "./tickets";
import { ImageUploadError } from "../lib/image-attachments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(feedbackRouter);
router.use(knowledgeRouter);
router.use(ticketsRouter);

router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ImageUploadError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  next(error);
});

export default router;
