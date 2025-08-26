import { PlayerMock } from "../api/data/mock/player";
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
                    ...PlayerMock
                }
            }
            return p;
        });
    });

    eventBus.on(GameEvent.PLAYER_UPDATE, (data) => {
        const publicState = stateManager.getPublicState();
        const playerIndex = publicState.players.findIndex((p) => p.id === data.playerId);

        if (playerIndex !== -1) {
            // Обновляем данные персонажа, сохраняя существующие поля
            publicState.players[playerIndex] = {
                ...publicState.players[playerIndex],
                ...data.playerData
            };

            // Логируем обновление
            if (!publicState.logs) publicState.logs = [];
            publicState.logs.push(`Персонаж ${publicState.players[playerIndex].name} обновлен`);

            // Ограничиваем количество логов
            if (publicState.logs.length > 50) {
                publicState.logs = publicState.logs.slice(-50);
            }
        }
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