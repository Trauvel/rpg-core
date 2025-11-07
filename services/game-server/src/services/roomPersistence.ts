import { GameRoom } from './roomManager';
import { GameState } from '@rpg-platform/shared';

/**
 * Структура сохранения комнаты
 */
export interface RoomSnapshot {
  id: string;
  roomCode: string;
  masterId: string;
  userId: string;  // Создатель сохранения
  players: string[];  // userId[]
  state: GameState;
  gameStarted: boolean;
  createdAt: Date;
}

/**
 * Сервис для сохранения и загрузки комнат
 * Взаимодействует с website-api через HTTP API
 */
export class RoomPersistenceService {
  private static websiteApiUrl: string;
  private static internalToken: string;

  /**
   * Инициализация сервиса
   */
  static initialize(websiteApiUrl: string, internalToken?: string) {
    this.websiteApiUrl = websiteApiUrl;
    this.internalToken = internalToken || process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
  }

  /**
   * Сохраняет слепок комнаты
   */
  static async saveRoomSnapshot(room: GameRoom, userId: string): Promise<string> {
    if (!this.websiteApiUrl) {
      throw new Error('RoomPersistenceService not initialized');
    }

    // Собираем данные для сохранения
    const players = Array.from(room.players.values()).map(p => p.userId);
    const state = room.stateManager.getState();

    const snapshot: Omit<RoomSnapshot, 'id' | 'createdAt'> = {
      roomCode: room.code,
      masterId: room.masterId,
      userId,
      players,
      state,
      gameStarted: room.gameStarted,
    };

    try {
      // Node.js 18+ имеет встроенный fetch
      // Отправляем запрос на website-api для сохранения
      // Используем внутренний токен для межсервисного взаимодействия
      const response = await fetch(`${this.websiteApiUrl}/api/rooms/saves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': this.internalToken,
        },
        body: JSON.stringify({
          roomCode: snapshot.roomCode,
          masterId: snapshot.masterId,
          userId: snapshot.userId,
          players: snapshot.players,
          state: JSON.stringify(snapshot.state),
          gameStarted: snapshot.gameStarted,
        }),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to save room snapshot');
      }

      const result: any = await response.json();
      console.log(`💾 Room snapshot saved: ${result.id} for room ${room.code}`);
      return result.id;
    } catch (error: any) {
      console.error('Error saving room snapshot:', error);
      throw error;
    }
  }

  /**
   * Загружает слепок комнаты
   */
  static async loadRoomSnapshot(saveId: string): Promise<RoomSnapshot | null> {
    if (!this.websiteApiUrl) {
      throw new Error('RoomPersistenceService not initialized');
    }

    try {
      // Node.js 18+ имеет встроенный fetch
      const response = await fetch(`${this.websiteApiUrl}/api/rooms/saves/${saveId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to load room snapshot');
      }

      const data: any = await response.json();
      
      // Парсим JSON состояние
      const state = JSON.parse(data.state);
      
      return {
        id: data.id,
        roomCode: data.roomCode,
        masterId: data.masterId,
        userId: data.userId,
        players: data.players || [],
        state,
        gameStarted: data.gameStarted,
        createdAt: new Date(data.createdAt),
      };
    } catch (error: any) {
      console.error('Error loading room snapshot:', error);
      throw error;
    }
  }

  /**
   * Получает историю комнат пользователя
   */
  static async getRoomHistory(userId: string): Promise<RoomSnapshot[]> {
    if (!this.websiteApiUrl) {
      throw new Error('RoomPersistenceService not initialized');
    }

    try {
      // Node.js 18+ имеет встроенный fetch
      const response = await fetch(`${this.websiteApiUrl}/api/rooms/history?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to get room history');
      }

      const data: any = await response.json();
      
      // Парсим JSON состояние для каждого сохранения
      return data.snapshots.map((snapshot: any) => ({
        id: snapshot.id,
        roomCode: snapshot.roomCode,
        masterId: snapshot.masterId,
        userId: snapshot.userId,
        players: snapshot.players || [],
        state: JSON.parse(snapshot.state),
        gameStarted: snapshot.gameStarted,
        createdAt: new Date(snapshot.createdAt),
      }));
    } catch (error: any) {
      console.error('Error getting room history:', error);
      throw error;
    }
  }

  /**
   * Удаляет сохранение
   */
  static async deleteRoomSnapshot(saveId: string): Promise<boolean> {
    if (!this.websiteApiUrl) {
      throw new Error('RoomPersistenceService not initialized');
    }

    try {
      // Node.js 18+ имеет встроенный fetch
      const response = await fetch(`${this.websiteApiUrl}/api/rooms/saves/${saveId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to delete room snapshot');
      }

      console.log(`🗑️  Room snapshot deleted: ${saveId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting room snapshot:', error);
      throw error;
    }
  }
}

