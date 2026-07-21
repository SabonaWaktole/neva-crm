interface TenantProps {
  id: string;
  name: string;
  urlSlug: string;
  requiresQuotationApproval?: boolean;
  createdAt: Date;
}

export class Tenant {
  public readonly id: string;
  public readonly name: string;
  public readonly urlSlug: string;
  public readonly requiresQuotationApproval: boolean;
  public readonly createdAt: Date;

  private constructor(props: TenantProps) {
    this.id = props.id;
    this.name = props.name;
    this.urlSlug = props.urlSlug;
    this.requiresQuotationApproval = props.requiresQuotationApproval ?? true;
    this.createdAt = props.createdAt;
  }

  public static create(props: TenantProps): Tenant {
    return new Tenant(props);
  }
}
