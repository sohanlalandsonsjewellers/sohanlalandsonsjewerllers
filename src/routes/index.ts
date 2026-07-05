import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import billRoutes from "./billRoutes.js";
import orderRoutes from "./orderRoutes";
import feedbackRoutes from "./feedbackRoutes";
import shippingRoutes from "./shippingRoutes";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/user", userRoutes);
router.use("/api/product", productRoutes);
router.use("/api/bill", billRoutes);
router.use("/api/order", orderRoutes);
router.use("/api/feedback", feedbackRoutes);
router.use("/api/shipping", shippingRoutes);


export default router;
