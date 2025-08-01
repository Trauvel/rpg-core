import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";

export function registerLogger(eventBus: EventBus, stateManager: StateManager) {
  eventBus.on("*", (data, ctx, event) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] EVENT: ${event}` + "\n" + JSON.stringify(data, null, 2);

    console.log(message);

    // Записываем в state.public.logs (для игроков)
    const publicState = stateManager.getPublicState();
    !publicState.logs && (publicState.logs = []);
    publicState.logs.push(`${event}`);

    // Записываем полный лог мастера
    const masterState = stateManager.getMasterState();
    !masterState.logs && (masterState.logs = []);
    masterState.logs.push(message);

    // Ограничиваем длину логов (например, последние 100)
    if (publicState.logs.length > 100) publicState.logs.shift();
    if (masterState.logs.length > 300) masterState.logs.shift();

  }, 99);
}
registerLogger.priority = 99;