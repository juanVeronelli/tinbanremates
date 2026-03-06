import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/credit-requests", adminController.listCreditRequests);
router.post("/credit-requests/:id/resolve", adminController.resolveCreditRequest);
router.get("/categories", adminController.listCategories);
router.post("/categories", adminController.createCategory);
router.get("/attributes", adminController.listAttributeDefs);
router.post("/attributes", adminController.createAttributeDef);
router.delete("/attributes/:id", adminController.deleteAttributeDef);

export default router;
