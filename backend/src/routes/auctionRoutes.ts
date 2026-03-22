import { Router } from "express";
import * as auctionController from "../controllers/auctionController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/auth.js";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const router = Router();

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Listado con visibilidad: sin auth solo ACTIVE/PAUSED/ENDED; con auth+crédito o admin incluye DRAFT
router.get("/", optionalAuthMiddleware, auctionController.listAuctions);
router.get("/categories", auctionController.getCategories);
router.get("/attributes", auctionController.getAttributeDefs);
router.get("/catalogs", auctionController.getCatalogs);
router.get("/:id", optionalAuthMiddleware, auctionController.getAuction);
router.get("/:id/active", auctionController.getActiveAuction);

// Admin
router.post("/", authMiddleware, adminMiddleware, auctionController.createAuction);
router.patch("/:id", authMiddleware, adminMiddleware, auctionController.updateAuction);
router.post("/:id/status", authMiddleware, adminMiddleware, auctionController.setAuctionStatus);
router.delete("/:id", authMiddleware, adminMiddleware, auctionController.deleteAuction);
router.post(
  "/photos/upload",
  authMiddleware,
  adminMiddleware,
  upload.array("photos", 10),
  auctionController.uploadAuctionPhotos,
);

export default router;
