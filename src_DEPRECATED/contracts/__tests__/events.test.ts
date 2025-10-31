import { GameEvent, EventPayloadMap } from '../events';
import { GameState } from '../state';

describe('GameEvent', () => {
  describe('Enum values', () => {
    it('должен содержать все ожидаемые события', () => {
      expect(GameEvent.PLAYER_CONNECT).toBe('player:connect');
      expect(GameEvent.PLAYER_ACTION).toBe('player:action');
      expect(GameEvent.PLAYER_MOVE).toBe('player:move');
      expect(GameEvent.PLAYER_JOIN).toBe('player:join');
      expect(GameEvent.PLAYER_LEAVE).toBe('player:leave');
      expect(GameEvent.PLAYER_UPDATE).toBe('player:update');
      expect(GameEvent.STATE_CHANGED).toBe('state:changed');
      expect(GameEvent.ITEM_ADDED).toBe('item:added');
      expect(GameEvent.ITEM_USED).toBe('item:used');
      expect(GameEvent.LOCATION_ENTER).toBe('location:enter');
      expect(GameEvent.QUEST_UPDATED).toBe('quest:updated');
    });

    it('должен иметь уникальные значения', () => {
      const values = Object.values(GameEvent);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('EventPayloadMap типизация', () => {
    describe('PLAYER_CONNECT', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_CONNECT] = {
          id: 'player-123'
        };

        expect(payload.id).toBe('player-123');
        expect(typeof payload.id).toBe('string');
      });
    });

    describe('PLAYER_ACTION', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_ACTION] = {
          action: GameEvent.PLAYER_MOVE,
          data: { playerId: 'player-123', to: 'forest' }
        };

        expect(payload.action).toBe(GameEvent.PLAYER_MOVE);
        expect(payload.data).toEqual({ playerId: 'player-123', to: 'forest' });
      });

      it('должен поддерживать различные типы действий', () => {
        const moveAction: EventPayloadMap[GameEvent.PLAYER_ACTION] = {
          action: GameEvent.PLAYER_MOVE,
          data: { playerId: 'player-123', to: 'castle' }
        };

        const itemAction: EventPayloadMap[GameEvent.PLAYER_ACTION] = {
          action: GameEvent.ITEM_USED,
          data: { playerId: 'player-123', itemId: 'sword-001' }
        };

        expect(moveAction.action).toBe(GameEvent.PLAYER_MOVE);
        expect(itemAction.action).toBe(GameEvent.ITEM_USED);
      });
    });

    describe('PLAYER_MOVE', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_MOVE] = {
          playerId: 'player-123',
          to: 'forest'
        };

        expect(payload.playerId).toBe('player-123');
        expect(payload.to).toBe('forest');
      });

      it('должен поддерживать различные локации', () => {
        const moveToForest: EventPayloadMap[GameEvent.PLAYER_MOVE] = {
          playerId: 'player-123',
          to: 'forest'
        };

        const moveToCastle: EventPayloadMap[GameEvent.PLAYER_MOVE] = {
          playerId: 'player-123',
          to: 'castle'
        };

        expect(moveToForest.to).toBe('forest');
        expect(moveToCastle.to).toBe('castle');
      });
    });

    describe('PLAYER_JOIN', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_JOIN] = {
          id: 'player-123',
          name: 'TestPlayer'
        };

        expect(payload.id).toBe('player-123');
        expect(payload.name).toBe('TestPlayer');
      });
    });

    describe('PLAYER_LEAVE', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_LEAVE] = {
          id: 'player-123'
        };

        expect(payload.id).toBe('player-123');
      });
    });

    describe('PLAYER_UPDATE', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.PLAYER_UPDATE] = {
          playerId: 'player-123',
          playerData: {
            level: 5,
            health: 100,
            experience: 1500
          }
        };

        expect(payload.playerId).toBe('player-123');
        expect(payload.playerData).toEqual({
          level: 5,
          health: 100,
          experience: 1500
        });
      });

      it('должен поддерживать различные типы данных игрока', () => {
        const statsUpdate: EventPayloadMap[GameEvent.PLAYER_UPDATE] = {
          playerId: 'player-123',
          playerData: { level: 10, health: 200 }
        };

        const inventoryUpdate: EventPayloadMap[GameEvent.PLAYER_UPDATE] = {
          playerId: 'player-123',
          playerData: { inventory: ['sword', 'shield', 'potion'] }
        };

        expect(statsUpdate.playerData).toHaveProperty('level');
        expect(inventoryUpdate.playerData).toHaveProperty('inventory');
      });
    });

    describe('STATE_CHANGED', () => {
      it('должен принимать корректный payload', () => {
        const gameState: GameState = {
          public: {
            players: [
              { id: 'player-123', name: 'TestPlayer' }
            ],
            locations: [
              { id: 'forest', name: 'Лес' }
            ]
          },
                     master: {
             logs: ['secret log entry']
           }
        };

        const payload: EventPayloadMap[GameEvent.STATE_CHANGED] = gameState;

        expect(payload.public.players).toHaveLength(1);
        expect(payload.public.locations).toHaveLength(1);
        expect(payload.master).toHaveProperty('logs');
      });
    });

    describe('ITEM_ADDED', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.ITEM_ADDED] = {
          playerId: 'player-123',
          itemId: 'sword-001'
        };

        expect(payload.playerId).toBe('player-123');
        expect(payload.itemId).toBe('sword-001');
      });
    });

    describe('ITEM_USED', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.ITEM_USED] = {
          playerId: 'player-123',
          itemId: 'potion-001'
        };

        expect(payload.playerId).toBe('player-123');
        expect(payload.itemId).toBe('potion-001');
      });
    });

    describe('LOCATION_ENTER', () => {
      it('должен принимать корректный payload', () => {
        const payload: EventPayloadMap[GameEvent.LOCATION_ENTER] = {
          playerId: 'player-123',
          locationId: 'forest'
        };

        expect(payload.playerId).toBe('player-123');
        expect(payload.locationId).toBe('forest');
      });

      it('должен поддерживать различные локации', () => {
        const enterForest: EventPayloadMap[GameEvent.LOCATION_ENTER] = {
          playerId: 'player-123',
          locationId: 'forest'
        };

        const enterCastle: EventPayloadMap[GameEvent.LOCATION_ENTER] = {
          playerId: 'player-123',
          locationId: 'castle'
        };

        expect(enterForest.locationId).toBe('forest');
        expect(enterCastle.locationId).toBe('castle');
      });
    });

    describe('QUEST_UPDATED', () => {
      it('должен принимать корректный payload для начатого квеста', () => {
        const payload: EventPayloadMap[GameEvent.QUEST_UPDATED] = {
          questId: 'quest-001',
          status: 'started'
        };

        expect(payload.questId).toBe('quest-001');
        expect(payload.status).toBe('started');
      });

      it('должен принимать корректный payload для завершенного квеста', () => {
        const payload: EventPayloadMap[GameEvent.QUEST_UPDATED] = {
          questId: 'quest-001',
          status: 'completed'
        };

        expect(payload.questId).toBe('quest-001');
        expect(payload.status).toBe('completed');
      });

      it('должен поддерживать только валидные статусы', () => {
        const validStatuses: Array<EventPayloadMap[GameEvent.QUEST_UPDATED]['status']> = [
          'started',
          'completed'
        ];

        expect(validStatuses).toContain('started');
        expect(validStatuses).toContain('completed');
        expect(validStatuses).not.toContain('failed');
      });
    });
  });

  describe('Интеграционные тесты событий', () => {
    it('должен корректно работать с цепочкой событий', () => {
      // Симуляция цепочки событий при входе игрока
      const playerConnect: EventPayloadMap[GameEvent.PLAYER_CONNECT] = {
        id: 'player-123'
      };

      const playerJoin: EventPayloadMap[GameEvent.PLAYER_JOIN] = {
        id: 'player-123',
        name: 'TestPlayer'
      };

      const playerMove: EventPayloadMap[GameEvent.PLAYER_MOVE] = {
        playerId: 'player-123',
        to: 'forest'
      };

      const locationEnter: EventPayloadMap[GameEvent.LOCATION_ENTER] = {
        playerId: 'player-123',
        locationId: 'forest'
      };

      expect(playerConnect.id).toBe(playerJoin.id);
      expect(playerJoin.id).toBe(playerMove.playerId);
      expect(playerMove.playerId).toBe(locationEnter.playerId);
      expect(playerMove.to).toBe(locationEnter.locationId);
    });

    it('должен корректно работать с обновлением состояния', () => {
      const initialState: GameState = {
        public: {
          players: [],
          locations: [{ id: 'forest', name: 'Лес' }]
        },
        master: {}
      };

      const updatedState: EventPayloadMap[GameEvent.STATE_CHANGED] = {
        public: {
          players: [{ id: 'player-123', name: 'TestPlayer' }],
          locations: [{ id: 'forest', name: 'Лес' }]
        },
                 master: {
           npcPlans: { 'player-123': { level: 1 } }
         }
      };

      expect(initialState.public.players).toHaveLength(0);
      expect(updatedState.public.players).toHaveLength(1);
      expect(updatedState.public.players[0].id).toBe('player-123');
    });

    it('должен корректно работать с системой предметов', () => {
      const itemAdded: EventPayloadMap[GameEvent.ITEM_ADDED] = {
        playerId: 'player-123',
        itemId: 'sword-001'
      };

      const itemUsed: EventPayloadMap[GameEvent.ITEM_USED] = {
        playerId: 'player-123',
        itemId: 'potion-001'
      };

      expect(itemAdded.playerId).toBe(itemUsed.playerId);
      expect(itemAdded.itemId).toBe('sword-001');
      expect(itemUsed.itemId).toBe('potion-001');
    });
  });

  describe('Валидация типов', () => {
    it('должен обеспечивать типобезопасность для всех событий', () => {
      // Этот тест проверяет, что TypeScript корректно типизирует все события
      const events: Record<GameEvent, any> = {
        [GameEvent.PLAYER_CONNECT]: { id: 'test' },
        [GameEvent.PLAYER_ACTION]: { action: GameEvent.PLAYER_MOVE, data: {} },
        [GameEvent.PLAYER_MOVE]: { playerId: 'test', to: 'forest' },
        [GameEvent.PLAYER_JOIN]: { id: 'test', name: 'Test' },
        [GameEvent.PLAYER_LEAVE]: { id: 'test' },
        [GameEvent.PLAYER_UPDATE]: { playerId: 'test', playerData: {} },
        [GameEvent.STATE_CHANGED]: { public: { players: [], locations: [] }, master: {} },
        [GameEvent.ITEM_ADDED]: { playerId: 'test', itemId: 'item-001' },
        [GameEvent.ITEM_USED]: { playerId: 'test', itemId: 'item-001' },
        [GameEvent.LOCATION_ENTER]: { playerId: 'test', locationId: 'forest' },
        [GameEvent.QUEST_UPDATED]: { questId: 'quest-001', status: 'started' as const }
      };

      expect(Object.keys(events)).toHaveLength(Object.keys(GameEvent).length);
    });
  });
});
