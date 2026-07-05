import { Router } from "express";
import {
    getShippingRates,
    createShipment
} from "../controller/ShippingController";

const router = Router();

router.post(
    "/rates",
    getShippingRates
);

router.post(
    "/create",
    createShipment
);

export default router;