import { Password } from '@auth/domain/value-objects/Password';
import { WeakPasswordError } from '@auth/domain/errors';

describe('Password Value Object', () => {
  describe('valid passwords', () => {
    it.each([
      'Password1',
      'MyP@ss123',
      'AbcDef99',
    ])('should accept valid password: %s', (raw) => {
      const password = new Password(raw);
      expect(password.value).toBe(raw);
    });
  });

  describe('invalid passwords', () => {
    it('should throw WeakPasswordError when too short', () => {
      expect(() => new Password('Pass1')).toThrow(WeakPasswordError);
    });

    it('should throw WeakPasswordError when no uppercase letter', () => {
      expect(() => new Password('password1')).toThrow(WeakPasswordError);
    });

    it('should throw WeakPasswordError when no lowercase letter', () => {
      expect(() => new Password('PASSWORD1')).toThrow(WeakPasswordError);
    });

    it('should throw WeakPasswordError when no digit', () => {
      expect(() => new Password('Password')).toThrow(WeakPasswordError);
    });

    it('should throw WeakPasswordError for empty string', () => {
      expect(() => new Password('')).toThrow(WeakPasswordError);
    });
  });
});
