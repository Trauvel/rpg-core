import { GameState, PublicState, MasterState } from '@rpg-platform/shared';
import { RoomStateManager } from '../core/roomStateManager';
import { StateManager } from '../core/stateManager';
import { LogManager } from '../core/logManager';
import { Server } from 'socket.io';

/**
 * Настройки комнаты при создании
 */
export interface RoomSettings {
  maxPlayers?: number;
  characterSelection: 'predefined' | 'in-room';
}

/**
 * Игрок в комнате
 */
export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
  role: 'master' | 'player';
  characterId?: string;
  isConnected: boolean;
  joinedAt: Date;
}

/**
 * Игровая комната
 */
export interface GameRoom {
  id: string;                    // UUID
  code: string;                  // Публичный код (6 символов: ARE32Q)
  masterId: string;              // ID мастера
  masterSocketId?: string;       // Socket ID мастера (для переподключения)
  
  // Настройки
  maxPlayers?: number;           // Опциональный лимит
  characterSelection: 'predefined' | 'in-room';
  isPaused: boolean;
  isActive: boolean;
  
  // Игроки
  players: Map<string, RoomPlayer>; // userId -> RoomPlayer
  
  // Состояние
  stateManager: StateManager;
  logManager: LogManager;
  
  // Метаданные
  createdAt: Date;
  lastActivity: Date;
  gameStarted: boolean;          // Началась ли игра
  masterLastSeen?: Date;         // Последнее подключение мастера
}

/**
 * Менеджер игровых комнат
 */
export class RoomManager {
  private static rooms = new Map<string, GameRoom>(); // code -> GameRoom
  private static roomsById = new Map<string, string>(); // id -> code
  
  // Алфавит для генерации кода (без O, I, 0, 1)
  private static readonly CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  private static readonly CODE_LENGTH = 6;
  private static readonly MAX_GENERATION_ATTEMPTS = 100;

  /**
   * Генерирует уникальный код комнаты
   */
  private static generateRoomCode(): string {
    let attempts = 0;
    let code: string;

    do {
      code = '';
      for (let i = 0; i < this.CODE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * this.CODE_CHARS.length);
        code += this.CODE_CHARS[randomIndex];
      }
      attempts++;

      if (attempts > this.MAX_GENERATION_ATTEMPTS) {
        throw new Error('Не удалось сгенерировать уникальный код комнаты');
      }
    } while (this.roomExists(code));

    return code;
  }

  /**
   * Создаёт новую игровую комнату
   */
  static createRoom(
    masterId: string,
    masterUsername: string,
    masterSocketId: string | undefined,
    settings: RoomSettings,
    io: Server
  ): GameRoom {
    const code = this.generateRoomCode();
    const id = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Начальное состояние игры
    const initialState: GameState = {
      public: {
        players: [],
        locations: [
          {
            id: "forest",
            name: "Лес",
            locations: [
              {
                id: "village",
                name: "Деревня",
              }
            ]
          },
          { id: "castle", name: "Замок" }
        ],
        logs: []
      },
      master: {
        logs: []
      }
    };

    // Создаём StateManager для комнаты через RoomStateManager
    const stateManager = RoomStateManager.createStateManager(code, initialState, io);
    const logManager = new LogManager();

    // Создаём мастера как первого игрока
    const masterPlayer: RoomPlayer = {
      userId: masterId,
      username: masterUsername,
      socketId: masterSocketId || '', // Будет обновлён при WebSocket подключении
      role: 'master',
      isConnected: !!masterSocketId, // Подключён только если есть socketId
      joinedAt: new Date(),
    };

    const room: GameRoom = {
      id,
      code,
      masterId,
      masterSocketId,
      maxPlayers: settings.maxPlayers,
      characterSelection: settings.characterSelection,
      isPaused: false,
      isActive: true,
      players: new Map([[masterId, masterPlayer]]),
      stateManager,
      logManager,
      createdAt: new Date(),
      lastActivity: new Date(),
      gameStarted: false,
      masterLastSeen: new Date(),
    };

    // Добавляем лог о создании комнаты
    logManager.addPublicLog(`Комната ${code} создана мастером ${masterUsername}`);
    logManager.addMasterLog(`Комната ${code} создана. Настройки: maxPlayers=${settings.maxPlayers || 'не ограничено'}, characterSelection=${settings.characterSelection}`);

    this.rooms.set(code, room);
    this.roomsById.set(id, code);

    console.log(`✅ Room created: ${code} by ${masterUsername} (${masterId})`);
    return room;
  }

  /**
   * Получает комнату по коду
   */
  static getRoomByCode(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  /**
   * Получает комнату по ID
   */
  static getRoomById(id: string): GameRoom | undefined {
    const code = this.roomsById.get(id);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  /**
   * Проверяет существование комнаты
   */
  static roomExists(code: string): boolean {
    return this.rooms.has(code.toUpperCase());
  }

  /**
   * Присоединяет игрока к комнате
   */
  static joinRoom(
    code: string,
    userId: string,
    username: string,
    socketId: string,
    characterId?: string
  ): { room: GameRoom; player: RoomPlayer } | null {
    const room = this.getRoomByCode(code);
    if (!room) {
      return null;
    }

    // Проверяем, не присоединён ли уже игрок
    if (room.players.has(userId)) {
      const existingPlayer = room.players.get(userId)!;
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      if (characterId) {
        existingPlayer.characterId = characterId;
      }
      room.lastActivity = new Date();
      console.log(`✅ Player reconnected to room ${code}: ${username} (${userId})`);
      return { room, player: existingPlayer };
    }

    // Проверяем, не заполнена ли комната (только для новых игроков)
    if (room.maxPlayers && room.players.size >= room.maxPlayers) {
      throw new Error('Комната заполнена');
    }

    // Создаём нового игрока
    const player: RoomPlayer = {
      userId,
      username,
      socketId,
      role: 'player',
      characterId,
      isConnected: true,
      joinedAt: new Date(),
    };

    room.players.set(userId, player);
    room.lastActivity = new Date();

    console.log(`✅ Player joined room ${code}: ${username} (${userId})`);
    return { room, player };
  }

  /**
   * Удаляет игрока из комнаты
   */
  static leaveRoom(userId: string): { room: GameRoom; wasMaster: boolean } | null {
    // Находим комнату, в которой находится игрок
    for (const room of this.rooms.values()) {
      if (room.players.has(userId)) {
        const player = room.players.get(userId)!;
        const wasMaster = player.role === 'master';

        // Если это мастер, ставим комнату на паузу
        if (wasMaster) {
          room.isPaused = true;
          room.masterLastSeen = new Date();
          room.masterSocketId = undefined;
        }

        // Удаляем игрока
        room.players.delete(userId);
        room.lastActivity = new Date();

        console.log(`👋 Player left room ${room.code}: ${player.username} (${userId})`);

        // Если комната пустая, удаляем её
        if (room.players.size === 0) {
          this.removeRoom(room.code);
        }

        return { room, wasMaster };
      }
    }

    return null;
  }

  /**
   * Обновляет статус подключения игрока
   */
  static updatePlayerConnection(userId: string, socketId: string, isConnected: boolean): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.players.has(userId)) {
        const player = room.players.get(userId)!;
        player.socketId = socketId;
        player.isConnected = isConnected;
        room.lastActivity = new Date();

        // Если это мастер, обновляем masterSocketId и masterLastSeen
        if (player.role === 'master') {
          room.masterSocketId = isConnected ? socketId : undefined;
          room.masterLastSeen = isConnected ? new Date() : room.masterLastSeen;
          
          // Если мастер переподключился, снимаем паузу
          if (isConnected && room.isPaused) {
            room.isPaused = false;
          }
        }

        return room;
      }
    }

    return null;
  }

  /**
   * Удаляет комнату
   */
  static removeRoom(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;

    // Удаляем StateManager комнаты
    RoomStateManager.removeStateManager(code);

    this.rooms.delete(code);
    this.roomsById.delete(room.id);
    console.log(`🗑️  Room removed: ${code}`);
    return true;
  }

  /**
   * Получает все комнаты
   */
  static getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Очищает пустые комнаты (старше 30 минут)
   */
  static cleanupEmptyRooms(): number {
    const now = new Date();
    const EMPTY_ROOM_TIMEOUT = 30 * 60 * 1000; // 30 минут
    let removedCount = 0;

    for (const [code, room] of this.rooms.entries()) {
      // Проверяем, пустая ли комната и прошло ли 30 минут
      if (room.players.size === 0) {
        const timeSinceCreation = now.getTime() - room.createdAt.getTime();
        if (timeSinceCreation > EMPTY_ROOM_TIMEOUT) {
          this.removeRoom(code);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} empty rooms`);
    }

    return removedCount;
  }

  /**
   * Проверяет таймаут мастера (5 минут)
   */
  static checkMasterTimeout(): number {
    const now = new Date();
    const MASTER_TIMEOUT = 5 * 60 * 1000; // 5 минут
    let closedCount = 0;

    for (const [code, room] of this.rooms.entries()) {
      // Проверяем только комнаты на паузе
      if (room.isPaused && room.masterLastSeen) {
        const timeSinceLastSeen = now.getTime() - room.masterLastSeen.getTime();
        if (timeSinceLastSeen > MASTER_TIMEOUT) {
          // Закрываем комнату
          room.isActive = false;
          closedCount++;
          console.log(`⏰ Room ${code} closed due to master timeout`);
        }
      }
    }

    if (closedCount > 0) {
      console.log(`⏰ Closed ${closedCount} rooms due to master timeout`);
    }

    return closedCount;
  }

  /**
   * Устанавливает паузу для комнаты
   */
  static setPause(code: string, paused: boolean, userId: string): boolean {
    const room = this.getRoomByCode(code);
    if (!room) return false;

    // Проверяем, что это мастер
    const player = room.players.get(userId);
    if (!player || player.role !== 'master') {
      return false;
    }

    room.isPaused = paused;
    room.lastActivity = new Date();
    return true;
  }

  /**
   * Получает комнату для сохранения (для автосохранения)
   */
  static getRoomForSave(code: string): GameRoom | undefined {
    return this.getRoomByCode(code);
  }

  /**
   * Начинает игру в комнате
   */
  static startGame(code: string, userId: string): boolean {
    const room = this.getRoomByCode(code);
    if (!room) return false;

    // Проверяем, что это мастер
    const player = room.players.get(userId);
    if (!player || player.role !== 'master') {
      return false;
    }

    room.gameStarted = true;
    room.isPaused = false;
    room.lastActivity = new Date();
    return true;
  }
}

