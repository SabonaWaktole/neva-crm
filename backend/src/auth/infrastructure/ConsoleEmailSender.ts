import { IEmailSender } from '@auth/application/ports/IEmailSender';

export class ConsoleEmailSender implements IEmailSender {
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    console.log(`[EMAIL] To: ${to} | Password Reset Token: ${token}`);
  }

  async sendInvitationEmail(to: string, token: string, tenantName: string): Promise<void> {
    console.log(`[EMAIL] To: ${to} | You are invited to join ${tenantName} | Token: ${token}`);
  }
}
