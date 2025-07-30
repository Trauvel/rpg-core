import { EventBus } from "../core/eventBus";
import { GameEvent, EventPayloadMap } from "../contracts/events";

export function registerLogger(eventBus: EventBus) {
  // Подписываемся на все события из GameEvent
  for (const eventKey of Object.values(GameEvent)) {
    eventBus.on(eventKey as GameEvent, (data: EventPayloadMap[GameEvent]) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] EVENT: ${eventKey}`, JSON.stringify(data, null, 2));
    });
  }
}
registerLogger.priority = 99;