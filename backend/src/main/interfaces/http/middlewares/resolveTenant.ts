import { NextFunction, Request, Response } from 'express';
import { ITenantRepository } from '../../../../tenant/domain/repositories/ITenantRepository';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        urlSlug: string;
      };
    }
  }
}

export const resolveTenant = (tenantRepository: ITenantRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { tenantSlug } = req.params;

    if (!tenantSlug) {
      return next();
    }

    const tenant = await tenantRepository.findBySlug(tenantSlug as string);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Tenant scoping is absolute: membership of the tenant named in the URL is
    // the only thing that grants access, with no role-based exemption.
    //
    // SUPER_ADMIN is deliberately NOT exempt. It is a platform-level role that
    // administers tenants themselves (e.g. GET /api/tenants), never an
    // individual business's operational data. Its tenantId is null, so the
    // previous exemption let it past this check and straight into controllers
    // that then dereferenced that null — producing 500s rather than either
    // serving data or denying access. It was an accident, not a control.
    if (req.user && req.user.tenantId !== tenant.id) {
      return res.status(403).json({ error: 'Cross-tenant access forbidden' });
    }

    req.tenant = { id: tenant.id, urlSlug: tenant.urlSlug };
    next();
  };
};
