import { Express } from "express";
import { GameSessionService } from "../services/gameSessionService";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

export function registerGameSessionApi(app: Express) {
  /**
   * @swagger
   * /api/game-session/create:
   *   post:
   *     summary: Создать новую игровую сессию
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
   *         description: Сессия создана или возвращена существующая
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 session:
   *                   $ref: '#/components/schemas/GameSession'
   *       401:
   *         description: Неавторизован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post('/api/game-session/create', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { characterName } = req.body;
      const session = await GameSessionService.createSession({
        userId: req.user!.userId,
        characterName,
      });

      res.json({ session });
    } catch (error) {
      console.error('Error creating game session:', error);
      res.status(500).json({ error: 'Ошибка создания игровой сессии' });
    }
  });

  /**
   * @swagger
   * /api/game-session/active:
   *   get:
   *     summary: Получить активную сессию пользователя
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
   *                   $ref: '#/components/schemas/GameSession'
   *       404:
   *         description: Активная сессия не найдена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get('/api/game-session/active', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const session = await GameSessionService.getActiveSession(req.user!.userId);

      if (!session) {
        return res.status(404).json({ error: 'Активная сессия не найдена' });
      }

      res.json({ session });
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({ error: 'Ошибка получения сессии' });
    }
  });

  /**
   * @swagger
   * /api/game-session/history:
   *   get:
   *     summary: Получить историю всех сессий пользователя
   *     tags: [GameSession]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Список сессий
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sessions:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/GameSession'
   *       401:
   *         description: Неавторизован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get('/api/game-session/history', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const sessions = await GameSessionService.getUserSessions(req.user!.userId);
      res.json({ sessions });
    } catch (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({ error: 'Ошибка получения сессий' });
    }
  });

  /**
   * @swagger
   * /api/game-session/{sessionId}/update:
   *   put:
   *     summary: Обновить данные сессии (только владелец)
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
   *             properties:
   *               level:
   *                 type: number
   *               experience:
   *                 type: number
   *               characterName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Сессия обновлена
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 session:
   *                   $ref: '#/components/schemas/GameSession'
   *       403:
   *         description: Доступ запрещён
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.put('/api/game-session/:sessionId/update', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      const updateData = req.body;

      // Проверяем, что сессия принадлежит пользователю
      const session = await GameSessionService.getActiveSession(req.user!.userId);
      if (!session || session.id !== sessionId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }

      const updatedSession = await GameSessionService.updateGameData(sessionId, updateData);
      res.json({ session: updatedSession });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Ошибка обновления сессии' });
    }
  });

  /**
   * @swagger
   * /api/game-session/state/load:
   *   get:
   *     summary: Загрузить состояние игрока
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
   *                   $ref: '#/components/schemas/PlayerState'
   *       404:
   *         description: Сессия не найдена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Неавторизован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get('/api/game-session/state/load', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const state = await GameSessionService.loadPlayerState(req.user!.userId);

      if (!state) {
        return res.status(404).json({ error: 'Активная сессия не найдена' });
      }

      res.json({ state });
    } catch (error) {
      console.error('Error loading player state:', error);
      res.status(500).json({ error: 'Ошибка загрузки состояния' });
    }
  });

  /**
   * @swagger
   * /api/game-session/state/save:
   *   post:
   *     summary: Сохранить состояние игрока
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
   *                 $ref: '#/components/schemas/PlayerState'
   *     responses:
   *       200:
   *         description: Состояние сохранено
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Состояние не предоставлено
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Активная сессия не найдена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Неавторизован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post('/api/game-session/state/save', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { state } = req.body;

      if (!state) {
        return res.status(400).json({ error: 'Состояние не предоставлено' });
      }

      const success = await GameSessionService.savePlayerState(req.user!.userId, state);

      if (!success) {
        return res.status(404).json({ error: 'Активная сессия не найдена' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving player state:', error);
      res.status(500).json({ error: 'Ошибка сохранения состояния' });
    }
  });
}

