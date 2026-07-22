import { Request, Response } from 'express';
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
    private updateUserRoleUseCase: UpdateUserRoleUseCase
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
      const result = await this.loginUseCase.execute({ ...req.body, tenantSlug: req.tenant!.urlSlug });
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
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      const user = await this.getUserProfileUseCase.execute(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
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
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  inviteStaff = async (req: Request, res: Response) => {
    try {
      const tenant = await this.tenantRepository.findById(req.tenant!.id);
      const result = await this.inviteStaffUseCase.execute({
        invitingUserId: req.user!.userId,
        invitingUserRole: req.user!.role,
        tenantId: req.tenant!.id,
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
        tenantId: req.tenant!.id,
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
        tenantId: req.tenant!.id,
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
      const result = await this.getTenantStaffUseCase.execute({ tenantId: req.tenant!.id });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };

  getPendingInvitations = async (req: Request, res: Response, next: Function) => {
    try {
      const result = await this.getPendingInvitationsUseCase.execute({
        tenantId: req.tenant!.id,
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
}
