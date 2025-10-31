import prisma from '../database/prisma';
import { PasswordService, JWTService, UserPayload } from '@rpg-platform/shared';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class UserService {
  static async createUser(data: CreateUserData) {
    const hashedPassword = await PasswordService.hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const isValidPassword = await PasswordService.verifyPassword(
      user.password,
      data.password
    );

    if (!isValidPassword) {
      throw new Error('Неверный пароль');
    }

    const payload: UserPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const token = JWTService.generateToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
  }
}
