import { GameState, PublicState, MasterState } from '@rpg-platform/shared';
import { Server } from 'socket.io';

/**
 * Типы логов
 */
export type LogType = 'public' | 'master';

/**
 * Интерфейс лога
 */
export interface GameLog {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
  data?: any;
}

/**
 * Менеджер логов для игры
 * Разделяет логи на публичные (для всех игроков) и мастерские (только для мастера)
 */
export class LogManager {
  private publicLogs: GameLog[] = [];
  private masterLogs: GameLog[] = [];
  private maxLogs = 100; // Максимальное количество логов каждого типа

  /**
   * Добавить публичный лог (виден всем игрокам)
   */
  addPublicLog(message: string, data?: any): void {
    const log: GameLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      type: 'public',
      message,
      timestamp: new Date(),
      data,
    };

    this.publicLogs.push(log);

    // Ограничиваем количество логов
    if (this.publicLogs.length > this.maxLogs) {
      this.publicLogs = this.publicLogs.slice(-this.maxLogs);
    }
  }

  /**
   * Добавить мастерский лог (виден только мастеру)
   */
  addMasterLog(message: string, data?: any): void {
    const log: GameLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      type: 'master',
      message,
      timestamp: new Date(),
      data,
    };

    this.masterLogs.push(log);

    // Ограничиваем количество логов
    if (this.masterLogs.length > this.maxLogs) {
      this.masterLogs = this.masterLogs.slice(-this.maxLogs);
    }
  }

  /**
   * Получить публичные логи
   */
  getPublicLogs(): GameLog[] {
    return [...this.publicLogs];
  }

  /**
   * Получить мастерские логи
   */
  getMasterLogs(): GameLog[] {
    return [...this.masterLogs];
  }

  /**
   * Получить все логи (для мастера)
   */
  getAllLogs(): { public: GameLog[]; master: GameLog[] } {
    return {
      public: this.getPublicLogs(),
      master: this.getMasterLogs(),
    };
  }

  /**
   * Очистить логи
   */
  clearLogs(): void {
    this.publicLogs = [];
    this.masterLogs = [];
  }

  /**
   * Отправить публичные логи в комнату
   */
  emitPublicLogs(roomCode: string, io: Server): void {
    const logs = this.getPublicLogs();
    io.to(roomCode).emit('room:logs', {
      type: 'public',
      logs,
    });
  }

  /**
   * Отправить мастерские логи мастеру
   */
  emitMasterLogs(roomCode: string, masterSocketId: string, io: Server): void {
    const logs = this.getMasterLogs();
    io.to(masterSocketId).emit('room:logs', {
      type: 'master',
      logs,
    });
  }

  /**
   * Отправить все логи мастеру
   */
  emitAllLogs(roomCode: string, masterSocketId: string, io: Server): void {
    const allLogs = this.getAllLogs();
    io.to(masterSocketId).emit('room:logs', {
      type: 'all',
      logs: allLogs,
    });
  }
}

