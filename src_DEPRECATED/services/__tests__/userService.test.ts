import { UserService } from '../userService';
import { PasswordService } from '../../auth/password';
import { JWTService } from '../../auth/jwt';

// Мокаем зависимости
jest.mock('../../auth/password');
jest.mock('../../auth/jwt');
jest.mock('../../database/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('UserService', () => {
  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('должен создать пользователя с хешированным паролем', async () => {
      const createUserData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockHashedPassword = 'hashedpassword';
      (PasswordService.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.create.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });

      const result = await UserService.createUser(createUserData);

      expect(PasswordService.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserData.email,
          username: createUserData.username,
          password: mockHashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });
    });

    it('должен выбросить ошибку при пустом email', async () => {
      const createUserData = {
        email: '',
        username: 'testuser',
        password: 'password123',
      };

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.create.mockRejectedValue(new Error('Validation error'));

      await expect(UserService.createUser(createUserData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('должен успешно войти с правильными учетными данными', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockToken = 'jwt-token';
      (PasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (JWTService.generateToken as jest.Mock).mockReturnValue(mockToken);

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserService.login(loginData);

      expect(PasswordService.verifyPassword).toHaveBeenCalledWith(
        mockUser.password,
        loginData.password
      );
      expect(JWTService.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        token: mockToken,
      });
    });

    it('должен выбросить ошибку при неверном пароле', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (PasswordService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(UserService.login(loginData)).rejects.toThrow('Неверный пароль');
    });

    it('должен выбросить ошибку при несуществующем пользователе', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.login(loginData)).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('getUserById', () => {
    it('должен вернуть пользователя по ID', async () => {
      const userId = 'test-id';

      const mockPrisma = require('../../database/prisma').default;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });

      const result = await UserService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      });
    });
  });
});
