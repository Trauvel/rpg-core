import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RPG Core Game Server API',
      version: '1.0.0',
      description: 'API для игрового ядра RPG игры с WebSocket поддержкой',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен. Формат: Bearer {token}. Используется для WebSocket соединений.',
        },
      },
      schemas: {
        Player: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор игрока в игре',
            },
            userId: {
              type: 'string',
              description: 'ID пользователя из БД',
            },
            name: {
              type: 'string',
              description: 'Имя персонажа',
            },
            locationId: {
              type: 'string',
              description: 'ID текущей локации',
            },
            inventory: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Список ID предметов в инвентаре',
            },
            hp: { type: 'number', description: 'Текущее здоровье' },
            maxHp: { type: 'number', description: 'Максимальное здоровье' },
            level: { type: 'number', description: 'Уровень персонажа' },
            experience: { type: 'number', description: 'Опыт персонажа' },
            strength: { type: 'number', description: 'Сила' },
            dexterity: { type: 'number', description: 'Ловкость' },
            constitution: { type: 'number', description: 'Телосложение' },
            intelligence: { type: 'number', description: 'Интеллект' },
            wisdom: { type: 'number', description: 'Мудрость' },
            charisma: { type: 'number', description: 'Харизма' },
            class: { type: 'string', description: 'Класс персонажа' },
            race: { type: 'string', description: 'Раса персонажа' },
            armorClass: { type: 'number', description: 'Класс брони' },
            initiative: { type: 'number', description: 'Инициатива' },
            speed: { type: 'number', description: 'Скорость' },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор локации',
            },
            name: {
              type: 'string',
              description: 'Название локации',
            },
            description: {
              type: 'string',
              description: 'Описание локации',
            },
            locations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Location',
              },
              description: 'Вложенные локации',
            },
          },
        },
        PublicState: {
          type: 'object',
          description: 'Публичное состояние игры, видимое всем игрокам',
          properties: {
            players: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Player',
              },
            },
            locations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Location',
              },
            },
            logs: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        MasterState: {
          type: 'object',
          description: 'Мастерское состояние игры, видимое только мастеру',
          properties: {
            hiddenLocations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Location',
              },
            },
            traps: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            npcPlans: {
              type: 'object',
            },
            logs: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        GameState: {
          type: 'object',
          description: 'Полное состояние игры',
          properties: {
            public: {
              $ref: '#/components/schemas/PublicState',
            },
            master: {
              $ref: '#/components/schemas/MasterState',
            },
          },
        },
        GameSession: {
          type: 'object',
          description: 'Игровая сессия',
          properties: {
            userId: {
              type: 'string',
              description: 'ID пользователя',
            },
            username: {
              type: 'string',
              description: 'Имя пользователя',
            },
            socketId: {
              type: 'string',
              description: 'Socket ID соединения',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Время создания сессии',
            },
            lastActivity: {
              type: 'string',
              format: 'date-time',
              description: 'Время последней активности',
            },
          },
        },
        SessionStats: {
          type: 'object',
          description: 'Статистика сессий',
          properties: {
            total: {
              type: 'number',
              description: 'Общее количество активных сессий',
            },
            details: {
              type: 'object',
              properties: {
                online: {
                  type: 'number',
                  description: 'Количество онлайн пользователей',
                },
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      username: { type: 'string' },
                      socketId: { type: 'string' },
                      connected: { type: 'string', format: 'date-time' },
                      lastActivity: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        WebSocketEvent: {
          type: 'object',
          description: 'WebSocket событие',
          properties: {
            event: {
              type: 'string',
              enum: [
                'player:connect',
                'player:action',
                'player:move',
                'player:join',
                'player:leave',
                'player:update',
                'state:changed',
                'item:added',
                'item:used',
                'location:enter',
                'quest:updated',
              ],
              description: 'Тип события',
            },
            payload: {
              type: 'object',
              description: 'Данные события',
            },
          },
        },
        PlayerAction: {
          type: 'object',
          description: 'Действие игрока, отправляемое через WebSocket (событие: playerAction)',
          properties: {
            action: {
              type: 'string',
              enum: [
                'player:move',
                'player:update',
                'item:used',
                'location:enter',
              ],
              description: 'Тип действия',
            },
            data: {
              type: 'object',
              description: 'Данные действия',
            },
          },
          example: {
            action: 'player:move',
            data: {
              playerId: 'player-123',
              to: 'location-456',
            },
          },
        },
        WebSocketEvents: {
          type: 'object',
          description: 'Документация всех WebSocket событий',
          properties: {
            incoming: {
              type: 'object',
              description: 'События, которые отправляет клиент',
              properties: {
                playerAction: {
                  type: 'object',
                  description: 'Действие игрока - основное событие для отправки действий',
                  properties: {
                    action: {
                      type: 'string',
                      enum: [
                        'player:move',
                        'player:update',
                        'item:used',
                        'location:enter',
                      ],
                    },
                    data: {
                      type: 'object',
                    },
                  },
                },
              },
            },
            outgoing: {
              type: 'object',
              description: 'События, которые отправляет сервер',
              properties: {
                'player:connect': {
                  type: 'object',
                  description: 'Игрок подключился к игре',
                  properties: {
                    socket_id: { type: 'string' },
                    userId: { type: 'string' },
                    username: { type: 'string' },
                  },
                },
                'player:join': {
                  type: 'object',
                  description: 'Игрок присоединился к игре',
                  properties: {
                    socket_id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
                'player:leave': {
                  type: 'object',
                  description: 'Игрок покинул игру',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                  },
                },
                'player:move': {
                  type: 'object',
                  description: 'Игрок переместился',
                  properties: {
                    playerId: { type: 'string' },
                    to: { type: 'string' },
                  },
                },
                'player:update': {
                  type: 'object',
                  description: 'Обновление данных игрока',
                  properties: {
                    playerId: { type: 'string' },
                    playerData: { type: 'object' },
                  },
                },
                'state:changed': {
                  type: 'object',
                  description: 'Состояние игры изменилось. Отправляется полное состояние игры типа GameState',
                  properties: {
                    public: {
                      $ref: '#/components/schemas/PublicState',
                    },
                    master: {
                      $ref: '#/components/schemas/MasterState',
                    },
                  },
                },
                'item:added': {
                  type: 'object',
                  description: 'Предмет добавлен в инвентарь',
                  properties: {
                    playerId: { type: 'string' },
                    itemId: { type: 'string' },
                  },
                },
                'item:used': {
                  type: 'object',
                  description: 'Предмет использован',
                  properties: {
                    playerId: { type: 'string' },
                    itemId: { type: 'string' },
                  },
                },
                'location:enter': {
                  type: 'object',
                  description: 'Игрок вошёл в локацию',
                  properties: {
                    playerId: { type: 'string' },
                    locationId: { type: 'string' },
                  },
                },
                'quest:updated': {
                  type: 'object',
                  description: 'Обновление квеста',
                  properties: {
                    questId: { type: 'string' },
                    status: {
                      type: 'string',
                      enum: ['started', 'completed'],
                    },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Dev',
        description: 'API для разработки и отладки',
      },
      {
        name: 'Sessions',
        description: 'Управление игровыми сессиями',
      },
      {
        name: 'Player',
        description: 'Информация об игроке',
      },
      {
        name: 'WebSocket',
        description: 'WebSocket события и взаимодействие. Для подключения используйте WebSocket соединение с JWT токеном в query параметре или заголовке Authorization.',
      },
    ],
    paths: {
      '/ws': {
        get: {
          summary: 'WebSocket соединение',
          description: 'Подключение к игровому серверу через WebSocket. Требует JWT токен для авторизации. После подключения можно отправлять и получать события.',
          tags: ['WebSocket'],
          parameters: [
            {
              name: 'token',
              in: 'query',
              description: 'JWT токен для авторизации',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            101: {
              description: 'Успешное переключение протокола на WebSocket',
            },
            401: {
              description: 'Неавторизован',
            },
          },
        },
      },
      '/ws/playerAction': {
        post: {
          summary: 'Отправить действие игрока',
          description: 'Отправка действия игрока через WebSocket. Событие: playerAction',
          tags: ['WebSocket'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PlayerAction',
                },
                examples: {
                  move: {
                    summary: 'Перемещение игрока',
                    value: {
                      action: 'player:move',
                      data: {
                        playerId: 'player-123',
                        to: 'location-456',
                      },
                    },
                  },
                  update: {
                    summary: 'Обновление данных игрока',
                    value: {
                      action: 'player:update',
                      data: {
                        playerId: 'player-123',
                        playerData: {
                          hp: 100,
                          level: 5,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Действие принято',
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/*.ts'], // Путь к файлам с API
};

export const specs = swaggerJsdoc(options);

