import { Server } from "socket.io";
import { EventBus } from "./core/eventBus";
import { ActionProcessor } from "./core/actionProcessor";
import { StateManager } from "./core/stateManager";
import { GameEvent } from "./contracts/events";

export function setupSocket(io: Server, eventBus: EventBus, actionProcessor: ActionProcessor, stateManager: StateManager) {
  io.on("connection", (socket) => {
    eventBus.emit(GameEvent.PLAYER_CONNECT, {
      socket_id: socket.id,
    });

    socket.on("playerAction", (data) => {
      data.data.socket_id = socket.id;
      actionProcessor.process(data.action, data.data);
    });

    socket.on("disconnect", () => {
      eventBus.emit(GameEvent.PLAYER_LEAVE, { id: socket.id });
    });

    socket.emit(GameEvent.STATE_CHANGED, stateManager.getState());
  });
}