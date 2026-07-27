import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from '@main/interfaces/http/middlewares/errorHandler';
// Removed createAuthRoutes import
import { AuthController } from '@auth/interfaces/http/controllers/AuthController';
import { RegisterBusinessOwnerUseCase } from '@auth/application/use-cases/RegisterBusinessOwnerUseCase';
import { LoginUseCase } from '@auth/application/use-cases/LoginUseCase';
import { InviteStaffUseCase } from '@auth/application/use-cases/InviteStaffUseCase';
import { AcceptInvitationUseCase } from '@auth/application/use-cases/AcceptInvitationUseCase';
import { RequestPasswordResetUseCase } from '@auth/application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@auth/application/use-cases/ResetPasswordUseCase';
import { GetTenantStaffUseCase } from '@auth/application/use-cases/GetTenantStaffUseCase';
import { GetPendingInvitationsUseCase } from '@auth/application/use-cases/GetPendingInvitationsUseCase';
import { UpdateUserProfileUseCase } from '@auth/application/use-cases/UpdateUserProfileUseCase';
import { GetUserProfileUseCase } from '@auth/application/use-cases/GetUserProfileUseCase';
import { UpdateUserRoleUseCase } from '@auth/application/use-cases/UpdateUserRoleUseCase';
import { CancelInvitationUseCase } from '@auth/application/use-cases/CancelInvitationUseCase';
import { ReactivateUserUseCase } from '@auth/application/use-cases/ReactivateUserUseCase';
import { DeactivateUserUseCase } from '@auth/application/use-cases/DeactivateUserUseCase';
import { GetDeactivationImpactUseCase } from '@auth/application/use-cases/GetDeactivationImpactUseCase';
import { PrismaUserRepository } from '@auth/infrastructure/repositories/PrismaUserRepository';
import { PrismaTenantRepository } from '@tenant/infrastructure/repositories/PrismaTenantRepository';
import { PrismaInvitationRepository } from '@auth/infrastructure/repositories/PrismaInvitationRepository';
import { PrismaPasswordResetTokenRepository } from '@auth/infrastructure/repositories/PrismaPasswordResetTokenRepository';
import { BcryptPasswordHasher } from '@auth/infrastructure/BcryptPasswordHasher';
import { JwtTokenService } from '@auth/infrastructure/JwtTokenService';
import { ConsoleEmailSender } from '@auth/infrastructure/ConsoleEmailSender';
import { EmailJsSender } from '@auth/infrastructure/EmailJsSender';
import { PrismaUnitOfWork } from '@shared/infrastructure/prisma/PrismaUnitOfWork';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { IInvitationRepository } from '@auth/domain/repositories/IInvitationRepository';
import { IPasswordResetTokenRepository } from '@auth/domain/repositories/IPasswordResetTokenRepository';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { ITokenService } from '@auth/application/ports/ITokenService';
import { IEmailSender } from '@auth/application/ports/IEmailSender';
import { IUnitOfWork } from '@shared/application/ports/IUnitOfWork';

import { createClientRouter } from '../clients/interfaces/http/routes/clientRoutes';
import { PrismaNotificationRepository } from '../notifications/infrastructure/PrismaNotificationRepository';
import { NotificationService } from '../notifications/application/NotificationService';
import { PrismaQuotationWriteTransaction } from '../quotations/infrastructure/PrismaQuotationWriteTransaction';
import { GetNotificationsUseCase } from '../notifications/application/GetNotificationsUseCase';
import { MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase } from '../notifications/application/MarkNotificationReadUseCase';
import { NotificationController } from '../notifications/interfaces/http/NotificationController';
import { createNotificationRouter } from '../notifications/interfaces/http/notificationRoutes';

export interface AppDependencies {
  userRepository: IUserRepository;
  tenantRepository: ITenantRepository;
  invitationRepository: IInvitationRepository;
  prtRepository: IPasswordResetTokenRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
  emailSender: IEmailSender;
  unitOfWork: IUnitOfWork;
  integrationRepository?: any;
}

export const createApp = (overrides?: Partial<AppDependencies>) => {
  const app = express();
  // Sensible security headers (HSTS, X-Content-Type-Options, frame denial, and
  // referrer policy among others). This is a JSON API, so the default CSP is
  // not load-bearing here; the frontend is served separately.
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://neva-crm.vercel.app',
        process.env.FRONTEND_URL
      ];
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Dependencies — use overrides if provided, otherwise default to real implementations
  const userRepository = overrides?.userRepository ?? new PrismaUserRepository();
  const tenantRepository = overrides?.tenantRepository ?? new PrismaTenantRepository();
  const invitationRepository = overrides?.invitationRepository ?? new PrismaInvitationRepository();
  const prtRepository = overrides?.prtRepository ?? new PrismaPasswordResetTokenRepository();
  const passwordHasher = overrides?.passwordHasher ?? new BcryptPasswordHasher();
  const tokenService = overrides?.tokenService ?? new JwtTokenService();
  const emailSender = overrides?.emailSender ?? new EmailJsSender();
  const unitOfWork = overrides?.unitOfWork ?? new PrismaUnitOfWork();

  // Use Cases
  const registerUseCase = new RegisterBusinessOwnerUseCase(userRepository, tenantRepository, passwordHasher, unitOfWork);
  const loginUseCase = new LoginUseCase(userRepository, tenantRepository, passwordHasher, tokenService);
  const inviteStaffUseCase = new InviteStaffUseCase(invitationRepository, emailSender);
  const notificationRepository = new PrismaNotificationRepository();
  const notificationService = new NotificationService(notificationRepository, userRepository);
  const quotationWriteTx = new PrismaQuotationWriteTransaction();
  const acceptInvitationUseCase = new AcceptInvitationUseCase(invitationRepository, userRepository, passwordHasher, tenantRepository, notificationService);
  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository, prtRepository, emailSender);
  const resetPasswordUseCase = new ResetPasswordUseCase(prtRepository, userRepository, passwordHasher);
  const getTenantStaffUseCase = new GetTenantStaffUseCase(userRepository);
  const getPendingInvitationsUseCase = new GetPendingInvitationsUseCase(invitationRepository);
  const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
  const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);
  const cancelInvitationUseCase = new CancelInvitationUseCase(invitationRepository);
  const deactivateUserUseCase = new DeactivateUserUseCase(userRepository);
  const getDeactivationImpactUseCase = new GetDeactivationImpactUseCase(userRepository);
  const reactivateUserUseCase = new ReactivateUserUseCase(userRepository);

  // Controller
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    inviteStaffUseCase,
    acceptInvitationUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
    tenantRepository,
    getTenantStaffUseCase,
    getPendingInvitationsUseCase,
    updateUserProfileUseCase,
    getUserProfileUseCase,
    updateUserRoleUseCase,
    cancelInvitationUseCase,
    deactivateUserUseCase,
    getDeactivationImpactUseCase,
    reactivateUserUseCase
  );

  // Auth Routes
  const { createGlobalAuthRoutes, createTenantAuthRoutes } = require('@auth/interfaces/http/routes/authRoutes');
  const globalAuthRoutes = createGlobalAuthRoutes(authController, tokenService);
  const tenantAuthRoutes = createTenantAuthRoutes(authController, tokenService, tenantRepository);
  
  app.use('/api/auth', globalAuthRoutes);
  app.use('/api/:tenantSlug/auth', tenantAuthRoutes);

  // Client routes require PrismaClient, TokenService, TenantRepository
  const { prisma } = require('@shared/infrastructure/prisma/client');
  const clientRoutes = createClientRouter(prisma, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/clients', clientRoutes);

  // Appointment routes
  const { createAppointmentRouter } = require('../appointments/interfaces/http/routes/appointmentRoutes');
  const appointmentRoutes = createAppointmentRouter(prisma, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/appointments', appointmentRoutes);

  // Tenant Routes
  // NOTE: /api/tenants does NOT have a :tenantSlug prefix because GetTenantsUseCase is a platform-level
  // operation used by SUPER_ADMIN to list all tenants across the system. It is not scoped to a single tenant.
  const { GetTenantsUseCase } = require('../tenant/application/use-cases/GetTenantsUseCase');
  const getTenantsUseCase = new GetTenantsUseCase(tenantRepository);
  const { createTenantRouter } = require('../tenant/interfaces/http/routes/tenantRoutes');
  const tenantRoutes = createTenantRouter(getTenantsUseCase, tokenService);
  app.use('/api/tenants', tenantRoutes);

  // Dashboard Routes
  // NOTE: /api/:tenantSlug/dashboard DOES have a :tenantSlug prefix because dashboard metrics and feeds
  // are inherently tenant-scoped. The middleware ensures data is only returned for the requested tenant.
  const { GetTenantClientMetricsUseCase } = require('../dashboard/application/use-cases/GetTenantClientMetricsUseCase');
  const { GetTenantActivityFeedUseCase } = require('../dashboard/application/use-cases/GetTenantActivityFeedUseCase');
  const { PrismaInteractionRepository } = require('../clients/infrastructure/repositories/PrismaInteractionRepository');
  const { PrismaAppointmentRepository } = require('../appointments/infrastructure/repositories/PrismaAppointmentRepository');
  const { PrismaClientRepository } = require('../clients/infrastructure/repositories/PrismaClientRepository');
  
  // Create the concrete repositories needed for Dashboard
  const prismaClientRepository = new PrismaClientRepository(prisma);
  const interactionRepository = new PrismaInteractionRepository(prisma);
  const appointmentRepository = new PrismaAppointmentRepository(prisma);
  
  const getTenantClientMetricsUseCase = new GetTenantClientMetricsUseCase(prismaClientRepository);
  const getTenantActivityFeedUseCase = new GetTenantActivityFeedUseCase(prismaClientRepository, interactionRepository, appointmentRepository);
  
  const { createDashboardRouter } = require('../dashboard/interfaces/http/routes/dashboardRoutes');
  const dashboardRoutes = createDashboardRouter(getTenantClientMetricsUseCase, getTenantActivityFeedUseCase, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/dashboard', dashboardRoutes);

  // Inventory Routes
  const { PrismaProductRepository } = require('../inventory/infrastructure/repositories/PrismaProductRepository');
  const { PrismaProductImageRepository } = require('../inventory/infrastructure/repositories/PrismaProductImageRepository');
  const { MediaProductImageStorage } = require('../inventory/infrastructure/storage/MediaProductImageStorage');
  const { PrismaWarehouseRepository } = require('../inventory/infrastructure/repositories/PrismaWarehouseRepository');
  const { PrismaCategoryRepository } = require('../inventory/infrastructure/repositories/PrismaCategoryRepository');
  const { PrismaStockLevelRepository } = require('../inventory/infrastructure/repositories/PrismaStockLevelRepository');
  const { PrismaStockMovementRepository } = require('../inventory/infrastructure/repositories/PrismaStockMovementRepository');
  const { PrismaStockTransactionManager } = require('../inventory/infrastructure/repositories/PrismaStockTransactionManager');
  
  const { CreateProductUseCase } = require('../inventory/application/use-cases/CreateProductUseCase');
  const { UpdateProductUseCase } = require('../inventory/application/use-cases/UpdateProductUseCase');
  const { GetProductUseCase } = require('../inventory/application/use-cases/GetProductUseCase');
  const { DeleteProductUseCase } = require('../inventory/application/use-cases/DeleteProductUseCase');
  const { BulkUpdateProductsUseCase } = require('../inventory/application/use-cases/BulkUpdateProductsUseCase');
  const { GetProductFacetsUseCase } = require('../inventory/application/use-cases/GetProductFacetsUseCase');
  const { ManageProductImagesUseCase } = require('../inventory/application/use-cases/ManageProductImagesUseCase');
  const { AdjustStockUseCase } = require('../inventory/application/use-cases/AdjustStockUseCase');
  const { TransferStockUseCase } = require('../inventory/application/use-cases/TransferStockUseCase');
  const { SearchProductsUseCase } = require('../inventory/application/use-cases/SearchProductsUseCase');
  const { GetProductStockBreakdownUseCase } = require('../inventory/application/use-cases/GetProductStockBreakdownUseCase');
  const { CreateWarehouseUseCase } = require('../inventory/application/use-cases/CreateWarehouseUseCase');
  const { UpdateWarehouseUseCase } = require('../inventory/application/use-cases/UpdateWarehouseUseCase');
  const { DeleteWarehouseUseCase } = require('../inventory/application/use-cases/DeleteWarehouseUseCase');
  const { CreateCategoryUseCase } = require('../inventory/application/use-cases/CreateCategoryUseCase');
  const { UpdateCategoryUseCase } = require('../inventory/application/use-cases/UpdateCategoryUseCase');
  const { DeleteCategoryUseCase } = require('../inventory/application/use-cases/DeleteCategoryUseCase');
  const { GetWarehousesUseCase } = require('../inventory/application/use-cases/GetWarehousesUseCase');
  const { GetCategoriesUseCase } = require('../inventory/application/use-cases/GetCategoriesUseCase');
  const { ArchiveUnusedCategoriesUseCase } = require('../inventory/application/use-cases/ArchiveUnusedCategoriesUseCase');
  
  const { InventoryController } = require('../inventory/interfaces/http/inventoryController');
  const { createInventoryRouter } = require('../inventory/interfaces/http/inventoryRoutes');

  const productRepo = new PrismaProductRepository(prisma);
  const productImageRepo = new PrismaProductImageRepository(prisma);
  const productImageStorage = new MediaProductImageStorage();
  const warehouseRepo = new PrismaWarehouseRepository(prisma);
  const categoryRepo = new PrismaCategoryRepository(prisma);
  const stockLevelRepo = new PrismaStockLevelRepository(prisma);
  const stockMovementRepo = new PrismaStockMovementRepository(prisma);
  const stockTxManager = new PrismaStockTransactionManager(prisma);

  // Bulk delete reuses the single delete, so it gets the same instance rather
  // than a second copy with its own idea of what deleting means.
  const deleteProductUseCase = new DeleteProductUseCase(
    productRepo,
    productImageRepo,
    productImageStorage
  );

  const inventoryController = new InventoryController({
    createProductUseCase: new CreateProductUseCase(productRepo, warehouseRepo, stockTxManager),
    updateProductUseCase: new UpdateProductUseCase(productRepo),
    getProductUseCase: new GetProductUseCase(productRepo),
    deleteProductUseCase,
    bulkUpdateProductsUseCase: new BulkUpdateProductsUseCase(productRepo, deleteProductUseCase),
    getProductFacetsUseCase: new GetProductFacetsUseCase(productRepo),
    manageProductImagesUseCase: new ManageProductImagesUseCase(
      productRepo,
      productImageRepo,
      productImageStorage
    ),
    adjustStockUseCase: new AdjustStockUseCase(stockLevelRepo, stockMovementRepo),
    transferStockUseCase: new TransferStockUseCase(stockLevelRepo, stockTxManager),
    searchProductsUseCase: new SearchProductsUseCase(productRepo),
    getProductStockBreakdownUseCase: new GetProductStockBreakdownUseCase(productRepo, stockLevelRepo),
    createWarehouseUseCase: new CreateWarehouseUseCase(warehouseRepo),
    updateWarehouseUseCase: new UpdateWarehouseUseCase(warehouseRepo),
    deleteWarehouseUseCase: new DeleteWarehouseUseCase(warehouseRepo, stockLevelRepo),
    getWarehousesUseCase: new GetWarehousesUseCase(warehouseRepo),
    createCategoryUseCase: new CreateCategoryUseCase(categoryRepo),
    updateCategoryUseCase: new UpdateCategoryUseCase(categoryRepo),
    deleteCategoryUseCase: new DeleteCategoryUseCase(categoryRepo, productRepo),
    getCategoriesUseCase: new GetCategoriesUseCase(categoryRepo),
    archiveUnusedCategoriesUseCase: new ArchiveUnusedCategoriesUseCase(categoryRepo),
  });

  const inventoryRoutes = createInventoryRouter(inventoryController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/inventory', inventoryRoutes);

  // Quotations Routes
  const { PrismaQuotationRepository } = require('../quotations/infrastructure/repositories/PrismaQuotationRepository');
  const { PrismaQuotationLineItemRepository } = require('../quotations/infrastructure/repositories/PrismaQuotationLineItemRepository');
  const { PrismaQuotationStatusHistoryRepository } = require('../quotations/infrastructure/repositories/PrismaQuotationStatusHistoryRepository');
  
  const { CreateQuotationUseCase } = require('../quotations/application/use-cases/CreateQuotationUseCase');
  const { UpdateQuotationUseCase } = require('../quotations/application/use-cases/UpdateQuotationUseCase');
  const { SubmitQuotationUseCase } = require('../quotations/application/use-cases/SubmitQuotationUseCase');
  const { ApproveQuotationUseCase } = require('../quotations/application/use-cases/ApproveQuotationUseCase');
  const { ReturnQuotationToDraftUseCase } = require('../quotations/application/use-cases/ReturnQuotationToDraftUseCase');
  const { MarkQuotationAcceptedUseCase } = require('../quotations/application/use-cases/MarkQuotationAcceptedUseCase');
  const { MarkQuotationRejectedUseCase } = require('../quotations/application/use-cases/MarkQuotationRejectedUseCase');
  const { ExpireQuotationUseCase } = require('../quotations/application/use-cases/ExpireQuotationUseCase');
  const { SearchQuotationsUseCase } = require('../quotations/application/use-cases/SearchQuotationsUseCase');
  const { GetQuotationDetailUseCase } = require('../quotations/application/use-cases/GetQuotationDetailUseCase');
  const { GetPendingApprovalsUseCase } = require('../quotations/application/use-cases/GetPendingApprovalsUseCase');
  
  const { QuotationsController } = require('../quotations/interfaces/http/QuotationsController');
  const { createQuotationRouter } = require('../quotations/interfaces/http/quotationRoutes');
  const { SettingsService } = require('../settings/SettingsService');

  const quotationRepo = new PrismaQuotationRepository(prisma);
  const quotationLineItemRepo = new PrismaQuotationLineItemRepository(prisma);
  const quotationHistoryRepo = new PrismaQuotationStatusHistoryRepository(prisma);
  
  const settingsService = new SettingsService(tenantRepository);

  const quotationsController = new QuotationsController(
    new CreateQuotationUseCase(quotationRepo, quotationLineItemRepo, quotationHistoryRepo, prismaClientRepository, productRepo, warehouseRepo),
    new UpdateQuotationUseCase(quotationRepo, quotationLineItemRepo, productRepo, warehouseRepo),
    new SubmitQuotationUseCase(quotationWriteTx, userRepository),
    new ApproveQuotationUseCase(quotationWriteTx, userRepository),
    new ReturnQuotationToDraftUseCase(quotationWriteTx, userRepository),
    new MarkQuotationAcceptedUseCase(quotationRepo, quotationLineItemRepo, quotationHistoryRepo, stockLevelRepo, stockTxManager, quotationWriteTx, userRepository),
    new MarkQuotationRejectedUseCase(quotationWriteTx, userRepository),
    new ExpireQuotationUseCase(quotationWriteTx, userRepository),
    new SearchQuotationsUseCase(quotationRepo),
    new GetQuotationDetailUseCase(quotationRepo, quotationLineItemRepo, quotationHistoryRepo),
    new GetPendingApprovalsUseCase(quotationRepo),
    settingsService
  );

  const quotationRoutes = createQuotationRouter(quotationsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/quotations', quotationRoutes);

  // Media Routes (profile photos + workspace branding)
  const { MediaController } = require('../media/interfaces/http/MediaController');
  const { createMediaRouter } = require('../media/interfaces/http/mediaRoutes');
  const { UPLOADS_DIR } = require('../media/MediaService');

  const mediaController = new MediaController();
  const mediaRoutes = createMediaRouter(mediaController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/media', mediaRoutes);

  // Serve stored images. Filenames contain a UUID and are never reused, so a
  // long immutable cache is safe — replacing an image yields a new URL.
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '1y',
      immutable: true,
      // These are user-supplied files; never let the browser sniff a
      // different content type out of one.
      setHeaders: (res: any) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    })
  );

  // Settings Routes
  const { SettingsController } = require('../settings/interfaces/http/SettingsController');
  const { createSettingsRouter } = require('../settings/interfaces/http/settingsRoutes');
  
  const { TenantProfileStore } = require('../settings/infrastructure/TenantProfileStore');
  const { UpdateTenantSettingsUseCase } = require('../settings/application/use-cases/UpdateTenantSettingsUseCase');

  const tenantProfileStore = new TenantProfileStore();
  const updateTenantSettingsUseCase = new UpdateTenantSettingsUseCase(tenantRepository, tenantProfileStore);
  const settingsController = new SettingsController(tenantRepository, tenantProfileStore, updateTenantSettingsUseCase);
  const settingsRoutes = createSettingsRouter(settingsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/settings', settingsRoutes);

  // Integrations Routes
  const { PrismaIntegrationRepository } = require('../integrations/infrastructure/repositories/PrismaIntegrationRepository');
  const { GetIntegrationsUseCase } = require('../integrations/application/use-cases/GetIntegrationsUseCase');
  const { ConnectIntegrationUseCase } = require('../integrations/application/use-cases/ConnectIntegrationUseCase');
  const { DisconnectIntegrationUseCase } = require('../integrations/application/use-cases/DisconnectIntegrationUseCase');
  const { IntegrationsController } = require('../integrations/interfaces/http/IntegrationsController');
  const { createIntegrationRouter } = require('../integrations/interfaces/http/integrationRoutes');

  const integrationRepo = overrides?.integrationRepository ?? new PrismaIntegrationRepository(prisma);

  const integrationsController = new IntegrationsController(
    new GetIntegrationsUseCase(integrationRepo),
    new ConnectIntegrationUseCase(integrationRepo),
    new DisconnectIntegrationUseCase(integrationRepo)
  );

  const integrationRoutes = createIntegrationRouter(integrationsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/integrations', integrationRoutes);

  // Report Routes
  const { PrismaReportRepository } = require('../reports/infrastructure/PrismaReportRepository');
  const { GetRevenueReportUseCase } = require('../reports/application/use-cases/GetRevenueReportUseCase');
  const { GetClientReportUseCase } = require('../reports/application/use-cases/GetClientReportUseCase');
  const { GetInventoryReportUseCase } = require('../reports/application/use-cases/GetInventoryReportUseCase');
  const { ReportsController } = require('../reports/interfaces/http/ReportsController');
  const { createReportRouter } = require('../reports/interfaces/http/reportRoutes');

  const reportRepo = new PrismaReportRepository(prisma);
  const reportsController = new ReportsController(
    new GetRevenueReportUseCase(reportRepo),
    new GetClientReportUseCase(reportRepo),
    new GetInventoryReportUseCase(reportRepo)
  );

  const reportRoutes = createReportRouter(reportsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/reports', reportRoutes);

  // Notifications
  const notificationController = new NotificationController(
    new GetNotificationsUseCase(notificationRepository),
    new MarkNotificationReadUseCase(notificationRepository),
    new MarkAllNotificationsReadUseCase(notificationRepository)
  );
  app.use(
    '/api/:tenantSlug/notifications',
    createNotificationRouter(notificationController, tokenService, tenantRepository)
  );

  app.use(errorHandler);

  return app;
};
