import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { CreateClientUseCase } from '../../../application/use-cases/CreateClientUseCase';
import { UpdateClientUseCase } from '../../../application/use-cases/UpdateClientUseCase';
import { SearchClientsUseCase } from '../../../application/use-cases/SearchClientsUseCase';
import { GetClientHistoryUseCase } from '../../../application/use-cases/GetClientHistoryUseCase';
import { AddInteractionUseCase } from '../../../application/use-cases/AddInteractionUseCase';
import { DefineCustomFieldUseCase } from '../../../application/use-cases/DefineCustomFieldUseCase';
import { DefineOutcomeCategoryUseCase } from '../../../application/use-cases/DefineOutcomeCategoryUseCase';
import { PrismaClientRepository } from '../../../infrastructure/repositories/PrismaClientRepository';
import { PrismaCustomFieldDefinitionRepository } from '../../../infrastructure/repositories/PrismaCustomFieldDefinitionRepository';
import { PrismaInteractionRepository } from '../../../infrastructure/repositories/PrismaInteractionRepository';
import { PrismaOutcomeCategoryRepository } from '../../../infrastructure/repositories/PrismaOutcomeCategoryRepository';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { UserRole } from '../../../../auth/domain/enums/UserRole';

export const createClientRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  // Repositories
  const clientRepo = new PrismaClientRepository(prisma);
  const customFieldRepo = new PrismaCustomFieldDefinitionRepository(prisma);
  const interactionRepo = new PrismaInteractionRepository(prisma);
  const outcomeCategoryRepo = new PrismaOutcomeCategoryRepository(prisma);

  // Use Cases
  const createClientUseCase = new CreateClientUseCase(clientRepo, customFieldRepo);
  const updateClientUseCase = new UpdateClientUseCase(clientRepo, customFieldRepo);
  const searchClientsUseCase = new SearchClientsUseCase(clientRepo);
  const getClientHistoryUseCase = new GetClientHistoryUseCase(clientRepo, interactionRepo);
  const addInteractionUseCase = new AddInteractionUseCase(clientRepo, interactionRepo, outcomeCategoryRepo);
  const defineCustomFieldUseCase = new DefineCustomFieldUseCase(customFieldRepo);
  const defineOutcomeCategoryUseCase = new DefineOutcomeCategoryUseCase(outcomeCategoryRepo);

  // Controller
  const clientController = new ClientController(
    createClientUseCase,
    updateClientUseCase,
    searchClientsUseCase,
    getClientHistoryUseCase,
    addInteractionUseCase,
    defineCustomFieldUseCase,
    defineOutcomeCategoryUseCase
  );

  // Middlewares: All client routes require authentication and tenant resolution
  router.use(authenticate);
  router.use(resolveTenant(prisma));
  router.use(authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]));

  // Routes
  router.post('/', clientController.createClient);
  router.get('/search', clientController.searchClients);
  router.put('/:clientId', clientController.updateClient);
  router.get('/:clientId/history', clientController.getHistory);
  router.post('/:clientId/interactions', clientController.addInteraction);
  
  router.post('/settings/custom-fields', clientController.defineCustomField);
  router.post('/settings/outcome-categories', clientController.defineOutcomeCategory);

  return router;
};
