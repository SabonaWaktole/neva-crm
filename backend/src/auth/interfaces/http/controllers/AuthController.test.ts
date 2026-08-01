import { Request, Response } from 'express';
import { AuthController } from './AuthController';

describe('AuthController', () => {
  let authController: AuthController;
  let getTenantStaffUseCaseMock: any;

  beforeEach(() => {
    getTenantStaffUseCaseMock = { execute: jest.fn() };
    authController = new AuthController(
      // registerUseCase used to lead this list; public self-registration was
      // removed, so every argument below shifted up one position.
      {} as any, // loginUseCase
      {} as any, // inviteStaffUseCase
      {} as any, // acceptInvitationUseCase
      {} as any, // requestPasswordResetUseCase
      {} as any, // resetPasswordUseCase
      {} as any, // tenantRepository
      getTenantStaffUseCaseMock,
      {} as any, // getPendingInvitationsUseCase
      {} as any, // updateUserProfileUseCase
      {} as any, // getUserProfileUseCase
      {} as any  // updateUserRoleUseCase
    );
  });

  describe('getTenantStaff', () => {
    it('should return 200 with staff items', async () => {
      const mockReq = {
        tenant: { id: 'tenant1' }
      } as unknown as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const mockNext = jest.fn();

      getTenantStaffUseCaseMock.execute.mockResolvedValue({
        items: [{ id: '1', email: 'test@test.com', role: 'STAFF' }]
      });

      await authController.getTenantStaff(mockReq, mockRes, mockNext);

      expect(getTenantStaffUseCaseMock.execute).toHaveBeenCalledWith({ tenantId: 'tenant1' });
      expect(mockRes.json).toHaveBeenCalledWith({
        items: [{ id: '1', email: 'test@test.com', role: 'STAFF' }]
      });
    });

    it('should call next on error', async () => {
      const mockReq = {
        tenant: { id: 'tenant1' }
      } as unknown as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const mockNext = jest.fn();
      const error = new Error('Something went wrong');

      getTenantStaffUseCaseMock.execute.mockRejectedValue(error);

      await authController.getTenantStaff(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
