// src/routes/productRoutes.ts
import { Router } from "express";
import ProductController from "../controller/ProductController.js";
import { uploadCloudinary } from '../config/cloudinary'; // Config streams setup handler
import authMiddleware from "../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../middleware/AdminMiddleware.js";

const router = Router();

// 🔥 ADMIN SYSTEM UPLOAD SPECS: Multiplexing form fields allocation parameters cleanly
const adminUploadFields = uploadCloudinary.fields([
  { name: 'productImages', maxCount: 5 },  // Regular grid photo arrays
  { name: 'desktopBanner', maxCount: 1 },  // Horizontal desktop frame asset
  { name: 'mobileBanner', maxCount: 1 }   // Responsive mobile square frame asset
]);

// Admin Management Write/Update Entry Points Linked seamlessly with Middleware Guards
router.post("/addProduct", authMiddleware, verifyAdmin, adminUploadFields, ProductController.create);
router.put("/updateById/:id", authMiddleware, verifyAdmin, adminUploadFields, ProductController.update);

// Normal CRUD Systems Controls Trace lines
router.get("/getAllProduct", authMiddleware, verifyAdmin, ProductController.getAll);
router.get("/getById/:id", authMiddleware, verifyAdmin, ProductController.getById);
router.delete("/delete/:id", authMiddleware, verifyAdmin, ProductController.remove);

// ================= PUBLIC ENDPOINTS =================
router.get("/public/getAllProduct", ProductController.getPublicProducts);
router.get("/public/getById/:id", ProductController.getPublicProductById);

export default router;