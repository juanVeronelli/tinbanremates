import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/credit-request", authMiddleware, authController.requestCredit);
router.get("/credit-requests", authMiddleware, authController.getMyCreditRequests);

export default router;
