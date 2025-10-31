import { Socket, ExtendedError } from "socket.io";
import { JWTService, UserPayload } from '@rpg-platform/shared';

/**
 * Middleware для проверки JWT токена при подключении к WebSocket
 */
export const gameAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Получаем токен из handshake.auth или handshake.headers
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Верифицируем токен
    const payload: UserPayload = JWTService.verifyToken(token);

    // Сохраняем данные пользователя в socket.data
    socket.data.user = payload;
    socket.data.authenticated = true;

    console.log(`✅ User authenticated: ${payload.username} (${payload.userId})`);
    next();
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Расширяем тип SocketData для хранения данных пользователя
declare module 'socket.io' {
  interface SocketData {
    user?: UserPayload;
    authenticated?: boolean;
    [key: string]: any;
  }
}

