import { StateManager } from './stateManager';
import { GameState } from '@rpg-platform/shared';
import { Server } from 'socket.io';

/**
 * Менеджер состояний для комнат
 * Обертка над StateManager для работы с несколькими комнатами
 */
export class RoomStateManager {
  private static stateManagers = new Map<string, StateManager>(); // roomCode -> StateManager

  /**
   * Создаёт StateManager для комнаты
   */
  static createStateManager(roomCode: string, initialState: GameState, io: Server): StateManager {
    const stateManager = new StateManager(initialState, io);

    // Переопределяем отправку событий только в конкретную комнату
    stateManager.onPublicChange(() => {
      io.to(roomCode).emit('state:changed', stateManager.getState());
    });

    this.stateManagers.set(roomCode, stateManager);
    return stateManager;
  }

  /**
   * Получает StateManager для комнаты
   */
  static getStateManager(roomCode: string): StateManager | undefined {
    return this.stateManagers.get(roomCode);
  }

  /**
   * Удаляет StateManager для комнаты
   */
  static removeStateManager(roomCode: string): boolean {
    return this.stateManagers.delete(roomCode);
  }

  /**
   * Отправляет событие в конкретную комнату
   */
  static emitToRoom(roomCode: string, event: string, data: any, io: Server): void {
    io.to(roomCode).emit(event, data);
  }

  /**
   * Отправляет событие всем игрокам в комнате, кроме отправителя
   */
  static emitToRoomExcept(roomCode: string, socketId: string, event: string, data: any, io: Server): void {
    io.to(roomCode).except(socketId).emit(event, data);
  }

  /**
   * Отправляет событие только мастеру комнаты
   */
  static emitToMaster(roomCode: string, masterSocketId: string, event: string, data: any, io: Server): void {
    io.to(masterSocketId).emit(event, data);
  }
}

