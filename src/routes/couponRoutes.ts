import { Router } from "express";
import CouponController from "../controller/CouponController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../middleware/AdminMiddleware.js";

const router = Router();

// CREATE COUPON - Admin only
router.post(
  "/create",
  authMiddleware,
  verifyAdmin,
  CouponController.create
);

// VALIDATE COUPON - Login required for FIRST_ORDER security
router.post(
  "/validate",
  authMiddleware,
  CouponController.validate
);

// GET ALL COUPONS - Customer checkout + Admin read
router.get("/getAll", CouponController.getAll);

// UPDATE COUPON - Admin only
router.put(
  "/update/:id",
  authMiddleware,
  verifyAdmin,
  CouponController.update
);

// TOGGLE COUPON STATUS - Admin only
router.put(
  "/toggle/:id",
  authMiddleware,
  verifyAdmin,
  CouponController.toggleStatus
);

// DELETE COUPON - Admin only
router.delete(
  "/delete/:id",
  authMiddleware,
  verifyAdmin,
  CouponController.delete
);

export default router;
