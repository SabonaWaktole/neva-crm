export enum ClientStatus {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Client {
  id: string;
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  status: ClientStatus;
  assignedUserId: string | null;
  customFieldValues: Record<string, any>;
  lastUpdatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  fieldName: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  isRequired: boolean;
}

export interface OutcomeCategory {
  id: string;
  tenantId: string;
  label: string;
}

export interface Interaction {
  id: string;
  clientId: string;
  type: string;
  channel: string;
  content: string;
  outcomeCategoryId?: string | null;
  authorUserId: string;
  createdAt: string;
}

export interface ClientHistory {
  timeline: Array<{
    id: string;
    timestamp: string;
    type: string;
    description: string;
    actor: string;
    details?: any;
  }>;
}

export interface SearchClientsParams {
  name?: string;
  status?: ClientStatus;
  assignedUserId?: string;
  customFields?: Record<string, any>;
  skip?: number;
  take?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}
