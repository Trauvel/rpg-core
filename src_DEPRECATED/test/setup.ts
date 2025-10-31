import { PrismaClient } from '@prisma/client';

// Глобальная настройка для тестов
beforeAll(async () => {
  // Здесь можно добавить глобальную настройку
  console.log('🧪 Настройка тестового окружения');
});

afterAll(async () => {
  // Очистка после всех тестов
  console.log('🧹 Очистка тестового окружения');
});

// Увеличиваем timeout для тестов
jest.setTimeout(10000);
