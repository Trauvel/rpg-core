import { Player } from '@rpg-platform/shared';

/**
 * Сервис для синхронизации игрового состояния с Website API
 * Пока использует HTTP вызовы, в будущем можно заменить на gRPC или очередь
 */
export class PersistenceService {
  private static websiteApiUrl = process.env.WEBSITE_API_URL || 'http://localhost:3000';
  private static jwtSecret = process.env.JWT_SECRET;
  private static internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

  /**
   * Загружает состояние игрока с сервера
   */
  static async loadPlayerState(userId: string): Promise<Player | null> {
    try {
      const response = await fetch(`${this.websiteApiUrl}/internal/player-state/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': this.internalToken,
        },
      });

      if (!response.ok) {
        console.error(`Failed to load player state: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data.state || null;
    } catch (error) {
      console.error('Error loading player state:', error);
      return null;
    }
  }

  /**
   * Сохраняет состояние игрока на сервере
   */
  static async savePlayerState(userId: string, playerState: Partial<Player>): Promise<boolean> {
    try {
      const response = await fetch(`${this.websiteApiUrl}/internal/player-state/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': this.internalToken,
        },
        body: JSON.stringify({ state: playerState }),
      });

      if (!response.ok) {
        console.error(`Failed to save player state: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving player state:', error);
      return false;
    }
  }

  /**
   * Синхронизирует состояние игрока (сохраняет на сервере)
   */
  static async syncPlayerState(userId: string, playerState: Partial<Player>): Promise<void> {
    // TODO: Добавить батчинг для оптимизации
    await this.savePlayerState(userId, playerState);
  }
}

