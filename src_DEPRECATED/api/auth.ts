import { Express } from "express";
import { UserService } from "../services/userService";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

export function registerAuthApi(app: Express) {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Регистрация нового пользователя
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - username
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email пользователя
   *               username:
   *                 type: string
   *                 description: Имя пользователя
   *               password:
   *                 type: string
   *                 description: Пароль пользователя
   *     responses:
   *       201:
   *         description: Пользователь успешно создан
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     email:
   *                       type: string
   *                     username:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Ошибка валидации или пользователь уже существует
   *       500:
   *         description: Ошибка сервера
   */
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
      }

      const user = await UserService.createUser({ email, username, password });
      res.status(201).json({ user });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
      }
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Вход пользователя
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Успешный вход
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                 token:
   *                   type: string
   *       401:
   *         description: Неверные учетные данные
   */
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
      }

      const result = await UserService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Получение профиля пользователя
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Профиль пользователя
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *       401:
   *         description: Недействительный токен
   */
  app.get('/api/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await UserService.getUserById(req.user!.userId);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
}
