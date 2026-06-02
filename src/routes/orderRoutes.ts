import { Router } from "express";
import OrderController from "../controller/OrderController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../middleware/AdminMiddleware.js";

const router = Router();

router.post("/place", authMiddleware, OrderController.placeOrder);

// (Admin only)
router.get("/all", authMiddleware, verifyAdmin, OrderController.getAllOrders);
// router.put("/status/:id", authMiddleware, verifyAdmin, OrderController.updateStatusOnly);
router.put("/edit/:id", authMiddleware, verifyAdmin, OrderController.editOrderDetails);
router.delete("/delete/:id", authMiddleware, verifyAdmin, OrderController.deleteOrder);

// (User only)
// (User only)
router.get("/my-orders", authMiddleware, OrderController.getMyOrders);

// ✅ FIX: Notifications ke liye GET request honi chahiye
router.get("/notifications/my", authMiddleware, OrderController.getMyNotifications);
// ✅ Admin status update ke liye PUT request
router.put("/status/:id", authMiddleware, verifyAdmin, OrderController.updateOrderStatus);
// orderRoutes.ts
router.get("/bill-pdf/:id", OrderController.getOrderBillPdf);

export default router;