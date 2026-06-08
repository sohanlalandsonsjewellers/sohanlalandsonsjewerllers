import { Router } from "express";
import { submitGuestFeedback, submitAuthFeedback, getAllFeedbacks } from "../controller/feedbackController";
import authMiddleware from "../middleware/AuthMiddleware";

const router = Router();

// Guest Feedback: No auth required
router.post("/submit-guest", submitGuestFeedback);

// Auth Feedback: Requires login (middleware check)
router.post("/submit", authMiddleware, submitAuthFeedback);

// Get All
router.get("/all", getAllFeedbacks);

export default router;