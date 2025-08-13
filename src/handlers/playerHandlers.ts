import { GameEvent } from "../contracts/events";
import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";
import { Server } from "socket.io";

export function registerPlayerHandlers(eventBus: EventBus, stateManager: StateManager, io: Server) {
    eventBus.on(GameEvent.PLAYER_CONNECT, (data) => {
        const publicState = stateManager.getPublicState();
        if (!publicState.players.find((p) => p.id === data.socket_id)) {
            publicState.players.push({
                id: data.socket_id
            });
        }
    });

    eventBus.on(GameEvent.PLAYER_JOIN, (data) => {
        const publicState = stateManager.getPublicState();
        publicState.players = publicState.players.map((p) => {
            if (p.id === data.socket_id) {
                p = {
                    ...p,
                    name: data.name,
                    locationId: "forest", // стартовая локация
                    inventory: [],
                    hp: 10
                }
            }
            return p;
        });
    });

    eventBus.on(GameEvent.PLAYER_LEAVE, (data) => {
        const publicState = stateManager.getPublicState();
        publicState.players = publicState.players.filter((p) => p.id !== data.id);
    });

    eventBus.on(GameEvent.PLAYER_MOVE, (data) => {
        const publicState = stateManager.getPublicState();
        const player = publicState.players.find((p) => p.id === data.playerId);
        if (player) {
            player.locationId = data.to;
        }
    });
}