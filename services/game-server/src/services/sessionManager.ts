import { UserPayload } from '@rpg-platform/shared';

/**
 * Менеджер игровых сессий в памяти
 * В будущем можно добавить персистентность через БД или Redis
 */
export class SessionManager {
  private static sessions = new Map<string, GameSession>();

  /**
   * Создаёт или обновляет игровую сессию
   */
  static createOrUpdateSession(user: UserPayload, socketId: string): GameSession {
    const session: GameSession = {
      id: user.userId,
      userId: user.userId,
      username: user.username,
      email: user.email,
      socketId,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(user.userId, session);
    return session;
  }

  /**
   * Получает сессию по userId
   */
  static getSession(userId: string): GameSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Получает сессию по socketId
   */
  static getSessionBySocketId(socketId: string): GameSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.socketId === socketId) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Удаляет сессию
   */
  static removeSession(userId: string): boolean {
    return this.sessions.delete(userId);
  }

  /**
   * Обновляет время последней активности
   */
  static updateActivity(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Получает все активные сессии
   */
  static getAllSessions(): GameSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Получает количество активных сессий
   */
  static getActiveSessionCount(): number {
    return this.sessions.size;
  }
}

export interface GameSession {
  id: string;
  userId: string;
  username: string;
  email: string;
  socketId: string;
  createdAt: Date;
  lastActivity: Date;
}

