import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'your-secret-key';

export interface UserPayload {
  userId: string;
  email: string;
  username: string;
}

export class JWTService {
  static generateToken(payload: UserPayload): string {
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  static verifyToken(token: string): UserPayload {
    return jwt.verify(token, secret) as UserPayload;
  }
}
