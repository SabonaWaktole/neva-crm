import { Router } from 'express';
import { InventoryController } from './inventoryController';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../main/interfaces/http/middlewares/authorize';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export const createInventoryRouter = (
  controller: InventoryController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
) => {
  const router = Router({ mergeParams: true });

  // Apply authentication and tenant scoping to all inventory routes
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  // Products
  router.get('/products', controller.searchProducts);
  router.post('/products', controller.createProduct);
  router.put('/products/:id', controller.updateProduct);
  router.get('/products/:id/stock-breakdown', controller.getProductBreakdown);
  router.post('/products/:id/adjust', controller.adjustStock);
  router.post('/products/:id/transfer', controller.transferStock);

  // Warehouses
  router.get('/warehouses', authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]), controller.getWarehouses);
  router.post('/warehouses', authorize([UserRole.BUSINESS_OWNER]), controller.createWarehouse);
  router.put('/warehouses/:id', authorize([UserRole.BUSINESS_OWNER]), controller.updateWarehouse);
  router.delete('/warehouses/:id', authorize([UserRole.BUSINESS_OWNER]), controller.deleteWarehouse);

  // Categories
  router.get('/categories', controller.getCategories);
  router.post('/categories', controller.createCategory);
  router.put('/categories/:id', controller.updateCategory);
  router.delete('/categories/:id', controller.deleteCategory);

  return router;
};
