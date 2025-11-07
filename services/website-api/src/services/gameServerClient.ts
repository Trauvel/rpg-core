/**
 * Клиент для обращения к Game Server API
 * Используется для получения игровых данных вместо прямого доступа к БД
 */

interface GameServerClientConfig {
  baseUrl: string;
}

interface GameSessionResponse {
  session: {
    id: string;
    userId: string;
    username?: string;
    socketId?: string;
    isActive: boolean;
    createdAt?: Date | string;
    lastActivity?: Date | string;
    player?: any;
  };
}

interface PlayerStateResponse {
  state: any;
}

export class GameServerClient {
  private baseUrl: string;

  constructor(config: GameServerClientConfig) {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Выполняет запрос к game-server с JWT токеном
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Получает активную игровую сессию пользователя
   */
  async getActiveSession(token: string): Promise<GameSessionResponse> {
    return this.request<GameSessionResponse>('/api/game-session/active', {
      method: 'GET',
      token,
    });
  }

  /**
   * Получает состояние игрока из game-server
   */
  async getPlayerState(token: string): Promise<PlayerStateResponse> {
    return this.request<PlayerStateResponse>('/api/game-session/state', {
      method: 'GET',
      token,
    });
  }

  /**
   * Сохраняет состояние игрока через game-server
   */
  async savePlayerState(token: string, state: any): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/game-session/state', {
      method: 'POST',
      token,
      body: { state },
    });
  }

  /**
   * Создаёт игровую сессию в game-server
   */
  async createSession(token: string, characterName?: string): Promise<GameSessionResponse> {
    return this.request<GameSessionResponse>('/api/game-session/create', {
      method: 'POST',
      token,
      body: characterName ? { characterName } : undefined,
    });
  }

  /**
   * Обновляет данные игровой сессии в game-server
   */
  async updateSession(
    token: string,
    sessionId: string,
    updateData: any
  ): Promise<GameSessionResponse> {
    return this.request<GameSessionResponse>(`/api/game-session/${sessionId}`, {
      method: 'PUT',
      token,
      body: updateData,
    });
  }
}

// Создаём singleton экземпляр клиента
export const gameServerClient = new GameServerClient({
  baseUrl: process.env.GAME_SERVER_URL || 'http://localhost:3001',
});

