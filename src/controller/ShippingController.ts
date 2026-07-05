import { Request, Response } from "express";
import NimbusService from "../services/NimbusService";

// ===========================
// Shipping Rates
// ===========================

export const getShippingRates = async (
    req: Request,
    res: Response
) => {

    try {

        const data =
            await NimbusService.getShippingRates(req.body);

        return res.json(data);

    } catch (err: any) {

        console.error(
            err.response?.data || err
        );

        return res.status(500).json({

            success: false,

            message:
                err.response?.data || err.message

        });

    }

};

// ===========================
// Create Shipment
// ===========================

export const createShipment = async (
    req: Request,
    res: Response
) => {

    try {

        const data =
            await NimbusService.createShipment(req.body);

        return res.json(data);

    } catch (err: any) {

        console.error(
            err.response?.data || err
        );

        return res.status(500).json({

            success: false,

            message:
                err.response?.data || err.message

        });

    }

};