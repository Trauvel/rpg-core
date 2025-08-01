import { GameEvent } from "../contracts/events";
import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";
import { Server } from "socket.io";

export function registerPlayerHandlers(eventBus: EventBus, stateManager: StateManager, io: Server) {
    eventBus.on(GameEvent.PLAYER_JOIN, (data) => {
        const pubicState = stateManager.getPublicState();
        if (!pubicState.players.find((p) => p.id === data.id)) {
            pubicState.players.push({
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
        const pubicState = stateManager.getPublicState();
        pubicState.players = pubicState.players.filter((p) => p.id !== data.id);
        io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    });

    eventBus.on(GameEvent.PLAYER_MOVE, (data) => {
        const pubicState = stateManager.getPublicState();
        const player = pubicState.players.find((p) => p.id === data.playerId);
        if (player) {
            player.locationId = data.to;
        }
        io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    });
}