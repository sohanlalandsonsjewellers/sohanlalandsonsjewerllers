import { EventType } from "@prisma/client";

export function validateEventType(event: string) {

    return Object.values(EventType).includes(
        event as EventType
    );

}