import { Request, Response } from "express";
import AnalyticsService from "../service/AnalyticsService.js";

export default class AnalyticsController {

  static async track(req: Request, res: Response) {

    try {

      const user = (req as any).user;

      const {

        eventType,
        productId,
        orderId,
        sessionId,
        page,
        metadata

      } = req.body;

      const event = await AnalyticsService.trackEvent({

        eventType,

        userId: user?.id,

        productId,

        orderId,

        sessionId,

        page,

        metadata,

        ipAddress: req.ip,

        device: req.headers["user-agent"]

      });

      return res.status(201).json({

        success: true,

        event

      });

    }

    catch (error) {

      console.error(error);

      return res.status(500).json({

        success: false,

        message: "Unable to track event."

      });

    }

  }

}