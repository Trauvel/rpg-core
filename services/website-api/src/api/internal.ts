import { Express } from "express";
import { GameSessionService } from "../services/gameSessionService";

/**
 * Internal API for service-to-service communication
 * Used by Game Server to load/save player state
 */
export function registerInternalApi(app: Express) {
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

  // Middleware для проверки внутреннего токена
  const checkInternalToken = (req: any, res: any, next: any) => {
    const serviceToken = req.headers['x-service-token'];
    
    if (serviceToken !== internalToken) {
      return res.status(401).json({ error: 'Unauthorized service call' });
    }
    
    next();
  };

  /**
   * Загрузить состояние игрока (для Game Server)
   */
  app.get('/internal/player-state/:userId', checkInternalToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const state = await GameSessionService.loadPlayerState(userId);

      if (!state) {
        return res.status(404).json({ error: 'No active session found' });
      }

      res.json({ state });
    } catch (error) {
      console.error('Error loading player state:', error);
      res.status(500).json({ error: 'Error loading player state' });
    }
  });

  /**
   * Сохранить состояние игрока (для Game Server)
   */
  app.post('/internal/player-state/:userId', checkInternalToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { state } = req.body;

      if (!state) {
        return res.status(400).json({ error: 'State not provided' });
      }

      const success = await GameSessionService.savePlayerState(userId, state);

      if (!success) {
        return res.status(404).json({ error: 'No active session found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving player state:', error);
      res.status(500).json({ error: 'Error saving player state' });
    }
  });
}

