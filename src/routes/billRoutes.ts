// src/routes/billRoutes.ts
import { Router } from "express";
import BillController from "../controller/BillController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../middleware/AdminMiddleware.js";

const router = Router();

// Create bill (admin + customer)
router.post("/create", authMiddleware, BillController.create);

// Get all bills (admin only)
router.get("/all", authMiddleware, verifyAdmin, BillController.getAll);

// Get bill by ID (admin only)
router.get("/getById/:id", authMiddleware, verifyAdmin, BillController.getById);

// Update bill (admin only)
router.put("/update/:id", authMiddleware, verifyAdmin, BillController.update);

// Delete bill (admin only)
router.delete("/delete/:id", authMiddleware, verifyAdmin, BillController.remove);

// Export Excel (admin only)
router.get("/export", authMiddleware, verifyAdmin, BillController.exportExcel);

export default router;
