import prisma from '../database/prisma';
import { CharacterData } from '@rpg-platform/shared';

export interface CreateSessionData {
  userId: string;
  characterName?: string;
}

export interface PlayerState {
  userId: string;
  name?: string;
  locationId?: string;
  inventory?: string[];
  hp?: number;
  maxHp?: number;
  level?: number;
  experience?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  class?: string;
  race?: string;
  armorClass?: number;
  initiative?: number;
  speed?: number;
  characterData?: CharacterData; // Дополнительные данные для D&D 5e SRD
}

export class GameSessionService {
  /**
   * Создаёт новую игровую сессию для пользователя
   */
  static async createSession(data: CreateSessionData) {
    // Проверяем, нет ли уже активной сессии
    const activeSession = await prisma.gameSession.findFirst({
      where: {
        userId: data.userId,
        isActive: true,
      },
    });

    if (activeSession) {
      // Если сессия существует, возвращаем её
      return activeSession;
    }

    // Создаём новую сессию
    const session = await prisma.gameSession.create({
      data: {
        userId: data.userId,
        characterName: data.characterName,
        isActive: true,
        level: 1,
        experience: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Получает активную сессию пользователя
   */
  static async getActiveSession(userId: string) {
    return await prisma.gameSession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Обновляет socketId для сессии
   */
  static async updateSocketId(sessionId: string, socketId: string) {
    return await prisma.gameSession.update({
      where: { id: sessionId },
      data: { socketId },
    });
  }

  /**
   * Деактивирует сессию
   */
  static async deactivateSession(sessionId: string) {
    return await prisma.gameSession.update({
      where: { id: sessionId },
      data: { isActive: false, socketId: null },
    });
  }

  /**
   * Получает сессию по socketId
   */
  static async getSessionBySocketId(socketId: string) {
    return await prisma.gameSession.findFirst({
      where: {
        socketId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Обновляет игровые данные сессии (все поля игрока)
   */
  static async updateGameData(
    sessionId: string, 
    data: {
      level?: number;
      experience?: number;
      hp?: number;
      maxHp?: number;
      locationId?: string;
      strength?: number;
      dexterity?: number;
      constitution?: number;
      intelligence?: number;
      wisdom?: number;
      charisma?: number;
      class?: string;
      race?: string;
      armorClass?: number;
      initiative?: number;
      speed?: number;
      inventory?: string[];
      characterName?: string;
      characterData?: CharacterData;
    }
  ) {
    // Преобразуем inventory массив в JSON строку
    const updateData: any = { ...data };
    if (data.inventory !== undefined) {
      updateData.inventory = JSON.stringify(data.inventory);
    }
    
    // Преобразуем characterData объект в JSON строку
    if (data.characterData !== undefined) {
      updateData.characterData = JSON.stringify(data.characterData);
    }

    return await prisma.gameSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  /**
   * Получает все сессии пользователя
   */
  static async getUserSessions(userId: string) {
    return await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Загружает состояние игрока из БД
   */
  static async loadPlayerState(userId: string): Promise<PlayerState | null> {
    const session = await this.getActiveSession(userId);
    if (!session) return null;

    return {
      userId: session.userId,
      name: session.characterName || undefined,
      locationId: session.locationId || undefined,
      inventory: session.inventory ? JSON.parse(session.inventory) : [],
      hp: session.hp,
      maxHp: session.maxHp,
      level: session.level,
      experience: session.experience,
      strength: session.strength,
      dexterity: session.dexterity,
      constitution: session.constitution,
      intelligence: session.intelligence,
      wisdom: session.wisdom,
      charisma: session.charisma,
      class: session.class || undefined,
      race: session.race || undefined,
      armorClass: session.armorClass,
      initiative: session.initiative,
      speed: session.speed,
      characterData: session.characterData ? JSON.parse(session.characterData) : undefined,
    };
  }

  /**
   * Сохраняет состояние игрока в БД
   */
  static async savePlayerState(userId: string, state: PlayerState): Promise<boolean> {
    const session = await this.getActiveSession(userId);
    if (!session) return false;

    try {
      await this.updateGameData(session.id, {
        ...state,
        characterName: state.name,
      });
      return true;
    } catch (error) {
      console.error('Error saving player state:', error);
      return false;
    }
  }
}

