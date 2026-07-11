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

  static async dashboardSummary(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days) || 7;

      const summary =
        await AnalyticsService.getDashboardSummary(days);

      return res.status(200).json({

        success: true,

        summary

      });

    }

    catch (error) {

      console.error(
        "Dashboard Summary Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch dashboard summary."

      });

    }

  }

  static async topProducts(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days) || 7;

      const products =
        await AnalyticsService.getTopProducts(days);

      return res.status(200).json({

        success: true,

        products

      });

    }

    catch (error) {

      console.error(
        "Top Products Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch top products."

      });

    }

  }

  static async conversionFunnel(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days) || 7;

      const funnel =
        await AnalyticsService.getConversionFunnel(days);

      return res.status(200).json({

        success: true,

        funnel

      });

    }

    catch (error) {

      console.error(error);

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch conversion funnel."

      });

    }

  }

  static async searchAnalytics(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days) || 7;

      const searches =
        await AnalyticsService.getSearchAnalytics(days);

      return res.status(200).json({

        success: true,

        searches

      });

    }

    catch (error) {

      console.error(
        "Search Analytics Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch search analytics."

      });

    }

  }

  static async dailyAnalytics(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days ?? 7);

      const analytics =
        await AnalyticsService.getDailyAnalytics(days);

      return res.status(200).json({

        success: true,

        analytics

      });

    }

    catch (error) {

      console.error(
        "Daily Analytics Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch daily analytics."

      });

    }

  }

  static async realtimeAnalytics(
    req: Request,
    res: Response
  ) {

    try {

      const realtime =
        await AnalyticsService.getRealtimeAnalytics();

      return res.status(200).json({

        success: true,

        realtime

      });

    }

    catch (error) {

      console.error(
        "Realtime Analytics Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch realtime analytics."

      });

    }

  }

  static async overview(
    req: Request,
    res: Response
  ) {

    try {

      const days = Number(req.query.days);

      const safeDays =
        Number.isNaN(days)
          ? 7
          : Math.min(
            Math.max(days, 1),
            365
          );

      const overview =
        await AnalyticsService.getOverview(
          safeDays
        );

      return res.status(200).json({

        success: true,

        overview

      });

    }

    catch (error) {

      console.error(
        "Overview Analytics Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch analytics overview."

      });

    }

  }

  static async businessDashboard(
    req: Request,
    res: Response
  ) {

    try {

      const dashboard =
        await AnalyticsService.getBusinessDashboard();

      return res.status(200).json({

        success: true,

        dashboard

      });

    }

    catch (error) {

      console.error(
        "Business Dashboard Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch business dashboard."

      });

    }

  }

  static async revenueChart(
    req: Request,
    res: Response
  ) {

    try {

      const days =
        Number(req.query.days) || 7;

      const revenue =
        await AnalyticsService.getRevenueChart(days);

      return res.status(200).json({

        success: true,

        revenue

      });

    }

    catch (error) {

      console.error(
        "Revenue Chart Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch revenue chart."

      });

    }

  }

  static async topCustomers(
    req: Request,
    res: Response
  ) {

    try {

      const customers =
        await AnalyticsService.getTopCustomers();

      return res.status(200).json({

        success: true,

        customers

      });

    }

    catch (error) {

      console.error(
        "Top Customers Error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch top customers."

      });

    }

  }

  static async customerInsights(
    req: Request,
    res: Response
  ) {

    try {

      const insights =
        await AnalyticsService.getCustomerInsights();

      return res.status(200).json({

        success: true,

        insights

      });

    }

    catch (error) {

      console.error(

        "Customer Insights Error:",

        error

      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch customer insights."

      });

    }

  }

  static async recentOrders(
    req: Request,
    res: Response
  ) {

    try {

      const orders =
        await AnalyticsService.getRecentOrders();

      return res.status(200).json({

        success: true,

        orders

      });

    }

    catch (error) {

      console.error(

        "Recent Orders Error:",

        error

      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch recent orders."

      });

    }

  }

}