import { Server } from "socket.io";
import { EventBus } from "./core/eventBus";
import { ActionProcessor } from "./core/actionProcessor";
import { StateManager } from "./core/stateManager";
import { GameEvent } from '@rpg-platform/shared';
import { SessionManager } from "./services/sessionManager";

export function setupSocket(io: Server, eventBus: EventBus, actionProcessor: ActionProcessor, stateManager: StateManager) {
  io.on("connection", (socket) => {
    // Проверяем, что пользователь аутентифицирован
    if (!socket.data.authenticated || !socket.data.user) {
      console.log(`❌ Unauthenticated connection attempt from ${socket.id}`);
      socket.disconnect();
      return;
    }

    const user = socket.data.user;
    console.log(`✅ New game connection: ${user.username} (${user.userId}) on socket ${socket.id}`);

    // Создаём или обновляем игровую сессию
    const session = SessionManager.createOrUpdateSession(user, socket.id);
    console.log(`📝 Session created/updated for ${session.username}`);

    // Отправляем событие подключения с информацией о пользователе
    eventBus.emit(GameEvent.PLAYER_CONNECT, {
      socket_id: socket.id,
      userId: user.userId,
      username: user.username,
    });

    socket.on("playerAction", (data) => {
      // Обновляем время последней активности
      SessionManager.updateActivity(user.userId);

      // Добавляем информацию о пользователе в данные действия
      data.data.socket_id = socket.id;
      data.data.userId = user.userId;
      data.data.username = user.username;
      actionProcessor.process(data.action, data.data);
    });

    socket.on("disconnect", () => {
      console.log(`👋 User disconnected: ${user.username} (${socket.id})`);
      
      // Удаляем сессию
      SessionManager.removeSession(user.userId);
      console.log(`📝 Session removed for ${user.username}`);
      
      eventBus.emit(GameEvent.PLAYER_LEAVE, { 
        id: socket.id,
        userId: user.userId,
      });
    });

    // Отправляем текущее состояние игры при подключении
    socket.emit(GameEvent.STATE_CHANGED, stateManager.getState());
  });
}