import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RPG Core API',
      version: '1.0.0',
      description: 'API для RPG игры с авторизацией',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен. Формат: Bearer {token}',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            username: {
              type: 'string',
              description: 'Имя пользователя',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания аккаунта',
            },
          },
        },
        GameSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор сессии',
            },
            userId: {
              type: 'string',
              description: 'ID пользователя',
            },
            socketId: {
              type: 'string',
              nullable: true,
              description: 'Socket ID текущего соединения',
            },
            isActive: {
              type: 'boolean',
              description: 'Активна ли сессия',
            },
            characterName: {
              type: 'string',
              nullable: true,
              description: 'Имя персонажа в игре',
            },
            level: {
              type: 'integer',
              default: 1,
              description: 'Уровень персонажа',
            },
            experience: {
              type: 'integer',
              default: 0,
              description: 'Опыт персонажа',
            },
            hp: {
              type: 'integer',
              default: 10,
              description: 'Текущее здоровье',
            },
            maxHp: {
              type: 'integer',
              default: 10,
              description: 'Максимальное здоровье',
            },
            locationId: {
              type: 'string',
              nullable: true,
              description: 'ID текущей локации',
            },
            strength: { type: 'integer', default: 10 },
            dexterity: { type: 'integer', default: 10 },
            constitution: { type: 'integer', default: 10 },
            intelligence: { type: 'integer', default: 10 },
            wisdom: { type: 'integer', default: 10 },
            charisma: { type: 'integer', default: 10 },
            class: {
              type: 'string',
              default: 'Adventurer',
              description: 'Класс персонажа',
            },
            race: {
              type: 'string',
              default: 'Human',
              description: 'Раса персонажа',
            },
            armorClass: { type: 'integer', default: 10 },
            initiative: { type: 'integer', default: 0 },
            speed: { type: 'integer', default: 30 },
            inventory: {
              type: 'string',
              default: '[]',
              description: 'Инвентарь в формате JSON',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PlayerState: {
          type: 'object',
          description: 'Состояние игрока в игре',
          properties: {
            userId: {
              type: 'string',
              description: 'ID пользователя',
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
            level: { type: 'number', description: 'Уровень' },
            experience: { type: 'number', description: 'Опыт' },
            strength: { type: 'number' },
            dexterity: { type: 'number' },
            constitution: { type: 'number' },
            intelligence: { type: 'number' },
            wisdom: { type: 'number' },
            charisma: { type: 'number' },
            class: { type: 'string' },
            race: { type: 'string' },
            armorClass: { type: 'number' },
            initiative: { type: 'number' },
            speed: { type: 'number' },
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
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'JWT токен для авторизации',
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/*.ts'], // Путь к файлам с API
};

export const specs = swaggerJsdoc(options);
