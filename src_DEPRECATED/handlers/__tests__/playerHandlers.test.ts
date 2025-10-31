import { registerPlayerHandlers } from '../playerHandlers';
import { GameEvent } from '../../contracts/events';
import { EventBus } from '../../core/eventBus';
import { StateManager } from '../../core/stateManager';
import { Server } from 'socket.io';
import { PlayerMock } from '../../api/data/mock/player';

// Мокаем зависимости
jest.mock('../../core/eventBus');
jest.mock('../../core/stateManager');
jest.mock('socket.io');

describe('PlayerHandlers', () => {
  let eventBus: EventBus;
  let stateManager: StateManager;
  let io: Server;
  let mockPublicState: any;

  beforeEach(() => {
    // Создаем моки
    eventBus = {
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
    } as any;

    mockPublicState = {
      players: [],
      logs: [],
    };

    stateManager = {
      getPublicState: jest.fn().mockReturnValue(mockPublicState),
      getState: jest.fn(),
      getMasterState: jest.fn(),
      updateState: jest.fn(),
    } as any;

    io = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as any;

    // Очищаем состояние перед каждым тестом
    mockPublicState.players = [];
    mockPublicState.logs = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPlayerHandlers', () => {
    it('должен зарегистрировать все обработчики событий', () => {
      registerPlayerHandlers(eventBus, stateManager, io);

      expect(eventBus.on).toHaveBeenCalledWith(GameEvent.PLAYER_CONNECT, expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith(GameEvent.PLAYER_JOIN, expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith(GameEvent.PLAYER_UPDATE, expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith(GameEvent.PLAYER_LEAVE, expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith(GameEvent.PLAYER_MOVE, expect.any(Function));
    });
  });

  describe('PLAYER_CONNECT обработчик', () => {
    it('должен добавить нового игрока при подключении', () => {
      registerPlayerHandlers(eventBus, stateManager, io);

      const connectHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_CONNECT
      )[1];

      const connectData = { socket_id: 'player-123' };
      connectHandler(connectData);

      expect(stateManager.getPublicState).toHaveBeenCalled();
      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0]).toEqual({ id: 'player-123' });
    });

    it('не должен добавлять игрока, если он уже существует', () => {
      mockPublicState.players = [{ id: 'player-123' }];

      registerPlayerHandlers(eventBus, stateManager, io);

      const connectHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_CONNECT
      )[1];

      const connectData = { socket_id: 'player-123' };
      connectHandler(connectData);

      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0]).toEqual({ id: 'player-123' });
    });
  });

  describe('PLAYER_JOIN обработчик', () => {
    it('должен обновить игрока с именем и данными при присоединении', () => {
      mockPublicState.players = [{ id: 'player-123' }];

      registerPlayerHandlers(eventBus, stateManager, io);

      const joinHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_JOIN
      )[1];

      const joinData = { socket_id: 'player-123', name: 'TestPlayer' };
      joinHandler(joinData);

      expect(stateManager.getPublicState).toHaveBeenCalled();
      expect(mockPublicState.players[0]).toEqual({
        id: 'player-123',
        name: 'TestPlayer',
        ...PlayerMock
      });
    });

    it('не должен обновлять игрока, если он не найден', () => {
      mockPublicState.players = [{ id: 'other-player' }];

      registerPlayerHandlers(eventBus, stateManager, io);

      const joinHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_JOIN
      )[1];

      const joinData = { socket_id: 'player-123', name: 'TestPlayer' };
      joinHandler(joinData);

      expect(mockPublicState.players[0]).toEqual({ id: 'other-player' });
    });
  });

  describe('PLAYER_UPDATE обработчик', () => {
    it('должен обновить данные игрока', () => {
      mockPublicState.players = [
        { id: 'player-123', name: 'TestPlayer', hp: 10, level: 1 }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];

      const updateData = {
        playerId: 'player-123',
        playerData: { hp: 15, level: 2 }
      };
      updateHandler(updateData);

      expect(mockPublicState.players[0]).toEqual({
        id: 'player-123',
        name: 'TestPlayer',
        hp: 15,
        level: 2
      });
    });

    it('должен добавить лог об обновлении игрока', () => {
      mockPublicState.players = [
        { id: 'player-123', name: 'TestPlayer' }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];

      const updateData = {
        playerId: 'player-123',
        playerData: { hp: 15 }
      };
      updateHandler(updateData);

      expect(mockPublicState.logs).toHaveLength(1);
      expect(mockPublicState.logs[0]).toBe('Персонаж TestPlayer обновлен');
    });

    it('должен ограничивать количество логов до 50', () => {
      mockPublicState.players = [
        { id: 'player-123', name: 'TestPlayer' }
      ];
      mockPublicState.logs = Array.from({ length: 55 }, (_, i) => `Log ${i}`);

      registerPlayerHandlers(eventBus, stateManager, io);

      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];

      const updateData = {
        playerId: 'player-123',
        playerData: { hp: 15 }
      };
      updateHandler(updateData);

      expect(mockPublicState.logs).toHaveLength(50);
      expect(mockPublicState.logs[mockPublicState.logs.length - 1]).toBe('Персонаж TestPlayer обновлен');
    });

    it('не должен обновлять игрока, если он не найден', () => {
      mockPublicState.players = [{ id: 'other-player', name: 'Other' }];

      registerPlayerHandlers(eventBus, stateManager, io);

      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];

      const updateData = {
        playerId: 'player-123',
        playerData: { hp: 15 }
      };
      updateHandler(updateData);

      expect(mockPublicState.players[0]).toEqual({ id: 'other-player', name: 'Other' });
      expect(mockPublicState.logs).toHaveLength(0);
    });
  });

  describe('PLAYER_LEAVE обработчик', () => {
    it('должен удалить игрока при выходе', () => {
      mockPublicState.players = [
        { id: 'player-123', name: 'TestPlayer' },
        { id: 'player-456', name: 'OtherPlayer' }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const leaveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_LEAVE
      )[1];

      const leaveData = { id: 'player-123' };
      leaveHandler(leaveData);

      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0]).toEqual({ id: 'player-456', name: 'OtherPlayer' });
    });

    it('не должен изменять список игроков, если игрок не найден', () => {
      mockPublicState.players = [
        { id: 'player-456', name: 'OtherPlayer' }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const leaveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_LEAVE
      )[1];

      const leaveData = { id: 'player-123' };
      leaveHandler(leaveData);

      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0]).toEqual({ id: 'player-456', name: 'OtherPlayer' });
    });
  });

  describe('PLAYER_MOVE обработчик', () => {
    it('должен обновить локацию игрока при перемещении', () => {
      mockPublicState.players = [
        { id: 'player-123', name: 'TestPlayer', locationId: 'forest' }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const moveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_MOVE
      )[1];

      const moveData = {
        playerId: 'player-123',
        to: 'castle'
      };
      moveHandler(moveData);

      expect(mockPublicState.players[0].locationId).toBe('castle');
    });

    it('не должен изменять локацию, если игрок не найден', () => {
      mockPublicState.players = [
        { id: 'other-player', name: 'OtherPlayer', locationId: 'forest' }
      ];

      registerPlayerHandlers(eventBus, stateManager, io);

      const moveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_MOVE
      )[1];

      const moveData = {
        playerId: 'player-123',
        to: 'castle'
      };
      moveHandler(moveData);

      expect(mockPublicState.players[0].locationId).toBe('forest');
    });
  });

  describe('Интеграционные тесты', () => {
    it('должен корректно обрабатывать полный цикл жизни игрока', () => {
      registerPlayerHandlers(eventBus, stateManager, io);

      const connectHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_CONNECT
      )[1];
      const joinHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_JOIN
      )[1];
      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];
      const moveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_MOVE
      )[1];
      const leaveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_LEAVE
      )[1];

      // 1. Игрок подключается
      connectHandler({ socket_id: 'player-123' });
      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0].id).toBe('player-123');

      // 2. Игрок присоединяется
      joinHandler({ socket_id: 'player-123', name: 'TestPlayer' });
      expect(mockPublicState.players[0].name).toBe('TestPlayer');
      expect(mockPublicState.players[0].locationId).toBe('forest');

      // 3. Игрок обновляется
      updateHandler({ playerId: 'player-123', playerData: { hp: 15, level: 2 } });
      expect(mockPublicState.players[0].hp).toBe(15);
      expect(mockPublicState.players[0].level).toBe(2);
      expect(mockPublicState.logs).toHaveLength(1);

      // 4. Игрок перемещается
      moveHandler({ playerId: 'player-123', to: 'castle' });
      expect(mockPublicState.players[0].locationId).toBe('castle');

      // 5. Игрок выходит
      leaveHandler({ id: 'player-123' });
      expect(mockPublicState.players).toHaveLength(0);
    });

    it('должен корректно работать с несколькими игроками', () => {
      registerPlayerHandlers(eventBus, stateManager, io);

      const connectHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_CONNECT
      )[1];
      const joinHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_JOIN
      )[1];
      const leaveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_LEAVE
      )[1];

      // Подключаются два игрока
      connectHandler({ socket_id: 'player-1' });
      connectHandler({ socket_id: 'player-2' });
      expect(mockPublicState.players).toHaveLength(2);

      // Оба присоединяются
      joinHandler({ socket_id: 'player-1', name: 'Player1' });
      joinHandler({ socket_id: 'player-2', name: 'Player2' });
      expect(mockPublicState.players[0].name).toBe('Player1');
      expect(mockPublicState.players[1].name).toBe('Player2');

      // Первый игрок выходит
      leaveHandler({ id: 'player-1' });
      expect(mockPublicState.players).toHaveLength(1);
      expect(mockPublicState.players[0].name).toBe('Player2');
    });
  });

  describe('Обработка ошибок', () => {
    it('должен корректно обрабатывать отсутствующие поля', () => {
      registerPlayerHandlers(eventBus, stateManager, io);

      const updateHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_UPDATE
      )[1];

      // Тестируем с неполными данными
      const updateData = {
        playerId: 'player-123',
        playerData: {}
      };

      expect(() => {
        updateHandler(updateData);
      }).not.toThrow();
    });

    it('должен корректно обрабатывать пустые массивы', () => {
      mockPublicState.players = [];

      registerPlayerHandlers(eventBus, stateManager, io);

      const leaveHandler = (eventBus.on as jest.Mock).mock.calls.find(
        call => call[0] === GameEvent.PLAYER_LEAVE
      )[1];

      const leaveData = { id: 'player-123' };
      expect(() => {
        leaveHandler(leaveData);
      }).not.toThrow();

      expect(mockPublicState.players).toHaveLength(0);
    });
  });
});
