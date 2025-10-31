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
   *                   $ref: '#/components/schemas/User'
   *             example:
   *               user:
   *                 id: 'clx1234567890'
   *                 email: 'user@example.com'
   *                 username: 'player1'
   *                 createdAt: '2024-01-15T10:00:00Z'
   *       400:
   *         description: Ошибка валидации или пользователь уже существует
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
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: securePassword123
   *     responses:
   *       200:
   *         description: Успешный вход
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *             example:
   *               user:
   *                 id: 'clx1234567890'
   *                 email: 'user@example.com'
   *                 username: 'player1'
   *               token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   *       400:
   *         description: Неверный формат данных
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Неверные учетные данные
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *                   $ref: '#/components/schemas/User'
   *             example:
   *               user:
   *                 id: 'clx1234567890'
   *                 email: 'user@example.com'
   *                 username: 'player1'
   *                 createdAt: '2024-01-15T10:00:00Z'
   *       401:
   *         description: Недействительный токен
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
  app.get('/api/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await UserService.getUserById(req.user!.userId);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
}
