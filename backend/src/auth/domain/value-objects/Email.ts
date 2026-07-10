import { InvalidEmailError } from '../errors';

export class Email {
  public readonly value: string;

  constructor(value: string) {
    if (!Email.isValid(value)) {
      throw new InvalidEmailError(value);
    }
    this.value = value;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
