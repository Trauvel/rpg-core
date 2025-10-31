import { GameEvent } from '@rpg-platform/shared';
import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";
import { Server } from "socket.io";
import { PersistenceService } from "../services/persistence";

/**
 * Обработчик для синхронизации игрового состояния с БД
 * ВАЖНО: В production это должно быть добавлено с debouncing/throttling
 */
export function registerPersistenceHandlers(eventBus: EventBus, stateManager: StateManager, io: Server) {
    // Сохраняем состояние игрока при обновлении
    eventBus.on(GameEvent.PLAYER_UPDATE, async (data) => {
        const publicState = stateManager.getPublicState();
        const player = publicState.players.find((p) => p.id === data.playerId || p.userId === data.playerId);

        if (player && player.userId) {
            console.log(`💾 Saving player state for ${player.userId}...`);
            const success = await PersistenceService.savePlayerState(player.userId, player);

            if (success) {
                console.log(`✅ Player state saved for ${player.userId}`);
            } else {
                console.error(`❌ Failed to save player state for ${player.userId}`);
            }
        }
    });

    // Загружаем состояние игрока при подключении
    eventBus.on(GameEvent.PLAYER_CONNECT, async (data) => {
        if (data.userId) {
            console.log(`📥 Loading player state for ${data.userId}...`);
            const savedState = await PersistenceService.loadPlayerState(data.userId);

            if (savedState) {
                console.log(`✅ Player state loaded for ${data.userId}`);
                
                // Применяем сохранённое состояние к игроку в game state
                const publicState = stateManager.getPublicState();
                const playerIndex = publicState.players.findIndex((p) => p.userId === data.userId);

                if (playerIndex !== -1) {
                    publicState.players[playerIndex] = {
                        ...publicState.players[playerIndex],
                        ...savedState,
                    };

                    // Отправляем обновлённое состояние
                    io.emit(GameEvent.STATE_CHANGED, stateManager.getState());
                }
            } else {
                console.log(`ℹ️  No saved state found for ${data.userId}, using defaults`);
            }
        }
    });

    // Сохраняем состояние игрока при отключении
    eventBus.on(GameEvent.PLAYER_LEAVE, async (data) => {
        if (data.userId) {
            console.log(`💾 Saving final state for ${data.userId}...`);
            
            const publicState = stateManager.getPublicState();
            const player = publicState.players.find((p) => p.userId === data.userId);

            if (player) {
                const success = await PersistenceService.savePlayerState(data.userId, player);

                if (success) {
                    console.log(`✅ Final state saved for ${data.userId}`);
                } else {
                    console.error(`❌ Failed to save final state for ${data.userId}`);
                }
            }
        }
    });
}

