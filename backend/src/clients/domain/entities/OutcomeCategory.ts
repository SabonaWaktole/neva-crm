import { DomainError } from '../../../shared/domain/errors/DomainError';

export interface OutcomeCategoryProps {
  id: string;
  tenantId: string;
  label: string;
}

export class OutcomeCategory {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly label: string;

  private constructor(props: OutcomeCategoryProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.label = props.label;
  }

  public static create(props: OutcomeCategoryProps): OutcomeCategory {
    if (!props.label || props.label.trim() === '') {
      throw new DomainError('Outcome category label cannot be empty.');
    }

    return new OutcomeCategory(props);
  }
}
