import { Request, Response } from 'express';
import { RegisterBusinessOwnerUseCase } from '@auth/application/use-cases/RegisterBusinessOwnerUseCase';
import { LoginUseCase } from '@auth/application/use-cases/LoginUseCase';
import { InviteStaffUseCase } from '@auth/application/use-cases/InviteStaffUseCase';
import { AcceptInvitationUseCase } from '@auth/application/use-cases/AcceptInvitationUseCase';
import { RequestPasswordResetUseCase } from '@auth/application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@auth/application/use-cases/ResetPasswordUseCase';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';

export class AuthController {
  constructor(
    private registerUseCase: RegisterBusinessOwnerUseCase,
    private loginUseCase: LoginUseCase,
    private inviteStaffUseCase: InviteStaffUseCase,
    private acceptInvitationUseCase: AcceptInvitationUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private tenantRepository: ITenantRepository
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
      res.status(200).json({ message: 'Login successful', token: result.token });
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
    // We can just return the decoded token data which has userId, role, tenantId
    res.status(200).json({ user: req.user });
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
        tenantName: tenant!.name,
      });
      res.status(200).json({ message: 'Invitation sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  acceptInvitation = async (req: Request, res: Response) => {
    try {
      await this.acceptInvitationUseCase.execute(req.body);
      res.status(200).json({ message: 'Invitation accepted successfully' });
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
}
