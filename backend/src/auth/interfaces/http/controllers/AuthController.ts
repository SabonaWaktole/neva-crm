import { Request, Response } from 'express';
import { requireTenant, requireTenantId } from "@main/interfaces/http/tenantContext";
import { RegisterBusinessOwnerUseCase } from '@auth/application/use-cases/RegisterBusinessOwnerUseCase';
import { LoginUseCase } from '@auth/application/use-cases/LoginUseCase';
import { InviteStaffUseCase } from '@auth/application/use-cases/InviteStaffUseCase';
import { AcceptInvitationUseCase } from '@auth/application/use-cases/AcceptInvitationUseCase';
import { RequestPasswordResetUseCase } from '@auth/application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@auth/application/use-cases/ResetPasswordUseCase';
import { GetTenantStaffUseCase } from '@auth/application/use-cases/GetTenantStaffUseCase';
import { GetPendingInvitationsUseCase } from '@auth/application/use-cases/GetPendingInvitationsUseCase';
import { UpdateUserProfileUseCase } from '@auth/application/use-cases/UpdateUserProfileUseCase';
import { GetUserProfileUseCase } from '@auth/application/use-cases/GetUserProfileUseCase';
import { UpdateUserRoleUseCase } from '@auth/application/use-cases/UpdateUserRoleUseCase';
import { CancelInvitationUseCase } from '@auth/application/use-cases/CancelInvitationUseCase';
import { ReactivateUserUseCase } from '../../../application/use-cases/ReactivateUserUseCase';
import { DeactivateUserUseCase } from '@auth/application/use-cases/DeactivateUserUseCase';
import { GetDeactivationImpactUseCase } from '@auth/application/use-cases/GetDeactivationImpactUseCase';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { UserRole } from '@auth/domain/enums/UserRole';
export class AuthController {
  constructor(
    private registerUseCase: RegisterBusinessOwnerUseCase,
    private loginUseCase: LoginUseCase,
    private inviteStaffUseCase: InviteStaffUseCase,
    private acceptInvitationUseCase: AcceptInvitationUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private tenantRepository: ITenantRepository,
    private getTenantStaffUseCase: GetTenantStaffUseCase,
    private getPendingInvitationsUseCase: GetPendingInvitationsUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserRoleUseCase: UpdateUserRoleUseCase,
    private cancelInvitationUseCase?: CancelInvitationUseCase,
    private deactivateUserUseCase?: DeactivateUserUseCase,
    private getDeactivationImpactUseCase?: GetDeactivationImpactUseCase,
    private reactivateUserUseCase?: ReactivateUserUseCase
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.registerUseCase.execute(req.body);
      
      // Auto-login after registration could happen here if use case returns token.
      // But currently RegisterBusinessOwnerUseCase doesn't return a token.
      // Let's just return success for now.
      res.status(201).json({ message: 'Registration successful', tenantSlug: result.tenant.urlSlug });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  loginTenant = async (req: Request, res: Response) => {
    try {
      const result = await this.loginUseCase.execute({ ...req.body, tenantSlug: requireTenant(req).urlSlug });
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      res.status(200).json({ message: 'Login successful', token: result.token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  loginGlobal = async (req: Request, res: Response) => {
    try {
      const result = await this.loginUseCase.execute({ ...req.body, tenantSlug: null });
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      res.status(200).json({ message: 'Login successful', token: result.token, tenantSlug: result.tenantSlug });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie('jwt');
    res.status(200).json({ message: 'Logged out successfully' });
  };

  getMe = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(200).json({ user: null });
    }
    try {
      const user = await this.getUserProfileUseCase.execute(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Session bootstrap is the one authenticated path that re-reads the user,
      // so it is where a deactivated account can still be caught. The
      // authenticate middleware only verifies the JWT signature and never hits
      // the database, so an already-issued token keeps working against other
      // endpoints until it expires (JWT_EXPIRATION, currently 1h). Rejecting
      // here drops the browser session on the next load; it is a practical
      // shortening of exposure, not true revocation. See TD-010.
      if (!user.isActive) {
        res.clearCookie('jwt');
        return res.status(401).json({ error: 'This account has been deactivated.' });
      }

      // Media URLs are read straight from Prisma rather than through the User
      // entity: they are presentation-only strings with no domain behaviour,
      // and threading them through the entity would mean touching its
      // constructor and every repository mapping for no benefit.
      //
      // The tenant's branding is returned on the same call so the sidebar and
      // header can render the workspace logo without a second round trip.
      const { prisma } = require('../../../../shared/infrastructure/prisma/client');
      const [media, tenantBranding] = await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: { avatarUrl: true, coverImageUrl: true },
        }),
        user.tenantId
          ? prisma.tenant.findUnique({
              where: { id: user.tenantId },
              // currency and locale ride along with the branding for the same
              // reason: the money formatter is used on nearly every page, and
              // making each one fetch settings separately would be a round trip
              // per page for two short strings.
              select: {
                logoUrl: true, coverImageUrl: true, name: true,
                currency: true, locale: true, defaultLanguage: true,
                timezone: true, dateFormat: true,
              },
            })
          : Promise.resolve(null),
      ]);

      res.status(200).json({
        user: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: req.user.tenantSlug,
          warehouseId: user.warehouseId,
          avatarUrl: media?.avatarUrl ?? null,
          coverImageUrl: media?.coverImageUrl ?? null,
          tenantName: tenantBranding?.name ?? null,
          tenantLogoUrl: tenantBranding?.logoUrl ?? null,
          tenantCoverImageUrl: tenantBranding?.coverImageUrl ?? null,
          // Null only for SUPER_ADMIN, who has no tenant. Every tenant row has
          // these columns NOT NULL, so a tenanted user always gets real values.
          tenantCurrency: tenantBranding?.currency ?? null,
          tenantLocale: tenantBranding?.locale ?? null,
          tenantTimezone: tenantBranding?.timezone ?? null,
          tenantDateFormat: tenantBranding?.dateFormat ?? null,
          // Interface language, kept separate from the formatting fields above.
          // `userLanguage` is null when the user follows the workspace default;
          // the client needs the raw value, not just the resolved one, so the
          // settings UI can show "Follow company default" as selected.
          userLanguage: user.language ?? null,
          tenantDefaultLanguage: tenantBranding?.defaultLanguage ?? null,
        }
      });
    } catch (error: any) {
      // Log internally; never return the raw message to the client.
      console.error('GET /auth/me failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  inviteStaff = async (req: Request, res: Response) => {
    try {
      const tenant = await this.tenantRepository.findById(requireTenantId(req));
      const result = await this.inviteStaffUseCase.execute({
        invitingUserId: req.user!.userId,
        invitingUserRole: req.user!.role,
        tenantId: requireTenantId(req),
        inviteeEmail: req.body.email,
        role: req.body.role,
        warehouseId: req.body.warehouseId,
        tenantName: tenant!.name,
      });
      res.status(200).json({ message: 'Invitation sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateStaffRole = async (req: Request, res: Response) => {
    try {
      await this.updateUserRoleUseCase.execute({
        invitingUserRole: req.user!.role as any,
        tenantId: requireTenantId(req),
        userIdToUpdate: req.params.id as string,
        newRole: req.body.role,
        newWarehouseId: req.body.warehouseId,
      });
      res.status(200).json({ message: 'User role and permissions updated' });
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  getDeactivationImpact = async (req: Request, res: Response) => {
    try {
      const impact = await this.getDeactivationImpactUseCase!.execute({
        requestingUserRole: req.user!.role,
        tenantId: requireTenantId(req),
        userId: req.params.id as string,
      });
      res.status(200).json(impact);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  deactivateStaff = async (req: Request, res: Response) => {
    try {
      await this.deactivateUserUseCase!.execute({
        requestingUserRole: req.user!.role,
        requestingUserId: req.user!.userId,
        tenantId: requireTenantId(req),
        userIdToDeactivate: req.params.id as string,
      });
      res.status(200).json({ message: 'Team member deactivated' });
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  reactivateStaff = async (req: Request, res: Response) => {
    try {
      await this.reactivateUserUseCase!.execute({
        requestingUserRole: req.user!.role,
        tenantId: requireTenantId(req),
        userIdToReactivate: req.params.id as string,
      });
      res.status(200).json({ message: 'Team member reactivated' });
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  acceptInvitation = async (req: Request, res: Response) => {
    try {
      const result = await this.acceptInvitationUseCase.execute(req.body);
      res.status(200).json({ message: 'Invitation accepted successfully', tenantSlug: result.tenantSlug });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      await this.requestPasswordResetUseCase.execute({
        email: req.body.email,
        tenantId: requireTenantId(req),
      });
      res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      await this.resetPasswordUseCase.execute(req.body);
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getTenantStaff = async (req: Request, res: Response, next: Function) => {
    try {
      const result = await this.getTenantStaffUseCase.execute({ tenantId: requireTenantId(req) });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };

  getPendingInvitations = async (req: Request, res: Response, next: Function) => {
    try {
      const result = await this.getPendingInvitationsUseCase.execute({
        tenantId: requireTenantId(req),
        requestingUserRole: req.user!.role as UserRole,
      });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };
  updateMe = async (req: Request, res: Response, next: any) => {
    try {
      await this.updateUserProfileUseCase.execute({
        userId: req.user!.userId,
        requestingUserId: req.user!.userId,
        requestingUserRole: req.user!.role as UserRole,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        language: req.body.language,
      });
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error: any) {
      if (error.name === 'UnauthorizedError') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  cancelInvitation = async (req: Request, res: Response, next: any) => {
    try {
      if (this.cancelInvitationUseCase) {
        await this.cancelInvitationUseCase.execute({
          invitationId: req.params.id as string,
          requestingUserRole: req.user!.role,
        });
      }
      res.status(200).json({ message: 'Invitation canceled successfully' });
    } catch (error: any) {
      next(error);
    }
  };
}
