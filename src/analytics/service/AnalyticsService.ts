import prisma from "../../config/db.config.js";
import type { EventType } from "@prisma/client";

export interface TrackEventPayload {
  eventType: EventType;
  userId?: string;
  productId?: string;
  orderId?: string;
  sessionId?: string;
  page?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  os?: string;
  metadata?: Record<string, any>;
}

export default class AnalyticsService {

  static async trackEvent(payload: TrackEventPayload) {

    try {

      return await prisma.event.create({

        data: {

          eventType: payload.eventType,

          userId: payload.userId,

          productId: payload.productId,

          orderId: payload.orderId,

          sessionId: payload.sessionId,

          page: payload.page,

          ipAddress: payload.ipAddress,

          device: payload.device,

          browser: payload.browser,

          os: payload.os,

          metadata: payload.metadata ?? {}

        }

      });

    } catch (error) {

      console.error("Analytics Error:", error);

      throw error;

    }

  }

}