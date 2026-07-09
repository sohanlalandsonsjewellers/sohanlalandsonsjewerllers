import { EventType } from "@prisma/client";

export interface TrackEventDTO {

    eventType: EventType;

    productId?: string;

    orderId?: string;

    sessionId?: string;

    page?: string;

    metadata?: Record<string, unknown>;

}