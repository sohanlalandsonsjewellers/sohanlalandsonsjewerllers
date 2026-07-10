import { Router } from "express";
import AnalyticsController from "../controller/AnalyticsController.js";
import optionalAuthMiddleware from "../../middleware/OptionalAuthMiddleware.js";
import AuthMiddleware from "../../middleware/AuthMiddleware.js";
import { verifyAdmin } from "../../middleware/AdminMiddleware.js";

const router = Router();

router.post("/event", optionalAuthMiddleware, AnalyticsController.track);
router.get("/dashboard",AuthMiddleware, verifyAdmin, AnalyticsController.dashboardSummary);
router.get("/top-products", AuthMiddleware, verifyAdmin, AnalyticsController.topProducts);
router.get("/funnel", AuthMiddleware, verifyAdmin, AnalyticsController.conversionFunnel );
router.get("/search", AuthMiddleware, verifyAdmin, AnalyticsController.searchAnalytics );
router.get("/daily",AuthMiddleware,verifyAdmin,AnalyticsController.dailyAnalytics);
router.get("/realtime",AuthMiddleware,verifyAdmin,AnalyticsController.realtimeAnalytics);
router.get("/overview",AuthMiddleware,verifyAdmin,AnalyticsController.overview);

export default router;