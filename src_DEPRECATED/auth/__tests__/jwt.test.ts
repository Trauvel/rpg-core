import { JWTService, UserPayload } from '../jwt';

describe('JWTService', () => {
  const mockPayload: UserPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
  };

  describe('generateToken', () => {
    it('должен генерировать валидный JWT токен', () => {
      const token = JWTService.generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT состоит из 3 частей
    });

    it('должен генерировать разные токены для разных payload', () => {
      const payload1 = { ...mockPayload, userId: 'user1' };
      const payload2 = { ...mockPayload, userId: 'user2' };

      const token1 = JWTService.generateToken(payload1);
      const token2 = JWTService.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('должен верифицировать валидный токен', () => {
      const token = JWTService.generateToken(mockPayload);
      const verifiedPayload = JWTService.verifyToken(token);

      // Исключаем поля exp и iat, которые добавляет JWT
      const { exp, iat, ...payloadWithoutJwtFields } = verifiedPayload as any;
      expect(payloadWithoutJwtFields).toEqual(mockPayload);
    });

    it('должен выбросить ошибку при невалидном токене', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JWTService.verifyToken(invalidToken);
      }).toThrow();
    });

    it('должен выбросить ошибку при пустом токене', () => {
      expect(() => {
        JWTService.verifyToken('');
      }).toThrow();
    });

    it('должен выбросить ошибку при токене с неправильной структурой', () => {
      const malformedToken = 'not.a.jwt.token';

      expect(() => {
        JWTService.verifyToken(malformedToken);
      }).toThrow();
    });
  });

  describe('generateToken и verifyToken', () => {
    it('должен генерировать и верифицировать токен с полным payload', () => {
      const fullPayload: UserPayload = {
        userId: 'full-user-id',
        email: 'full@example.com',
        username: 'fulluser',
      };

      const token = JWTService.generateToken(fullPayload);
      const verifiedPayload = JWTService.verifyToken(token);

      expect(verifiedPayload.userId).toBe(fullPayload.userId);
      expect(verifiedPayload.email).toBe(fullPayload.email);
      expect(verifiedPayload.username).toBe(fullPayload.username);
    });
  });
});
