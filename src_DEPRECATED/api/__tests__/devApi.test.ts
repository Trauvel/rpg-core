import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { registerDevApi } from '../devApi';
import { StateManager } from '../../core/stateManager';
import { GameState } from '../../contracts/state';

// Мокаем fs
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('DevApi', () => {
  let app: express.Express;
  let stateManager: StateManager;
  let initialState: GameState;

  beforeEach(() => {
    app = express();
    
    // Создаем мок StateManager
    stateManager = {
      getState: jest.fn(),
      getPublicState: jest.fn(),
      getMasterState: jest.fn(),
      updateState: jest.fn(),
    } as any;

    initialState = {
      public: {
        players: [],
        locations: [
          { id: 'forest', name: 'Лес' },
          { id: 'castle', name: 'Замок' }
        ]
      },
      master: {}
    };

    registerDevApi(app, stateManager, initialState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dev', () => {
    it('должен отправить HTML файл', async () => {
      const mockFilePath = '/mock/path/to/dev.html';
      mockPath.join.mockReturnValue(mockFilePath);

      // Мокаем sendFile
      const mockSendFile = jest.fn();
      app.get = jest.fn().mockImplementation((path, handler) => {
        if (path === '/dev') {
          const mockReq = {} as any;
          const mockRes = {
            sendFile: mockSendFile
          } as any;
          handler(mockReq, mockRes);
        }
      });

      registerDevApi(app, stateManager, initialState);

      expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), '..', 'views/dev.html');
      expect(mockSendFile).toHaveBeenCalledWith(mockFilePath);
    });
  });

  describe('GET /dev/state', () => {
    it('должен вернуть текущее состояние', async () => {
      const mockState = {
        public: { players: [], locations: [] },
        master: { someData: 'test' }
      };
      (stateManager.getState as jest.Mock).mockReturnValue(mockState);

      const response = await request(app)
        .get('/dev/state')
        .expect(200);

      expect(stateManager.getState).toHaveBeenCalled();
      expect(response.body).toEqual(mockState);
    });
  });

  describe('GET /dev/publicState', () => {
    it('должен вернуть публичное состояние', async () => {
      const mockPublicState = {
        players: [],
        locations: [
          { id: 'forest', name: 'Лес' }
        ]
      };
      (stateManager.getPublicState as jest.Mock).mockReturnValue(mockPublicState);

      const response = await request(app)
        .get('/dev/publicState')
        .expect(200);

      expect(stateManager.getPublicState).toHaveBeenCalled();
      expect(response.body).toEqual(mockPublicState);
    });
  });

  describe('GET /dev/masterState', () => {
    it('должен вернуть мастерское состояние', async () => {
          const mockMasterState = {
      logs: ['admin log'],
      npcPlans: { 'npc-1': { plan: 'attack' } }
    };
      (stateManager.getMasterState as jest.Mock).mockReturnValue(mockMasterState);

      const response = await request(app)
        .get('/dev/masterState')
        .expect(200);

      expect(stateManager.getMasterState).toHaveBeenCalled();
      expect(response.body).toEqual(mockMasterState);
    });
  });

  describe('POST /dev/reset', () => {
    it('должен сбросить состояние в начальное', async () => {
      const response = await request(app)
        .post('/dev/reset')
        .expect(200);

      expect(stateManager.updateState).toHaveBeenCalledWith({ ...initialState });
      expect(response.body).toEqual({ ok: true });
    });

    it('должен создать новый объект состояния при сбросе', async () => {
      await request(app)
        .post('/dev/reset')
        .expect(200);

      expect(stateManager.updateState).toHaveBeenCalledWith(
        expect.objectContaining({
          public: expect.objectContaining({
            players: [],
            locations: expect.arrayContaining([
              expect.objectContaining({ id: 'forest', name: 'Лес' }),
              expect.objectContaining({ id: 'castle', name: 'Замок' })
            ])
          }),
          master: {}
        })
      );
    });
  });

  describe('POST /dev/save', () => {
    it('должен сохранить снапшот в файл', async () => {
      const mockState = {
        public: { players: [], locations: [] },
        master: { test: 'data' }
      };
      (stateManager.getState as jest.Mock).mockReturnValue(mockState);
      mockFs.writeFileSync.mockImplementation(() => {});

      const response = await request(app)
        .post('/dev/save')
        .expect(200);

      expect(stateManager.getState).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'snapshot.json',
        JSON.stringify(mockState, null, 2)
      );
      expect(response.body).toEqual({ ok: true });
    });

    it('должен обработать ошибку записи файла', async () => {
      const mockState = { public: {}, master: {} };
      (stateManager.getState as jest.Mock).mockReturnValue(mockState);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const response = await request(app)
        .post('/dev/save')
        .expect(500);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Интеграционные тесты', () => {
    it('должен корректно работать с реальным StateManager', async () => {
      // Создаем реальный StateManager для интеграционного теста
      const realStateManager = new StateManager(initialState, {} as any);
      
      const integrationApp = express();
      registerDevApi(integrationApp, realStateManager, initialState);

      // Тестируем получение состояния
      const stateResponse = await request(integrationApp)
        .get('/dev/state')
        .expect(200);

      expect(stateResponse.body).toHaveProperty('public');
      expect(stateResponse.body).toHaveProperty('master');
      expect(stateResponse.body.public).toHaveProperty('players');
      expect(stateResponse.body.public).toHaveProperty('locations');
    });

    it('должен корректно сбрасывать состояние', async () => {
      const realStateManager = new StateManager(initialState, {} as any);
      
      const integrationApp = express();
      registerDevApi(integrationApp, realStateManager, initialState);

      // Изменяем состояние
      realStateManager.updateState({
        public: { players: [{ id: 'test', name: 'TestPlayer' }], locations: [] },
        master: { logs: ['modified'] }
      });

      // Сбрасываем состояние
      await request(integrationApp)
        .post('/dev/reset')
        .expect(200);

      // Проверяем, что состояние сброшено
      const stateResponse = await request(integrationApp)
        .get('/dev/state')
        .expect(200);

      expect(stateResponse.body.public.players).toEqual([]);
      expect(stateResponse.body.master).toEqual({});
    });
  });
});
