import { ChangePasswordUseCase } from './ChangePasswordUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { UserRole } from '../../domain/enums/UserRole';
import { User } from '../../domain/entities/User';
import { UnauthorizedError, WeakPasswordError } from '../../domain/errors';
import { v4 as uuidv4 } from 'uuid';

describe('ChangePasswordUseCase', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let useCase: ChangePasswordUseCase;
  let testUser: User;

  beforeEach(() => {
    testUser = User.create({
      id: uuidv4(),
      email: 'admin@example.com',
      hashedPassword: 'old-hashed-password',
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      createdAt: new Date(),
    });

    mockUserRepository = {
      findById: jest.fn().mockResolvedValue(testUser),
      findByEmail: jest.fn(),
      findAnyByEmail: jest.fn(),
      findSuperAdminByEmail: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn(),
      findByTenantId: jest.fn(),
    } as any;

    mockPasswordHasher = {
      hash: jest.fn().mockResolvedValue('new-hashed-password'),
      compare: jest.fn().mockResolvedValue(true),
    };

    useCase = new ChangePasswordUseCase(mockUserRepository, mockPasswordHasher);
  });

  it('should change the password when the current password is correct', async () => {
    await useCase.execute({
      userId: testUser.id,
      currentPassword: 'CorrectPass1',
      newPassword: 'NewStrongPass1',
    });

    expect(mockPasswordHasher.compare).toHaveBeenCalledWith('CorrectPass1', testUser.hashedPassword);
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewStrongPass1');
    expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(testUser.id, 'new-hashed-password');
  });

  it('should throw UnauthorizedError when the current password is wrong', async () => {
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: testUser.id,
        currentPassword: 'WrongPass1',
        newPassword: 'NewStrongPass1',
      })
    ).rejects.toThrow(UnauthorizedError);

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('should throw WeakPasswordError when the new password fails strength rules', async () => {
    await expect(
      useCase.execute({
        userId: testUser.id,
        currentPassword: 'CorrectPass1',
        newPassword: 'weak',
      })
    ).rejects.toThrow(WeakPasswordError);

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('should throw when the user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing-id',
        currentPassword: 'CorrectPass1',
        newPassword: 'NewStrongPass1',
      })
    ).rejects.toThrow('User not found');
  });
});
