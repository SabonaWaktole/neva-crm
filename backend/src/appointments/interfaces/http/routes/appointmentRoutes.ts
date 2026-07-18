import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { CreateAppointmentUseCase } from '../../../application/use-cases/CreateAppointmentUseCase';
import { RescheduleAppointmentUseCase } from '../../../application/use-cases/RescheduleAppointmentUseCase';
import { CancelAppointmentUseCase } from '../../../application/use-cases/CancelAppointmentUseCase';
import { UpdateAppointmentStatusUseCase } from '../../../application/use-cases/UpdateAppointmentStatusUseCase';
import { SearchAppointmentsUseCase } from '../../../application/use-cases/SearchAppointmentsUseCase';
import { GetUpcomingAppointmentsUseCase } from '../../../application/use-cases/GetUpcomingAppointmentsUseCase';
import { GetAppointmentHistoryUseCase } from '../../../application/use-cases/GetAppointmentHistoryUseCase';
import { PrismaAppointmentRepository } from '../../../infrastructure/repositories/PrismaAppointmentRepository';
import { PrismaClientRepository } from '../../../../clients/infrastructure/repositories/PrismaClientRepository';
import { PrismaUserRepository } from '../../../../auth/infrastructure/repositories/PrismaUserRepository';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { UserRole } from '../../../../auth/domain/enums/UserRole';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../../tenant/domain/repositories/ITenantRepository';

export const createAppointmentRouter = (
  prisma: PrismaClient,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router => {
  const router = Router({ mergeParams: true });

  // Repositories
  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const clientRepo = new PrismaClientRepository(prisma);
  const userRepo = new PrismaUserRepository(); // PrismaUserRepository creates its own PrismaClient inside, or we can use it directly depending on implementation

  // Use Cases
  const createAppointmentUseCase = new CreateAppointmentUseCase(appointmentRepo, clientRepo, userRepo);
  const rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(appointmentRepo);
  const cancelAppointmentUseCase = new CancelAppointmentUseCase(appointmentRepo);
  const updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(appointmentRepo);
  const searchAppointmentsUseCase = new SearchAppointmentsUseCase(appointmentRepo);
  const getUpcomingAppointmentsUseCase = new GetUpcomingAppointmentsUseCase(appointmentRepo);
  const getAppointmentHistoryUseCase = new GetAppointmentHistoryUseCase(appointmentRepo);

  // Controller
  const appointmentController = new AppointmentController(
    createAppointmentUseCase,
    rescheduleAppointmentUseCase,
    cancelAppointmentUseCase,
    updateAppointmentStatusUseCase,
    searchAppointmentsUseCase,
    getUpcomingAppointmentsUseCase,
    getAppointmentHistoryUseCase
  );

  // Middlewares applied to all routes in this router
  const authMw = authenticate(tokenService);
  const resolveTenantMw = resolveTenant(tenantRepository);

  router.use(authMw);
  router.use(resolveTenantMw);
  router.use(authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]));

  router.post('/', appointmentController.createAppointment);
  router.get('/search', appointmentController.searchAppointments);
  router.get('/upcoming', appointmentController.getUpcomingAppointments);
  router.get('/:appointmentId/history', appointmentController.getAppointmentHistory);
  
  router.put('/:appointmentId/reschedule', appointmentController.rescheduleAppointment);
  router.put('/:appointmentId/cancel', appointmentController.cancelAppointment);
  router.put('/:appointmentId/status', appointmentController.updateAppointmentStatus);

  return router;
};
