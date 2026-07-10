import { NextFunction, Request, Response } from 'express';
import { ITenantRepository } from '../../../../tenant/domain/repositories/ITenantRepository';
import { UserRole } from '../../../../auth/domain/enums/UserRole';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
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

    if (req.user) {
      if (req.user.role !== UserRole.SUPER_ADMIN && req.user.tenantId !== tenant.id) {
        return res.status(403).json({ error: 'Cross-tenant access forbidden' });
      }
    }

    req.tenant = { id: tenant.id };
    next();
  };
};
