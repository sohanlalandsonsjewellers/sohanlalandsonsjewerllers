import { Router } from "express";
import AuthController from "../controller/AuthController";
import authMiddleware from "../middleware/AuthMiddleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

// 🚀 ADDED THIS MISSING ROUTE
router.get("/me", authMiddleware, AuthController.getMe);

export default router;