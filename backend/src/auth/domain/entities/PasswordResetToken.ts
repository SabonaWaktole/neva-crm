interface PasswordResetTokenProps {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export class PasswordResetToken {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public readonly usedAt: Date | null;

  private constructor(props: PasswordResetTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
  }

  public static create(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public isUsed(): boolean {
    return this.usedAt !== null;
  }
}
