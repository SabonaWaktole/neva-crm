import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import { PrismaUserRepository } from '@auth/infrastructure/repositories/PrismaUserRepository';
import { PrismaTenantRepository } from '@tenant/infrastructure/repositories/PrismaTenantRepository';
import { PrismaInvitationRepository } from '@auth/infrastructure/repositories/PrismaInvitationRepository';
import { PrismaPasswordResetTokenRepository } from '@auth/infrastructure/repositories/PrismaPasswordResetTokenRepository';
import { BcryptPasswordHasher } from '@auth/infrastructure/BcryptPasswordHasher';
import { JwtTokenService } from '@auth/infrastructure/JwtTokenService';
import { ConsoleEmailSender } from '@auth/infrastructure/ConsoleEmailSender';
import { NodemailerEmailSender } from '@auth/infrastructure/NodemailerEmailSender';
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

export interface AppDependencies {
  userRepository: IUserRepository;
  tenantRepository: ITenantRepository;
  invitationRepository: IInvitationRepository;
  prtRepository: IPasswordResetTokenRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
  emailSender: IEmailSender;
  unitOfWork: IUnitOfWork;
}

export const createApp = (overrides?: Partial<AppDependencies>) => {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Dependencies — use overrides if provided, otherwise default to real implementations
  const userRepository = overrides?.userRepository ?? new PrismaUserRepository();
  const tenantRepository = overrides?.tenantRepository ?? new PrismaTenantRepository();
  const invitationRepository = overrides?.invitationRepository ?? new PrismaInvitationRepository();
  const prtRepository = overrides?.prtRepository ?? new PrismaPasswordResetTokenRepository();
  const passwordHasher = overrides?.passwordHasher ?? new BcryptPasswordHasher();
  const tokenService = overrides?.tokenService ?? new JwtTokenService();
  const emailSender = overrides?.emailSender ?? new NodemailerEmailSender();
  const unitOfWork = overrides?.unitOfWork ?? new PrismaUnitOfWork();

  // Use Cases
  const registerUseCase = new RegisterBusinessOwnerUseCase(userRepository, tenantRepository, passwordHasher, unitOfWork);
  const loginUseCase = new LoginUseCase(userRepository, tenantRepository, passwordHasher, tokenService);
  const inviteStaffUseCase = new InviteStaffUseCase(invitationRepository, emailSender);
  const acceptInvitationUseCase = new AcceptInvitationUseCase(invitationRepository, userRepository, passwordHasher, tenantRepository);
  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository, prtRepository, emailSender);
  const resetPasswordUseCase = new ResetPasswordUseCase(prtRepository, userRepository, passwordHasher);
  const getTenantStaffUseCase = new GetTenantStaffUseCase(userRepository);
  const getPendingInvitationsUseCase = new GetPendingInvitationsUseCase(invitationRepository);
  const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
  const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);

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
    updateUserRoleUseCase
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
  const { PrismaWarehouseRepository } = require('../inventory/infrastructure/repositories/PrismaWarehouseRepository');
  const { PrismaCategoryRepository } = require('../inventory/infrastructure/repositories/PrismaCategoryRepository');
  const { PrismaStockLevelRepository } = require('../inventory/infrastructure/repositories/PrismaStockLevelRepository');
  const { PrismaStockMovementRepository } = require('../inventory/infrastructure/repositories/PrismaStockMovementRepository');
  const { PrismaStockTransactionManager } = require('../inventory/infrastructure/repositories/PrismaStockTransactionManager');
  
  const { CreateProductUseCase } = require('../inventory/application/use-cases/CreateProductUseCase');
  const { UpdateProductUseCase } = require('../inventory/application/use-cases/UpdateProductUseCase');
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
  
  const { InventoryController } = require('../inventory/interfaces/http/inventoryController');
  const { createInventoryRouter } = require('../inventory/interfaces/http/inventoryRoutes');

  const productRepo = new PrismaProductRepository(prisma);
  const warehouseRepo = new PrismaWarehouseRepository(prisma);
  const categoryRepo = new PrismaCategoryRepository(prisma);
  const stockLevelRepo = new PrismaStockLevelRepository(prisma);
  const stockMovementRepo = new PrismaStockMovementRepository(prisma);
  const stockTxManager = new PrismaStockTransactionManager(prisma);

  const inventoryController = new InventoryController(
    new CreateProductUseCase(productRepo, warehouseRepo, stockTxManager),
    new UpdateProductUseCase(productRepo),
    new AdjustStockUseCase(stockLevelRepo, stockMovementRepo),
    new TransferStockUseCase(stockLevelRepo, stockTxManager),
    new SearchProductsUseCase(productRepo),
    new GetProductStockBreakdownUseCase(productRepo, stockLevelRepo),
    new CreateWarehouseUseCase(warehouseRepo),
    new UpdateWarehouseUseCase(warehouseRepo),
    new DeleteWarehouseUseCase(warehouseRepo, stockLevelRepo),
    new GetWarehousesUseCase(warehouseRepo),
    new CreateCategoryUseCase(categoryRepo),
    new UpdateCategoryUseCase(categoryRepo),
    new DeleteCategoryUseCase(categoryRepo, productRepo),
    new GetCategoriesUseCase(categoryRepo)
  );

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
    new SubmitQuotationUseCase(quotationRepo, quotationHistoryRepo),
    new ApproveQuotationUseCase(quotationRepo, quotationHistoryRepo),
    new ReturnQuotationToDraftUseCase(quotationRepo, quotationHistoryRepo),
    new MarkQuotationAcceptedUseCase(quotationRepo, quotationLineItemRepo, quotationHistoryRepo, stockLevelRepo, stockTxManager),
    new MarkQuotationRejectedUseCase(quotationRepo, quotationHistoryRepo),
    new ExpireQuotationUseCase(quotationRepo, quotationHistoryRepo),
    new SearchQuotationsUseCase(quotationRepo),
    new GetQuotationDetailUseCase(quotationRepo, quotationLineItemRepo, quotationHistoryRepo),
    new GetPendingApprovalsUseCase(quotationRepo),
    settingsService
  );

  const quotationRoutes = createQuotationRouter(quotationsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/quotations', quotationRoutes);

  // Settings Routes
  const { SettingsController } = require('../settings/interfaces/http/SettingsController');
  const { createSettingsRouter } = require('../settings/interfaces/http/settingsRoutes');
  
  const settingsController = new SettingsController(tenantRepository);
  const settingsRoutes = createSettingsRouter(settingsController, tokenService, tenantRepository);
  app.use('/api/:tenantSlug/settings', settingsRoutes);

  return app;
};
