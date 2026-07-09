import { Router } from "express";

import AnalyticsController
  from "../controller/AnalyticsController.js";

import optionalAuthMiddleware
from "../../middleware/OptionalAuthMiddleware.js";;

const router = Router();

router.post("/event", optionalAuthMiddleware, AnalyticsController.track);

export default router;