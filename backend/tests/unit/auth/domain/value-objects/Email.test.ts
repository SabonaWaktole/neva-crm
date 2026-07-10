import { Email } from '@auth/domain/value-objects/Email';
import { InvalidEmailError } from '@auth/domain/errors';

describe('Email Value Object', () => {
  describe('valid emails', () => {
    it.each([
      'user@example.com',
      'user.name+tag@domain.co.uk',
      'user@sub.domain.com',
    ])('should accept valid email: %s', (raw) => {
      const email = new Email(raw);
      expect(email.value).toBe(raw);
    });
  });

  describe('invalid emails', () => {
    it('should throw InvalidEmailError for empty string', () => {
      expect(() => new Email('')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing @', () => {
      expect(() => new Email('plaintext')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing domain', () => {
      expect(() => new Email('user@')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing local part', () => {
      expect(() => new Email('@domain.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for spaces in email', () => {
      expect(() => new Email('user @domain.com')).toThrow(InvalidEmailError);
    });
  });
});
