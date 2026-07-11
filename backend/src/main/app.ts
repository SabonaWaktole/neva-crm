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
import { PrismaUserRepository } from '@auth/infrastructure/repositories/PrismaUserRepository';
import { PrismaTenantRepository } from '@tenant/infrastructure/repositories/PrismaTenantRepository';
import { PrismaInvitationRepository } from '@auth/infrastructure/repositories/PrismaInvitationRepository';
import { PrismaPasswordResetTokenRepository } from '@auth/infrastructure/repositories/PrismaPasswordResetTokenRepository';
import { BcryptPasswordHasher } from '@auth/infrastructure/BcryptPasswordHasher';
import { JwtTokenService } from '@auth/infrastructure/JwtTokenService';
import { ConsoleEmailSender } from '@auth/infrastructure/ConsoleEmailSender';
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
  const emailSender = overrides?.emailSender ?? new ConsoleEmailSender();
  const unitOfWork = overrides?.unitOfWork ?? new PrismaUnitOfWork();

  // Use Cases
  const registerUseCase = new RegisterBusinessOwnerUseCase(userRepository, tenantRepository, passwordHasher, unitOfWork);
  const loginUseCase = new LoginUseCase(userRepository, tenantRepository, passwordHasher, tokenService);
  const inviteStaffUseCase = new InviteStaffUseCase(invitationRepository, emailSender);
  const acceptInvitationUseCase = new AcceptInvitationUseCase(invitationRepository, userRepository, passwordHasher);
  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository, prtRepository, emailSender);
  const resetPasswordUseCase = new ResetPasswordUseCase(prtRepository, userRepository, passwordHasher);

  // Controller
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    inviteStaffUseCase,
    acceptInvitationUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
    tenantRepository
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

  return app;
};
