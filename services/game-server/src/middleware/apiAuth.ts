import { Request, Response, NextFunction } from 'express';
import { JWTService, UserPayload } from '@rpg-platform/shared';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

/**
 * Middleware для проверки JWT токена в Express API
 */
export const apiAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const token = authHeader.substring(7);
    const payload: UserPayload = JWTService.verifyToken(token);

    req.user = payload;
    next();
  } catch (error: any) {
    console.error('❌ API Authentication failed:', error.message);
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

