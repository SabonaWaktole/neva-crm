import { IEmailSender } from '../application/ports/IEmailSender';
import { Resend } from 'resend';

export class ResendEmailSender implements IEmailSender {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendInvitationEmail(to: string, token: string, tenantName: string): Promise<void> {
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitations/accept?token=${token}&email=${encodeURIComponent(to)}`;
    
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: `You have been invited to join ${tenantName} on NevaCRM`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Invitation to join ${tenantName}</h2>
            <p>You have been invited to join ${tenantName} on NevaCRM as a team member.</p>
            <p>Please click the button below to accept the invitation and set up your account password.</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Accept Invitation</a>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`Invitation email sent successfully to ${to} via Resend`);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
    
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: 'Reset Your Password - NevaCRM',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
          </div>
        `,
      });
      console.log(`Password reset email sent successfully to ${to} via Resend`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
