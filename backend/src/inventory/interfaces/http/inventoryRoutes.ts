import { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import { InventoryController } from './inventoryController';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../main/interfaces/http/middlewares/authorize';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES } from '../../../media/MediaService';
import { MAX_IMAGES_PER_PRODUCT } from '../../application/use-cases/ManageProductImagesUseCase';

/**
 * Product photos are buffered in memory and re-encoded by sharp before
 * anything touches disk, exactly as profile and branding uploads are. The
 * per-file cap keeps that safe even with a full batch in flight.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_IMAGES_PER_PRODUCT },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME.includes(file.mimetype)) {
      cb(new Error('UNSUPPORTED_TYPE'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Multer reports "too large" and "wrong type" as thrown errors. Translating
 * them here means the uploader can tell the user *why* a file was refused
 * instead of showing a generic failure.
 */
const receiveImages = (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', MAX_IMAGES_PER_PRODUCT)(req, res, (err: any) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `Each image must be smaller than ${Math.round(
          MAX_UPLOAD_BYTES / 1024 / 1024
        )} MB. Try a smaller file.`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `You can upload at most ${MAX_IMAGES_PER_PRODUCT} images at a time.`,
      });
    }
    if (err.message === 'UNSUPPORTED_TYPE') {
      return res.status(415).json({
        error: 'Unsupported format. Use a JPEG, PNG, WebP, GIF or AVIF image.',
      });
    }
    return res.status(400).json({ error: 'That upload could not be read.' });
  });
};

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
  // Registered before '/products/:id' so 'facets' and 'bulk' are never read
  // as product ids.
  router.get('/products/facets', controller.getProductFacets);
  router.post('/products', controller.createProduct);
  router.post('/products/bulk', authorize([UserRole.BUSINESS_OWNER]), controller.bulkUpdateProducts);
  router.get('/products/:id', controller.getProduct);
  router.put('/products/:id', controller.updateProduct);
  router.delete('/products/:id', authorize([UserRole.BUSINESS_OWNER]), controller.deleteProduct);
  router.get('/products/:id/stock-breakdown', controller.getProductBreakdown);
  router.post('/products/:id/adjust', controller.adjustStock);
  router.post('/products/:id/transfer', controller.transferStock);

  // Product images
  router.post('/products/:id/images', receiveImages, controller.uploadProductImages);
  router.put('/products/:id/images/order', controller.reorderProductImages);
  router.delete('/products/:id/images/:imageId', controller.deleteProductImage);

  // Warehouses
  router.get('/warehouses', authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]), controller.getWarehouses);
  router.post('/warehouses', authorize([UserRole.BUSINESS_OWNER]), controller.createWarehouse);
  router.put('/warehouses/:id', authorize([UserRole.BUSINESS_OWNER]), controller.updateWarehouse);
  router.delete('/warehouses/:id', authorize([UserRole.BUSINESS_OWNER]), controller.deleteWarehouse);

  // Categories
  router.get('/categories', authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]), controller.getCategories);
  router.post('/categories', authorize([UserRole.BUSINESS_OWNER]), controller.createCategory);
  router.get('/categories/cleanup/preview', authorize([UserRole.BUSINESS_OWNER]), controller.previewCategoryCleanup);
  router.post('/categories/cleanup', authorize([UserRole.BUSINESS_OWNER]), controller.cleanupCategories);
  router.put('/categories/:id', authorize([UserRole.BUSINESS_OWNER]), controller.updateCategory);
  router.delete('/categories/:id', authorize([UserRole.BUSINESS_OWNER]), controller.deleteCategory);

  return router;
};
