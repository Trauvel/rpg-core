import { RoomManager } from './roomManager';
import { AutoSaveService } from './autoSave';
import { Server } from 'socket.io';

/**
 * Сервис для управления жизненным циклом комнат
 * Обрабатывает таймеры очистки и уведомления
 */
export class RoomCleanupService {
  private static cleanupIntervalId: NodeJS.Timeout | null = null;
  private static masterTimeoutIntervalId: NodeJS.Timeout | null = null;
  private static io: Server | null = null;
  private static isInitialized = false;

  /**
   * Инициализация сервиса очистки
   */
  static initialize(io: Server) {
    if (this.isInitialized) {
      return;
    }

    this.io = io;
    this.isInitialized = true;

    // Таймер очистки пустых комнат (каждые 5 минут)
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupEmptyRooms();
    }, 5 * 60 * 1000); // 5 минут

    // Таймер проверки таймаута мастера (каждую минуту)
    this.masterTimeoutIntervalId = setInterval(() => {
      this.checkMasterTimeout();
    }, 60 * 1000); // 1 минута

    console.log('🧹 RoomCleanup service initialized');
  }

  /**
   * Очистка пустых комнат (старше 30 минут)
   */
  private static cleanupEmptyRooms() {
    const removedCount = RoomManager.cleanupEmptyRooms();
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} empty room(s)`);
    }
  }

  /**
   * Проверка таймаута мастера (5 минут)
   */
  private static checkMasterTimeout() {
    if (!this.io) {
      return;
    }

    const now = new Date();
    const MASTER_TIMEOUT = 5 * 60 * 1000; // 5 минут
    const rooms = RoomManager.getAllRooms();

    for (const room of rooms) {
      // Проверяем только комнаты на паузе
      if (room.isPaused && room.masterLastSeen) {
        const timeSinceLastSeen = now.getTime() - room.masterLastSeen.getTime();
        
        // Если до таймаута осталось меньше минуты, сохраняем комнату
        if (timeSinceLastSeen > MASTER_TIMEOUT - 60 * 1000 && room.gameStarted) {
          AutoSaveService.saveOnClose(room.code).catch(err => {
            console.error(`Error saving room ${room.code} before timeout:`, err);
          });
        }

        // Если таймаут истёк, закрываем комнату
        if (timeSinceLastSeen > MASTER_TIMEOUT) {
          // Сохраняем комнату перед закрытием
          if (room.gameStarted) {
            AutoSaveService.saveOnClose(room.code).catch(err => {
              console.error(`Error saving room ${room.code} on timeout:`, err);
            });
          }

          // Закрываем комнату
          room.isActive = false;
          
          // Добавляем лог о закрытии комнаты
          room.logManager.addPublicLog('Комната закрыта из-за отсутствия мастера');
          room.logManager.addMasterLog('Комната автоматически закрыта из-за таймаута мастера (5 минут)');
          
          // Уведомляем игроков о закрытии комнаты
          this.io.to(room.code).emit('room:closed', {
            reason: 'master-timeout',
            message: 'Комната закрыта из-за отсутствия мастера',
          });

          console.log(`⏰ Room ${room.code} closed due to master timeout`);
        }
      }
    }
  }

  /**
   * Остановка сервиса
   */
  static stop() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    if (this.masterTimeoutIntervalId) {
      clearInterval(this.masterTimeoutIntervalId);
      this.masterTimeoutIntervalId = null;
    }

    this.isInitialized = false;
    console.log('🧹 RoomCleanup service stopped');
  }
}

