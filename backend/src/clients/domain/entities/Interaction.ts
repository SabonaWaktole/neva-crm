import { InteractionChannel } from '../enums/InteractionChannel';
import { OutcomeCategory } from './OutcomeCategory';
import { DomainError } from '../../../shared/domain/errors/DomainError';

export interface InteractionProps {
  id: string;
  tenantId: string;
  clientId: string;
  authorUserId: string;
  content: string;
  channel: InteractionChannel;
  outcomeCategory?: OutcomeCategory | null;
  createdAt: Date;
}

export class Interaction {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly clientId: string;
  public readonly authorUserId: string;
  public readonly content: string;
  public readonly channel: InteractionChannel;
  public readonly outcomeCategory?: OutcomeCategory | null;
  public readonly createdAt: Date;

  private constructor(props: InteractionProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.clientId = props.clientId;
    this.authorUserId = props.authorUserId;
    this.content = props.content;
    this.channel = props.channel;
    this.outcomeCategory = props.outcomeCategory;
    this.createdAt = props.createdAt;
  }

  public static create(props: InteractionProps): Interaction {
    if (props.outcomeCategory) {
      if (props.outcomeCategory.tenantId !== props.tenantId) {
        throw new DomainError('Outcome category does not belong to this tenant.');
      }
    }

    return new Interaction(props);
  }
}
