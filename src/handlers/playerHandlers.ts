import { GameEvent } from "../contracts/events";
import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";
import { Server } from "socket.io";

export function registerPlayerHandlers(eventBus: EventBus, stateManager: StateManager, io: Server) {
    eventBus.on(GameEvent.PLAYER_JOIN, (data) => {
        const state = stateManager.getState();
        if (!state.players.find((p) => p.id === data.id)) {
            state.players.push({
                id: data.id,
                name: data.name,
                locationId: "forest", // стартовая локация
                inventory: [],
                hp: 10
            });
        }
        io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    });

    eventBus.on(GameEvent.PLAYER_LEAVE, (data) => {
        const state = stateManager.getState();
        state.players = state.players.filter((p) => p.id !== data.id);
        io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    });

    eventBus.on(GameEvent.PLAYER_MOVE, (data) => {
        const state = stateManager.getState();
        const player = state.players.find((p) => p.id === data.playerId);
        if (player) {
            player.locationId = data.to;
        }
        io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    });
}