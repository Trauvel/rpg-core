import { Express } from "express";
import { RoomManager, RoomSettings } from "../services/roomManager";
import { apiAuthMiddleware, AuthenticatedRequest } from "../middleware/apiAuth";
import { AutoSaveService } from "../services/autoSave";
import { Server } from "socket.io";

/**
 * API для работы с игровыми комнатами
 */
export function registerRoomApi(app: Express, io: Server) {
  /**
   * @swagger
   * /api/rooms/create:
   *   post:
   *     summary: Создать новую игровую комнату
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               maxPlayers:
   *                 type: number
   *                 description: Максимальное количество игроков (опционально)
   *               characterSelection:
   *                 type: string
   *                 enum: [predefined, in-room]
   *                 description: Способ выбора персонажа
   *     responses:
   *       200:
   *         description: Комната создана
   *       401:
   *         description: Неавторизован
   *       500:
   *         description: Ошибка сервера
   */
  app.post('/api/rooms/create', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { maxPlayers, characterSelection = 'predefined' } = req.body;
      const user = req.user!;

      // Валидация
      if (characterSelection !== 'predefined' && characterSelection !== 'in-room') {
        return res.status(400).json({ error: 'Неверный способ выбора персонажа' });
      }

      if (maxPlayers && (maxPlayers < 1 || maxPlayers > 100)) {
        return res.status(400).json({ error: 'Максимальное количество игроков должно быть от 1 до 100' });
      }

      // Создаём комнату (socketId будет установлен при подключении к WebSocket)
      const settings: RoomSettings = {
        maxPlayers,
        characterSelection,
      };

      // Создаём комнату без socketId, он будет установлен при WebSocket подключении
      const room = RoomManager.createRoom(
        user.userId,
        user.username,
        undefined, // socketId будет установлен при WebSocket подключении
        settings,
        io
      );

      res.json({
        room: {
          id: room.id,
          code: room.code,
          masterId: room.masterId,
          maxPlayers: room.maxPlayers,
          characterSelection: room.characterSelection,
          isPaused: room.isPaused,
          isActive: room.isActive,
          players: Array.from(room.players.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            characterId: p.characterId,
            isConnected: p.isConnected,
            joinedAt: p.joinedAt,
          })),
          createdAt: room.createdAt,
          gameStarted: room.gameStarted,
        },
      });
    } catch (error: any) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: error.message || 'Ошибка создания комнаты' });
    }
  });

  /**
   * @swagger
   * /api/rooms/join:
   *   post:
   *     summary: Присоединиться к комнате
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *                 description: Код комнаты
   *               characterId:
   *                 type: string
   *                 description: ID персонажа (опционально)
   *     responses:
   *       200:
   *         description: Успешно присоединился
   *       400:
   *         description: Комната заполнена или неверный код
   *       404:
   *         description: Комната не найдена
   *       401:
   *         description: Неавторизован
   */
  app.post('/api/rooms/join', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code, characterId } = req.body;
      const user = req.user!;

      if (!code) {
        return res.status(400).json({ error: 'Код комнаты обязателен' });
      }

      // Временно используем пустой socketId, он будет обновлён при WebSocket подключении
      let result;
      try {
        result = RoomManager.joinRoom(
          code.toUpperCase(),
          user.userId,
          user.username,
          '', // socketId будет установлен при подключении
          characterId
        );
      } catch (error: any) {
        if (error.message === 'Комната заполнена') {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }

      if (!result) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }

      const { room, player } = result;

      res.json({
        room: {
          id: room.id,
          code: room.code,
          masterId: room.masterId,
          maxPlayers: room.maxPlayers,
          characterSelection: room.characterSelection,
          isPaused: room.isPaused,
          isActive: room.isActive,
          players: Array.from(room.players.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            characterId: p.characterId,
            isConnected: p.isConnected,
            joinedAt: p.joinedAt,
          })),
          createdAt: room.createdAt,
          gameStarted: room.gameStarted,
        },
        player: {
          userId: player.userId,
          username: player.username,
          role: player.role,
          characterId: player.characterId,
        },
      });
    } catch (error: any) {
      console.error('Error joining room:', error);
      if (error.message === 'Комната заполнена') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Ошибка присоединения к комнате' });
    }
  });

  /**
   * @swagger
   * /api/rooms/:code:
   *   get:
   *     summary: Получить информацию о комнате
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Информация о комнате
   *       404:
   *         description: Комната не найдена
   */
  app.get('/api/rooms/:code', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.params;
      const room = RoomManager.getRoomByCode(code.toUpperCase());

      if (!room) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }

      res.json({
        room: {
          id: room.id,
          code: room.code,
          masterId: room.masterId,
          maxPlayers: room.maxPlayers,
          characterSelection: room.characterSelection,
          isPaused: room.isPaused,
          isActive: room.isActive,
          players: Array.from(room.players.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            characterId: p.characterId,
            isConnected: p.isConnected,
            joinedAt: p.joinedAt,
          })),
          createdAt: room.createdAt,
          gameStarted: room.gameStarted,
        },
      });
    } catch (error: any) {
      console.error('Error getting room info:', error);
      res.status(500).json({ error: 'Ошибка получения информации о комнате' });
    }
  });

  /**
   * @swagger
   * /api/rooms/:code/pause:
   *   post:
   *     summary: Поставить игру на паузу или возобновить (только мастер)
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - paused
   *             properties:
   *               paused:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Пауза установлена/снята
   *       403:
   *         description: Только мастер может управлять паузой
   *       404:
   *         description: Комната не найдена
   */
  app.post('/api/rooms/:code/pause', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.params;
      const { paused } = req.body;
      const user = req.user!;

      if (typeof paused !== 'boolean') {
        return res.status(400).json({ error: 'Поле paused должно быть boolean' });
      }

      const success = RoomManager.setPause(code.toUpperCase(), paused, user.userId);

      if (!success) {
        const room = RoomManager.getRoomByCode(code.toUpperCase());
        if (!room) {
          return res.status(404).json({ error: 'Комната не найдена' });
        }
        return res.status(403).json({ error: 'Только мастер может управлять паузой' });
      }

      // Сохраняем комнату при паузе
      if (paused) {
        AutoSaveService.saveOnPause(code.toUpperCase()).catch(err => {
          console.error('Error saving room on pause:', err);
        });
      }

      res.json({ success: true, paused });
    } catch (error: any) {
      console.error('Error setting pause:', error);
      res.status(500).json({ error: 'Ошибка установки паузы' });
    }
  });

  /**
   * @swagger
   * /api/rooms/:code/start:
   *   post:
   *     summary: Начать игру (только мастер)
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Игра начата
   *       403:
   *         description: Только мастер может начать игру
   *       404:
   *         description: Комната не найдена
   */
  app.post('/api/rooms/:code/start', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.params;
      const user = req.user!;

      const success = RoomManager.startGame(code.toUpperCase(), user.userId);

      if (!success) {
        const room = RoomManager.getRoomByCode(code.toUpperCase());
        if (!room) {
          return res.status(404).json({ error: 'Комната не найдена' });
        }
        return res.status(403).json({ error: 'Только мастер может начать игру' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error starting game:', error);
      res.status(500).json({ error: 'Ошибка начала игры' });
    }
  });
}

