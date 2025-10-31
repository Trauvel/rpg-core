import { PasswordService } from '../password';

describe('PasswordService', () => {
  const testPassword = 'testPassword123';

  describe('hashPassword', () => {
    it('должен хешировать пароль', async () => {
      const hashedPassword = await PasswordService.hashPassword(testPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(testPassword.length);
    });

    it('должен генерировать разные хеши для одного пароля', async () => {
      const hash1 = await PasswordService.hashPassword(testPassword);
      const hash2 = await PasswordService.hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('должен хешировать пустой пароль', async () => {
      const hashedPassword = await PasswordService.hashPassword('');

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe('');
    });

    it('должен хешировать сложный пароль', async () => {
      const complexPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await PasswordService.hashPassword(complexPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(complexPassword);
    });
  });

  describe('verifyPassword', () => {
    it('должен верифицировать правильный пароль', async () => {
      const hashedPassword = await PasswordService.hashPassword(testPassword);
      const isValid = await PasswordService.verifyPassword(hashedPassword, testPassword);

      expect(isValid).toBe(true);
    });

    it('должен отклонять неправильный пароль', async () => {
      const hashedPassword = await PasswordService.hashPassword(testPassword);
      const isValid = await PasswordService.verifyPassword(hashedPassword, 'wrongPassword');

      expect(isValid).toBe(false);
    });

    it('должен отклонять пустой пароль при непустом хеше', async () => {
      const hashedPassword = await PasswordService.hashPassword(testPassword);
      const isValid = await PasswordService.verifyPassword(hashedPassword, '');

      expect(isValid).toBe(false);
    });

    it('должен верифицировать пустой пароль с пустым хешем', async () => {
      const hashedPassword = await PasswordService.hashPassword('');
      const isValid = await PasswordService.verifyPassword(hashedPassword, '');

      expect(isValid).toBe(true);
    });
  });

  describe('hashPassword и verifyPassword', () => {
    it('должен работать с разными типами паролей', async () => {
      const passwords = [
        'simple',
        'Complex123!',
        'пароль с кириллицей',
        'password with spaces',
        '1234567890',
        '!@#$%^&*()',
        'very long password that contains many characters and should be properly hashed',
      ];

      for (const password of passwords) {
        const hashedPassword = await PasswordService.hashPassword(password);
        const isValid = await PasswordService.verifyPassword(hashedPassword, password);

        expect(isValid).toBe(true);
      }
    });

    it('должен отклонять похожие пароли', async () => {
      const originalPassword = 'password123';
      const similarPasswords = [
        'password124',
        'password12',
        'password1234',
        'Password123',
        'PASSWORD123',
        'password 123',
      ];

      const hashedPassword = await PasswordService.hashPassword(originalPassword);

      for (const similarPassword of similarPasswords) {
        const isValid = await PasswordService.verifyPassword(hashedPassword, similarPassword);
        expect(isValid).toBe(false);
      }
    });
  });
});
