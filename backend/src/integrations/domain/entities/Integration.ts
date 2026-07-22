export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

export interface IntegrationProps {
  id: string;
  tenantId: string;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Integration {
  constructor(private props: IntegrationProps) {}

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get provider(): string { return this.props.provider; }
  get status(): IntegrationStatus { return this.props.status; }
  get config(): Record<string, any> | null { return this.props.config; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public connect(config: Record<string, any> | null): void {
    this.props.status = 'CONNECTED';
    this.props.config = config;
    this.props.updatedAt = new Date();
  }

  public disconnect(): void {
    this.props.status = 'DISCONNECTED';
    this.props.config = null;
    this.props.updatedAt = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      provider: this.provider,
      status: this.status,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
