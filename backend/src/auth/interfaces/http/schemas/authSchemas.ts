import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    companyName: z.string().min(1),
    urlSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    ownerEmail: z.string().email(),
    ownerPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    locale: z.string().optional().default('en'),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  inviteStaff: z.object({
    email: z.string().email(),
    role: z.enum(['STAFF', 'BUSINESS_OWNER']),
  }),
  acceptInvitation: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  }),
  requestPasswordReset: z.object({
    email: z.string().email(),
  }),
  resetPassword: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  }),
};
