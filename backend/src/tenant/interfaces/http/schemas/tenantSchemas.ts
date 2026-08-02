import { z } from 'zod';

export const tenantSchemas = {
  /**
   * Super Admin provisioning a workspace on a business's behalf.
   *
   * Deliberately the same field names and the same rules as
   * `authSchemas.register`, because both feed the same
   * `CreateTenantWithOwnerUseCase`. Two schemas that disagreed about what a
   * valid slug or password is would mean a workspace an admin can create but
   * its owner could never have registered, or vice versa.
   *
   * The password rules in particular are NOT relaxed for the admin path. An
   * admin-set password is a real credential the owner will log in with, so it
   * gets the same floor as a self-chosen one.
   */
  createTenant: z.object({
    companyName: z.string().min(1),
    urlSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    ownerEmail: z.string().email(),
    ownerPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  }),

  /**
   * Super Admin creating a user inside an existing workspace, from the platform
   * console rather than from inside that workspace.
   *
   * `SUPER_ADMIN` is absent from the role enum on purpose, and not only as
   * defence in depth: the platform role belongs to no workspace, so creating one
   * "in" a tenant is not a request that can be honoured. `CreateUserUseCase`
   * rejects it too, for callers that never pass through this schema.
   */
  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    role: z.enum(['STAFF', 'BUSINESS_OWNER']),
    firstName: z.string().min(1).optional().nullable(),
    lastName: z.string().min(1).optional().nullable(),
    phone: z.string().optional().nullable(),
    warehouseId: z.string().optional().nullable(),
  }),
};
