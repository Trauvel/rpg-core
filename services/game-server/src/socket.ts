import { Server } from "socket.io";
import { EventBus } from "./core/eventBus";
import { ActionProcessor } from "./core/actionProcessor";
import { StateManager } from "./core/stateManager";
import { GameEvent } from '@rpg-platform/shared';
import { SessionManager } from "./services/sessionManager";
import { RoomManager } from "./services/roomManager";

export function setupSocket(io: Server, eventBus: EventBus, actionProcessor: ActionProcessor, stateManager: StateManager) {
  io.on("connection", (socket) => {
    // Проверяем, что пользователь аутентифицирован
    if (!socket.data.authenticated || !socket.data.user) {
      console.log(`❌ Unauthenticated connection attempt from ${socket.id}`);
      socket.disconnect();
      return;
    }

    const user = socket.data.user;
    const roomCode = socket.handshake.auth?.roomCode || socket.handshake.query?.roomCode as string;

    console.log(`✅ New game connection: ${user.username} (${user.userId}) on socket ${socket.id}${roomCode ? ` to room ${roomCode}` : ''}`);

    // Если указан roomCode, присоединяемся к комнате
    if (roomCode) {
      const upperCode = roomCode.toUpperCase();
      const room = RoomManager.getRoomByCode(upperCode);

      if (!room) {
        console.log(`❌ Room not found: ${upperCode}`);
        socket.emit('room:error', { error: 'Комната не найдена' });
        socket.disconnect();
        return;
      }

      // Проверяем, присоединён ли уже игрок к комнате
      const existingPlayer = room.players.get(user.userId);
      
      if (existingPlayer) {
        // Обновляем подключение существующего игрока
        RoomManager.updatePlayerConnection(user.userId, socket.id, true);
        
        // Если это мастер, проверяем переподключение
        if (existingPlayer.role === 'master') {
          const wasPaused = room.isPaused;
          const wasInactive = !room.isActive;
          
          // Обновляем данные мастера
          room.masterSocketId = socket.id;
          room.masterLastSeen = new Date();
          
          // Если комната была закрыта, активируем её снова
          if (wasInactive) {
            room.isActive = true;
            io.to(upperCode).emit('room:reopened', {
              master: user.username,
              message: 'Мастер вернулся, комната активирована',
            });
            console.log(`🔄 Room ${upperCode} reopened by master ${user.username}`);
          }
          
          // Если комната на паузе, возобновляем игру
          if (wasPaused) {
            room.isPaused = false;
            io.to(upperCode).emit('room:resumed', { master: user.username });
            console.log(`▶️  Room ${upperCode} resumed by master ${user.username}`);
          }
          
          // Уведомляем всех игроков о возвращении мастера
          io.to(upperCode).emit('room:master-reconnected', {
            master: user.username,
            message: 'Мастер вернулся в комнату',
          });
          console.log(`👑 Master reconnected to room ${upperCode}: ${user.username}`);
        }
      } else {
        // Присоединяем нового игрока к комнате
        const result = RoomManager.joinRoom(upperCode, user.userId, user.username, socket.id);
        
        if (!result) {
          console.log(`❌ Failed to join room: ${upperCode}`);
          socket.emit('room:error', { error: 'Не удалось присоединиться к комнате' });
          socket.disconnect();
          return;
        }

        // Если это мастер (первый игрок), обновляем masterSocketId
        if (result.player.role === 'master') {
          room.masterSocketId = socket.id;
        }

        // Добавляем лог о присоединении нового игрока
        room.logManager.addPublicLog(`${result.player.username} присоединился к комнате`);
        room.logManager.addMasterLog(`Новый игрок ${result.player.username} (${result.player.userId}) присоединился к комнате`);
        
        // Уведомляем других игроков о новом участнике
        io.to(upperCode).except(socket.id).emit('room:player-joined', {
          userId: result.player.userId,
          username: result.player.username,
          role: result.player.role,
        });
      }

      // Присоединяемся к Socket.io комнате
      socket.join(upperCode);
      console.log(`🔗 Socket ${socket.id} joined room ${upperCode}`);

      // Отправляем текущее состояние игры комнаты
      socket.emit(GameEvent.STATE_CHANGED, room.stateManager.getState());
      
      // Отправляем логи
      if (existingPlayer && existingPlayer.role === 'master') {
        // Мастер получает все логи
        room.logManager.emitAllLogs(upperCode, socket.id, io);
      } else {
        // Обычные игроки получают только публичные логи
        room.logManager.emitPublicLogs(upperCode, io);
      }
      
      // Отправляем информацию о комнате
      socket.emit('room:joined', {
        room: {
          code: room.code,
          masterId: room.masterId,
          isPaused: room.isPaused,
          gameStarted: room.gameStarted,
          players: Array.from(room.players.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            isConnected: p.isConnected,
          })),
        },
      });
    } else {
      // Старое поведение для обратной совместимости (без комнат)
      const session = SessionManager.createOrUpdateSession(user, socket.id);
      console.log(`📝 Session created/updated for ${session.username}`);

      eventBus.emit(GameEvent.PLAYER_CONNECT, {
        socket_id: socket.id,
        userId: user.userId,
        username: user.username,
      });

      socket.emit(GameEvent.STATE_CHANGED, stateManager.getState());
    }

    socket.on("playerAction", (data) => {
      // Обновляем время последней активности
      SessionManager.updateActivity(user.userId);

      // Если есть roomCode, работаем с комнатой
      const currentRoomCode = socket.handshake.auth?.roomCode || socket.handshake.query?.roomCode as string;
      
      if (currentRoomCode) {
        const room = RoomManager.getRoomByCode(currentRoomCode.toUpperCase());
        if (room) {
          // Обновляем активность комнаты
          room.lastActivity = new Date();
          
          // Добавляем информацию о пользователе в данные действия
          data.data.socket_id = socket.id;
          data.data.userId = user.userId;
          data.data.username = user.username;
          
          // Обрабатываем действие через StateManager комнаты
          // TODO: Нужно будет обновить ActionProcessor для работы с комнатами
          actionProcessor.process(data.action, data.data);
        }
      } else {
        // Старое поведение
        data.data.socket_id = socket.id;
        data.data.userId = user.userId;
        data.data.username = user.username;
        actionProcessor.process(data.action, data.data);
      }
    });

    socket.on("disconnect", () => {
      const currentRoomCode = socket.handshake.auth?.roomCode || socket.handshake.query?.roomCode as string;
      
      if (currentRoomCode) {
        const upperCode = currentRoomCode.toUpperCase();
        const room = RoomManager.getRoomByCode(upperCode);
        
        if (room) {
          const player = room.players.get(user.userId);
          
          if (player) {
            // Обновляем статус подключения
            RoomManager.updatePlayerConnection(user.userId, socket.id, false);
            
            // Если это мастер, ставим комнату на паузу
            if (player.role === 'master') {
              room.isPaused = true;
              room.masterLastSeen = new Date();
              room.masterSocketId = undefined;
              
              io.to(upperCode).emit('room:paused', { reason: 'master-disconnected' });
              io.to(upperCode).except(socket.id).emit('room:master-disconnected', { master: user.username });
              console.log(`⏸️  Room ${upperCode} paused: master disconnected`);
            } else {
              // Уведомляем других игроков о выходе
              io.to(upperCode).except(socket.id).emit('room:player-left', {
                userId: user.userId,
                username: user.username,
              });
            }
          }
        }
      } else {
        // Старое поведение
        console.log(`👋 User disconnected: ${user.username} (${socket.id})`);
        SessionManager.removeSession(user.userId);
        console.log(`📝 Session removed for ${user.username}`);
        
        eventBus.emit(GameEvent.PLAYER_LEAVE, { 
          id: socket.id,
          userId: user.userId,
        });
      }
    });
  });
}