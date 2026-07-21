import { UserRole } from '../enums/UserRole';

interface UserProps {
  id: string;
  email: string;
  hashedPassword: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: UserRole;
  tenantId: string | null;
  createdAt: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly hashedPassword: string;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly phone: string | null;
  public readonly role: UserRole;
  public readonly tenantId: string | null;
  public readonly createdAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.hashedPassword = props.hashedPassword;
    this.firstName = props.firstName || null;
    this.lastName = props.lastName || null;
    this.phone = props.phone || null;
    this.role = props.role;
    this.tenantId = props.tenantId;
    this.createdAt = props.createdAt;
  }

  public static create(props: UserProps): User {
    if (props.role === UserRole.SUPER_ADMIN && props.tenantId !== null) {
      throw new Error('SUPER_ADMIN must not be associated with a tenant');
    }
    if (props.role !== UserRole.SUPER_ADMIN && props.tenantId === null) {
      throw new Error(`${props.role} must be associated with a tenant`);
    }
    return new User(props);
  }
}
