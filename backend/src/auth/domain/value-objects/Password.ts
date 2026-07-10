import { WeakPasswordError } from '../errors';

export class Password {
  public readonly value: string;

  constructor(value: string) {
    if (!Password.isStrong(value)) {
      throw new WeakPasswordError();
    }
    this.value = value;
  }

  private static isStrong(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }
}
