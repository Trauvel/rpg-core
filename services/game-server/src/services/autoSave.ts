import { RoomManager } from './roomManager';
import { RoomPersistenceService } from './roomPersistence';
import { EventBus } from '../core/eventBus';
import { GameEvent } from '@rpg-platform/shared';

/**
 * Сервис автосохранения комнат
 */
export class AutoSaveService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static eventBus: EventBus | null = null;
  private static isInitialized = false;

  /**
   * Инициализация сервиса автосохранения
   */
  static initialize(eventBus: EventBus) {
    if (this.isInitialized) {
      return;
    }

    this.eventBus = eventBus;
    this.isInitialized = true;

    // Запускаем таймер автосохранения (каждые 5 минут)
    this.intervalId = setInterval(() => {
      this.autoSave();
    }, 5 * 60 * 1000); // 5 минут

    console.log('💾 AutoSave service initialized');
  }

  /**
   * Автосохранение всех активных комнат
   */
  private static async autoSave() {
    const rooms = RoomManager.getAllRooms();
    const roomsToSave = rooms.filter(room => room.gameStarted && room.isActive);

    if (roomsToSave.length === 0) {
      return;
    }

    console.log(`💾 Auto-saving ${roomsToSave.length} room(s)...`);

    for (const room of roomsToSave) {
      try {
        // Сохраняем от имени мастера
        await RoomPersistenceService.saveRoomSnapshot(room, room.masterId);
      } catch (error: any) {
        console.error(`Error auto-saving room ${room.code}:`, error.message);
      }
    }
  }

  /**
   * Сохранить комнату при паузе
   */
  static async saveOnPause(roomCode: string) {
    const room = RoomManager.getRoomByCode(roomCode);
    if (!room || !room.gameStarted) {
      return;
    }

    try {
      await RoomPersistenceService.saveRoomSnapshot(room, room.masterId);
      console.log(`💾 Room ${roomCode} saved on pause`);
    } catch (error: any) {
      console.error(`Error saving room ${roomCode} on pause:`, error.message);
    }
  }

  /**
   * Сохранить комнату при закрытии (таймаут мастера)
   */
  static async saveOnClose(roomCode: string) {
    const room = RoomManager.getRoomByCode(roomCode);
    if (!room || !room.gameStarted) {
      return;
    }

    try {
      await RoomPersistenceService.saveRoomSnapshot(room, room.masterId);
      console.log(`💾 Room ${roomCode} saved on close`);
    } catch (error: any) {
      console.error(`Error saving room ${roomCode} on close:`, error.message);
    }
  }

  /**
   * Остановка сервиса
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isInitialized = false;
    console.log('💾 AutoSave service stopped');
  }
}

