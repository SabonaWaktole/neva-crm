import { Request } from 'express';

/**
 * The single source of truth for "which tenant is this request operating on".
 *
 * Always the tenant resolved from the URL slug by the resolveTenant middleware,
 * never req.user.tenantId from the JWT. Those agree for any normal tenant user,
 * but diverge for SUPER_ADMIN (whose tenantId is null), and that divergence was
 * the source of the null-dereference 500s this replaces.
 *
 * Using the URL-resolved value also means controllers read exactly the value
 * that resolveTenant authorized, so there is no second, unverified path to a
 * tenant id.
 *
 * req.tenant is optional on the Express Request type because resolveTenant
 * calls next() without setting it on routes that have no :tenantSlug param.
 * That is honest typing, so this throws rather than asserting non-null: if it
 * ever fires it means a tenant-scoped route was mounted without resolveTenant,
 * which is a wiring bug that should surface loudly as a 500 in the logs rather
 * than silently pass `undefined` into a database query as a tenant filter.
 */
export function requireTenant(
  req: Request
): { id: string; urlSlug: string; timezone: string } {
  const tenant = req.tenant;
  if (!tenant?.id) {
    throw new Error(
      'Tenant context is missing. A tenant-scoped route was reached without the ' +
        'resolveTenant middleware having run.'
    );
  }
  return tenant;
}

export function requireTenantId(req: Request): string {
  return requireTenant(req).id;
}
