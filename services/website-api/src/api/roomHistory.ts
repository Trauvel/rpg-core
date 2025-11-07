import { Express, Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

/**
 * Middleware для проверки внутреннего токена сервиса
 */
const serviceTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const serviceToken = req.headers['x-service-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

  if (serviceToken === expectedToken) {
    // Для внутренних запросов создаем фиктивного пользователя из данных запроса
    (req as any).user = {
      userId: req.body.userId || req.body.masterId,
      email: '',
      username: 'system',
    };
    return next();
  }

  // Если нет внутреннего токена, проверяем обычную авторизацию
  return authMiddleware(req as AuthenticatedRequest, res, next);
};

/**
 * API для работы с историей комнат и сохранениями
 */
export function registerRoomHistoryApi(app: Express) {
  /**
   * @swagger
   * /api/rooms/history:
   *   get:
   *     summary: Получить историю комнат пользователя
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: История комнат
   *       401:
   *         description: Неавторизован
   */
  app.get('/api/rooms/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;

      const snapshots = await prisma.roomSnapshot.findMany({
        where: {
          userId: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        snapshots: snapshots.map(snapshot => ({
          id: snapshot.id,
          roomCode: snapshot.roomCode,
          masterId: snapshot.masterId,
          userId: snapshot.userId,
          players: JSON.parse(snapshot.state || '{}').players?.map((p: any) => p.userId) || [],
          gameStarted: snapshot.gameStarted,
          createdAt: snapshot.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Error getting room history:', error);
      res.status(500).json({ error: 'Ошибка получения истории комнат' });
    }
  });

  /**
   * @swagger
   * /api/rooms/saves:
   *   post:
   *     summary: Сохранить слепок комнаты
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *       - serviceToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roomCode
   *               - masterId
   *               - userId
   *               - state
   *               - gameStarted
   *             properties:
   *               roomCode:
   *                 type: string
   *               masterId:
   *                 type: string
   *               userId:
   *                 type: string
   *               players:
   *                 type: array
   *                 items:
   *                   type: string
   *               state:
   *                 type: string
   *               gameStarted:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Сохранение создано
   *       400:
   *         description: Неверные данные
   */
  app.post('/api/rooms/saves', serviceTokenMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { roomCode, masterId, userId, players, state, gameStarted } = req.body;

      if (!roomCode || !masterId || !userId || !state || typeof gameStarted !== 'boolean') {
        return res.status(400).json({ error: 'Неверные данные для сохранения' });
      }

      const snapshot = await prisma.roomSnapshot.create({
        data: {
          roomCode,
          masterId,
          userId,
          state: typeof state === 'string' ? state : JSON.stringify(state),
          gameStarted,
        },
      });

      res.json({
        id: snapshot.id,
        roomCode: snapshot.roomCode,
        masterId: snapshot.masterId,
        userId: snapshot.userId,
        gameStarted: snapshot.gameStarted,
        createdAt: snapshot.createdAt,
      });
    } catch (error: any) {
      console.error('Error saving room snapshot:', error);
      res.status(500).json({ error: 'Ошибка сохранения слепка комнаты' });
    }
  });

  /**
   * @swagger
   * /api/rooms/saves/:saveId:
   *   get:
   *     summary: Получить сохранение по ID
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: saveId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Сохранение найдено
   *       404:
   *         description: Сохранение не найдено
   */
  app.get('/api/rooms/saves/:saveId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { saveId } = req.params;
      const user = req.user!;

      const snapshot = await prisma.roomSnapshot.findUnique({
        where: { id: saveId },
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Сохранение не найдено' });
      }

      // Проверяем, что пользователь имеет доступ к сохранению
      if (snapshot.userId !== user.userId && snapshot.masterId !== user.userId) {
        return res.status(403).json({ error: 'Нет доступа к этому сохранению' });
      }

      res.json({
        id: snapshot.id,
        roomCode: snapshot.roomCode,
        masterId: snapshot.masterId,
        userId: snapshot.userId,
        state: snapshot.state,
        gameStarted: snapshot.gameStarted,
        createdAt: snapshot.createdAt,
      });
    } catch (error: any) {
      console.error('Error getting room snapshot:', error);
      res.status(500).json({ error: 'Ошибка получения сохранения' });
    }
  });

  /**
   * @swagger
   * /api/rooms/saves/:saveId:
   *   delete:
   *     summary: Удалить сохранение
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: saveId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Сохранение удалено
   *       404:
   *         description: Сохранение не найдено
   */
  app.delete('/api/rooms/saves/:saveId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { saveId } = req.params;
      const user = req.user!;

      const snapshot = await prisma.roomSnapshot.findUnique({
        where: { id: saveId },
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Сохранение не найдено' });
      }

      // Проверяем, что пользователь имеет доступ к сохранению
      if (snapshot.userId !== user.userId && snapshot.masterId !== user.userId) {
        return res.status(403).json({ error: 'Нет доступа к этому сохранению' });
      }

      await prisma.roomSnapshot.delete({
        where: { id: saveId },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting room snapshot:', error);
      res.status(500).json({ error: 'Ошибка удаления сохранения' });
    }
  });

  /**
   * @swagger
   * /api/rooms/saves/:saveId/restore:
   *   post:
   *     summary: Восстановить комнату из сохранения
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: saveId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Комната восстановлена
   *       404:
   *         description: Сохранение не найдено
   */
  app.post('/api/rooms/saves/:saveId/restore', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { saveId } = req.params;
      const user = req.user!;

      const snapshot = await prisma.roomSnapshot.findUnique({
        where: { id: saveId },
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Сохранение не найдено' });
      }

      // Проверяем, что пользователь имеет доступ к сохранению
      if (snapshot.userId !== user.userId && snapshot.masterId !== user.userId) {
        return res.status(403).json({ error: 'Нет доступа к этому сохранению' });
      }

      // Возвращаем данные сохранения для восстановления на game-server
      res.json({
        id: snapshot.id,
        roomCode: snapshot.roomCode,
        masterId: snapshot.masterId,
        userId: snapshot.userId,
        state: snapshot.state,
        gameStarted: snapshot.gameStarted,
        createdAt: snapshot.createdAt,
      });
    } catch (error: any) {
      console.error('Error restoring room snapshot:', error);
      res.status(500).json({ error: 'Ошибка восстановления комнаты' });
    }
  });
}

