import { Invitation } from '../entities/Invitation';

export interface IInvitationRepository {
  create(invitation: Invitation): Promise<Invitation>;
  findByToken(token: string): Promise<Invitation | null>;
  markAccepted(id: string, acceptedAt: Date): Promise<void>;
}
