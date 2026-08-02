import type { APIRequestContext } from '@playwright/test';

export const API_BASE = 'http://localhost:3000/api';

/**
 * Credentials of the seeded platform administrator.
 *
 * Must match what `backend/scratch/seed-super-admin.ts` created against the
 * database these tests run on. Overridable so CI can seed its own.
 */
export const SUPER_ADMIN = {
  email: process.env.E2E_SUPER_ADMIN_EMAIL ?? 'sebonawaktole@gmail.com',
  password: process.env.E2E_SUPER_ADMIN_PASSWORD ?? 'S@b0n@W@',
};

export interface ProvisionedTenant {
  tenantSlug: string;
  ownerEmail: string;
  ownerPassword: string;
}

/**
 * Creates a workspace and its first Business Owner for a test to use.
 *
 * These specs used to POST /api/auth/register, the public self-signup route.
 * That route no longer exists — a workspace is provisioned only by a platform
 * administrator — so this signs in as one first. The extra login is the cost of
 * the tests exercising the same path a real operator now takes.
 *
 * Requires the super admin to have been seeded: `npm run seed:superadmin` in
 * backend/, against the database the API under test is pointed at.
 */
export async function provisionTenant(
  request: APIRequestContext,
  options: { namePrefix: string }
): Promise<ProvisionedTenant> {
  const stamp = Date.now();
  const tenantSlug = `${options.namePrefix}-${stamp}`;
  const ownerEmail = `owner-${stamp}@e2e.test`;
  const ownerPassword = 'Password123!';

  const login = await request.post(`${API_BASE}/auth/login`, { data: SUPER_ADMIN });
  if (!login.ok()) {
    throw new Error(
      `Could not sign in as the platform administrator (${login.status()}). ` +
        `Run "npm run seed:superadmin" in backend/ against the API's database.`
    );
  }

  // The session cookie set above rides on the request context, so this call is
  // already authenticated as SUPER_ADMIN.
  const created = await request.post(`${API_BASE}/tenants`, {
    data: {
      companyName: `${options.namePrefix} ${stamp}`,
      urlSlug: tenantSlug,
      ownerEmail,
      ownerPassword,
    },
  });
  if (!created.ok()) {
    throw new Error(`Could not provision workspace ${tenantSlug} (${created.status()}).`);
  }

  return { tenantSlug, ownerEmail, ownerPassword };
}
