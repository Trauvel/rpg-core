import { Express } from "express";
import { StateManager } from "../core/stateManager";
import { SessionManager } from "../services/sessionManager";
import { PersistenceService } from "../services/persistence";
import { GameState } from '@rpg-platform/shared';
import { apiAuthMiddleware, AuthenticatedRequest } from "../middleware/apiAuth";

/**
 * API для работы с игровыми сессиями
 * Это основной API для website-api для получения игровых данных
 */
export function registerGameSessionApi(app: Express, stateManager: StateManager, initialState: GameState) {
  /**
   * @swagger
   * /api/game-session/active:
   *   get:
   *     summary: Получить активную игровую сессию пользователя
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Активная сессия
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 session:
   *                   type: object
   *                   properties:
   *                     id: { type: string }
   *                     userId: { type: string }
   *                     username: { type: string }
   *                     socketId: { type: string }
   *                     isActive: { type: boolean }
   *       404:
   *         description: Активная сессия не найдена
   */
  app.get('/api/game-session/active', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      // Проверяем сессию в памяти
      const memorySession = SessionManager.getSession(userId);
      if (memorySession) {
        // Получаем состояние игрока из StateManager
        const publicState = stateManager.getPublicState();
        const player = publicState.players.find(p => p.userId === userId);

        return res.json({
          session: {
            id: memorySession.id,
            userId: memorySession.userId,
            username: memorySession.username,
            socketId: memorySession.socketId,
            isActive: true,
            createdAt: memorySession.createdAt,
            lastActivity: memorySession.lastActivity,
            player: player || null,
          },
        });
      }

      // Если сессии нет в памяти, проверяем БД через PersistenceService
      const savedState = await PersistenceService.loadPlayerState(userId);
      if (savedState) {
        return res.json({
          session: {
            id: userId,
            userId: userId,
            isActive: false, // Сессия не активна (нет подключения)
            player: savedState,
          },
        });
      }

      res.status(404).json({ error: 'Активная сессия не найдена' });
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({ error: 'Ошибка получения сессии' });
    }
  });

  /**
   * @swagger
   * /api/game-session/state:
   *   get:
   *     summary: Получить состояние игрока из game-server
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Состояние игрока
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 state:
   *                   $ref: '#/components/schemas/Player'
   *       404:
   *         description: Состояние не найдено
   */
  app.get('/api/game-session/state', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      // Сначала проверяем состояние в памяти
      const publicState = stateManager.getPublicState();
      const player = publicState.players.find(p => p.userId === userId);

      if (player) {
        return res.json({ state: player });
      }

      // Если нет в памяти, загружаем из БД
      const savedState = await PersistenceService.loadPlayerState(userId);
      if (savedState) {
        return res.json({ state: savedState });
      }

      res.status(404).json({ error: 'Состояние игрока не найдено' });
    } catch (error) {
      console.error('Error loading player state:', error);
      res.status(500).json({ error: 'Ошибка загрузки состояния' });
    }
  });

  /**
   * @swagger
   * /api/game-session/state:
   *   post:
   *     summary: Сохранить состояние игрока через game-server
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - state
   *             properties:
   *               state:
   *                 $ref: '#/components/schemas/Player'
   *     responses:
   *       200:
   *         description: Состояние сохранено
   *       500:
   *         description: Ошибка сохранения
   */
  app.post('/api/game-session/state', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'Состояние не предоставлено' });
      }

      // Обновляем состояние в памяти
      const publicState = stateManager.getPublicState();
      const playerIndex = publicState.players.findIndex(p => p.userId === userId);

      if (playerIndex !== -1) {
        // Обновляем существующего игрока
        publicState.players[playerIndex] = {
          ...publicState.players[playerIndex],
          ...state,
          userId: userId, // Сохраняем userId
        };
      } else {
        // Создаём нового игрока
        publicState.players.push({
          ...state,
          userId: userId,
        });
      }

      // Сохраняем в БД через PersistenceService
      const success = await PersistenceService.savePlayerState(userId, state);

      if (!success) {
        return res.status(500).json({ error: 'Ошибка сохранения состояния' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving player state:', error);
      res.status(500).json({ error: 'Ошибка сохранения состояния' });
    }
  });

  /**
   * @swagger
   * /api/game-session/create:
   *   post:
   *     summary: Создать игровую сессию (инициализирует игрока в game-server)
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               characterName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Сессия создана
   *       500:
   *         description: Ошибка создания сессии
   */
  app.post('/api/game-session/create', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      const { characterName } = req.body;

      // Загружаем сохранённое состояние из БД (если есть)
      const savedState = await PersistenceService.loadPlayerState(userId);

      // Добавляем игрока в состояние игры
      const publicState = stateManager.getPublicState();
      const existingPlayer = publicState.players.find(p => p.userId === userId);

      if (!existingPlayer) {
        publicState.players.push({
          id: userId,
          userId: userId,
          name: characterName || `Player-${userId.slice(0, 8)}`,
          ...(savedState || {}),
        });
      }

      res.json({
        session: {
          id: userId,
          userId: userId,
          isActive: SessionManager.getSession(userId) !== undefined,
          player: existingPlayer || publicState.players[publicState.players.length - 1],
        },
      });
    } catch (error) {
      console.error('Error creating game session:', error);
      res.status(500).json({ error: 'Ошибка создания игровой сессии' });
    }
  });

  /**
   * @swagger
   * /api/game-session/{sessionId}:
   *   put:
   *     summary: Обновить данные игровой сессии
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Сессия обновлена
   *       403:
   *         description: Доступ запрещён
   */
  app.put('/api/game-session/:sessionId', apiAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      const { sessionId } = req.params;
      if (sessionId !== userId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }

      const updateData = req.body;

      // Обновляем состояние в памяти
      const publicState = stateManager.getPublicState();
      const playerIndex = publicState.players.findIndex(p => p.userId === userId);

      if (playerIndex !== -1) {
        publicState.players[playerIndex] = {
          ...publicState.players[playerIndex],
          ...updateData,
          userId: userId, // Сохраняем userId
        };

        // Сохраняем в БД
        await PersistenceService.savePlayerState(userId, publicState.players[playerIndex]);

        res.json({ session: publicState.players[playerIndex] });
      } else {
        res.status(404).json({ error: 'Сессия не найдена' });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Ошибка обновления сессии' });
    }
  });
}

