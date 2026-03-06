import { Router } from "express";
import * as bidController from "../controllers/bidController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/:id/bid", authMiddleware, bidController.placeBid);
router.get("/:id/bids", bidController.getBidHistory);

export default router;
