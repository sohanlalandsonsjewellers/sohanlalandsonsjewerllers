import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import billRoutes from "./billRoutes.js";
import orderRoutes from "./orderRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/user", userRoutes);
router.use("/api/product", productRoutes);
router.use("/api/bill", billRoutes);
router.use("/api/order", orderRoutes);
router.use("/api/feedback", feedbackRoutes);


export default router;
