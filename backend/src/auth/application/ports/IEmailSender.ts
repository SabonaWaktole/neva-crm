export interface IEmailSender {
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendInvitationEmail(to: string, token: string, tenantName: string): Promise<void>;
}
