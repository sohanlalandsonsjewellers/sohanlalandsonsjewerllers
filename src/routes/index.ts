import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import billRoutes from "./billRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/user", userRoutes);
router.use("/api/product", productRoutes);
router.use("/api/bill", billRoutes);
router.use("/api/order", orderRoutes);

export default router;
