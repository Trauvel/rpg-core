import request from 'supertest';
import express from 'express';
import { registerAuthApi } from '../auth';

// Мокаем зависимости
jest.mock('../../services/userService');
jest.mock('../../auth/jwt');
jest.mock('../../auth/password');

const { UserService } = require('../../services/userService');
const { JWTService } = require('../../auth/jwt');
const { PasswordService } = require('../../auth/password');

// Создаем тестовое приложение
const app = express();
app.use(express.json());
registerAuthApi(app);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-id',
        email: userData.email,
        username: userData.username,
        createdAt: new Date(),
      };

      UserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('должен вернуть ошибку при отсутствии обязательных полей', async () => {
      const userData = {
        email: 'test@example.com',
        // username отсутствует
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Все поля обязательны');
    });

    it('должен вернуть ошибку при пустом email', async () => {
      const userData = {
        email: '',
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('должен войти с правильными учетными данными', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          id: 'test-id',
          email: loginData.email,
          username: 'testuser',
        },
        token: 'jwt-token',
      };

      UserService.login.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('должен вернуть ошибку при отсутствии email', async () => {
      const loginData = {
        // email отсутствует
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email и пароль обязательны');
    });

    it('должен вернуть ошибку при отсутствии пароля', async () => {
      const loginData = {
        email: 'test@example.com',
        // password отсутствует
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email и пароль обязательны');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('должен вернуть профиль пользователя с валидным токеном', async () => {
      const userData = {
        email: 'profile@example.com',
        username: 'profileuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-id',
        email: userData.email,
        username: userData.username,
        createdAt: new Date(),
      };

      const mockLoginResult = {
        user: mockUser,
        token: 'valid-jwt-token',
      };

      // Мокаем сервисы
      UserService.createUser.mockResolvedValue(mockUser);
      UserService.login.mockResolvedValue(mockLoginResult);
      UserService.getUserById.mockResolvedValue(mockUser);
      JWTService.verifyToken.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });

      // Сначала регистрируем пользователя
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Затем входим
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Получаем профиль
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('user');
      expect(profileResponse.body.user.email).toBe(userData.email);
      expect(profileResponse.body.user.username).toBe(userData.username);
    });

    it('должен вернуть ошибку без токена', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Токен не предоставлен');
    });

    it('должен вернуть ошибку с невалидным токеном', async () => {
      JWTService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Недействительный токен');
    });
  });
});
