import { Request, Response, NextFunction } from 'express';
import { JWTService, UserPayload } from '../auth/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authMiddleware = async (
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
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};
