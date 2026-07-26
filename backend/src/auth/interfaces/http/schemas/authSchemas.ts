import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    companyName: z.string().min(1),
    urlSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    ownerEmail: z.string().email(),
    ownerPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    // `locale` used to be accepted here and then silently dropped:
    // RegisterBusinessOwnerUseCase never read it, and Tenant.create had nowhere
    // to put it. The onboarding form was also sending region codes (us/uk/eu)
    // against a schema defaulting to a language tag ('en'), so the two ends did
    // not even agree on a vocabulary. Locale is now set from Settings, where it
    // is validated against a real supported list.
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  inviteStaff: z.object({
    email: z.string().email(),
    role: z.enum(['STAFF', 'BUSINESS_OWNER']),
    warehouseId: z.string().optional().nullable(),
  }),
  updateStaffRole: z.object({
    role: z.enum(['STAFF', 'BUSINESS_OWNER']),
    warehouseId: z.string().optional().nullable(),
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
  updateProfile: z.object({
    firstName: z.string().min(1).optional().nullable(),
    lastName: z.string().min(1).optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional(),
  }),
};
