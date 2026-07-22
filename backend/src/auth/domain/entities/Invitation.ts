import { UserRole } from '../enums/UserRole';

interface InvitationProps {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  warehouseId?: string | null;
}

export class Invitation {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly email: string;
  public readonly role: UserRole;
  public readonly token: string;
  public readonly expiresAt: Date;
  public readonly acceptedAt: Date | null;
  public readonly warehouseId: string | null;

  private constructor(props: InvitationProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.email = props.email;
    this.role = props.role;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.acceptedAt = props.acceptedAt;
    this.warehouseId = props.warehouseId || null;
  }

  public static create(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public isAccepted(): boolean {
    return this.acceptedAt !== null;
  }
}
