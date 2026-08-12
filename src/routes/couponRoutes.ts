import { Router } from "express";
import CouponController from "../controller/CouponController.js";

const router = Router();

// CREATE COUPON
router.post("/create", CouponController.create );

// VALIDATE COUPON
router.post("/validate", CouponController.validate );

// GET ALL COUPONS
router.get("/getAll", CouponController.getAll );

// UPDATE COUPON
router.put("/update/:id", CouponController.update );

//toogle coupon status
router.put("/toggle/:id", CouponController.toggleStatus );

export default router;