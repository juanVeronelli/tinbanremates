import { Router } from "express";
import * as auctionController from "../controllers/auctionController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/auth.js";

const router = Router();

// Listado con visibilidad: sin auth solo ACTIVE/PAUSED/ENDED; con auth+crédito o admin incluye DRAFT
router.get("/", optionalAuthMiddleware, auctionController.listAuctions);
router.get("/categories", auctionController.getCategories);
router.get("/attributes", auctionController.getAttributeDefs);
router.get("/:id", optionalAuthMiddleware, auctionController.getAuction);
router.get("/:id/active", auctionController.getActiveAuction);

// Admin
router.post("/", authMiddleware, adminMiddleware, auctionController.createAuction);
router.patch("/:id", authMiddleware, adminMiddleware, auctionController.updateAuction);
router.post("/:id/status", authMiddleware, adminMiddleware, auctionController.setAuctionStatus);
router.delete("/:id", authMiddleware, adminMiddleware, auctionController.deleteAuction);

export default router;
