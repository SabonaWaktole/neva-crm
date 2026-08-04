import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { IEmailSender } from '../ports/IEmailSender';
import { IAuditLogger } from '../../../shared/application/ports/IAuditLogger';
import { Invitation } from '../../domain/entities/Invitation';
import { UserRole } from '../../domain/enums/UserRole';
import {
  UnauthorizedError,
  UserAlreadyInWorkspaceError,
  InvitationAlreadyPendingError,
} from '../../domain/errors';
import { TenantNotFoundError } from '../../../tenant/domain/errors';

/** Same 24 hours `InviteStaffUseCase` gives an invitation. */
const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;

export interface PlatformInviteUserDTO {
  callerRole: string;
  callerId: string;
  tenantId: string;
  email: string;
  /** Defaults to BUSINESS_OWNER — the reason this endpoint exists. */
  role?: UserRole;
}

/**
 * The third way someone becomes a Business Owner: a Platform Admin invites
 * them from outside the platform, without entering the workspace first.
 *
 * The other two are already covered elsewhere — an existing staff member
 * promoted through `UpdateUserRoleUseCase`, and an outsider invited by a
 * Business Owner through `InviteStaffUseCase`. All three ADD an owner; none
 * of them replaces one, because a business may have any number of Business
 * Owners (see `otherActiveOwners`).
 *
 * Distinct from `CreateUserUseCase`, which the console also offers: that one
 * provisions an account with a password the admin types and hands over. This
 * one sends a link and lets the recipient set their own, which is the right
 * shape when the invitee is a real third party rather than an account the
 * admin is standing up on someone's behalf.
 */
export class PlatformInviteUserUseCase {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly emailSender: IEmailSender,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(dto: PlatformInviteUserDTO): Promise<{ email: string; role: UserRole; token: string }> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can invite a user into a workspace');
    }

    const tenant = await this.tenantRepository.findById(dto.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(dto.tenantId);
    }

    const role = dto.role ?? UserRole.BUSINESS_OWNER;
    const email = dto.email.trim().toLowerCase();

    // Accepting the invitation would create a SECOND account for the same
    // person in the same workspace — `LoginUseCase` looks accounts up by
    // (email, tenantId), so the two would be indistinguishable at the login
    // form. Someone already inside the workspace is promoted instead, which
    // is what `UpdateUserRoleUseCase` is for.
    const existing = await this.userRepository.findByEmail(email, dto.tenantId);
    if (existing && !existing.deletedAt) {
      throw new UserAlreadyInWorkspaceError(email);
    }

    const pending = await this.invitationRepository.findByTenantId(dto.tenantId);
    if (pending.some((i) => i.email.toLowerCase() === email && !i.isAccepted() && !i.isExpired())) {
      throw new InvitationAlreadyPendingError(email);
    }

    const invitation = Invitation.create({
      id: uuidv4(),
      tenantId: dto.tenantId,
      email,
      role,
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      acceptedAt: null,
      warehouseId: null,
      // The Platform Admin, so "your invitation was accepted" reaches the
      // person who actually sent it rather than the workspace's owners.
      invitedByUserId: dto.callerId,
    });

    await this.invitationRepository.create(invitation);

    await this.auditLogger.record({
      actorUserId: dto.callerId,
      actorRole: dto.callerRole,
      action: 'USER_INVITED',
      targetType: 'INVITATION',
      targetId: invitation.id,
      tenantId: dto.tenantId,
      metadata: { email, role, invitedBy: 'PLATFORM_ADMIN' },
    });

    // Best-effort and unawaited, matching `InviteStaffUseCase`: the invitation
    // row is the record that matters, and a slow mail provider must not turn a
    // created invitation into a failed request. The token is returned so the
    // console can surface the link if the mail never lands.
    this.emailSender.sendInvitationEmail(email, invitation.token, tenant.name).catch((err) => {
      console.error('Failed to send platform invitation email in background:', err);
    });

    return { email, role, token: invitation.token };
  }
}
