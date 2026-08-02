import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import { IOwnershipTransactions } from '../application/ports/IOwnershipTransactions';
import { OwnershipTransfer, OwnershipTransferStatus } from '../domain/entities/OwnershipTransfer';
import { UserRole } from '../domain/enums/UserRole';

export class PrismaOwnershipTransactions implements IOwnershipTransactions {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async promoteForSuspension(params: {
    id: string;
    tenantId: string;
    originalOwnerId: string;
    actingOwnerId: string;
    actingOwnerRole: string;
    actingOwnerWarehouseId: string | null;
    createdByUserId: string;
  }): Promise<OwnershipTransfer> {
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.originalOwnerId },
        data: { isActive: false },
      });
      await tx.user.update({
        where: { id: params.actingOwnerId },
        data: { role: UserRole.BUSINESS_OWNER },
      });
      return tx.ownershipTransfer.create({
        data: {
          id: params.id,
          tenantId: params.tenantId,
          originalOwnerId: params.originalOwnerId,
          actingOwnerId: params.actingOwnerId,
          previousActingRole: params.actingOwnerRole,
          previousActingWarehouseId: params.actingOwnerWarehouseId,
          status: OwnershipTransferStatus.ACTIVE,
          createdByUserId: params.createdByUserId,
        },
      });
    });

    return OwnershipTransfer.create({
      ...created,
      status: created.status as OwnershipTransferStatus,
    });
  }

  async restoreOwnership(transferId: string, resolvedByUserId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.ownershipTransfer.findUniqueOrThrow({ where: { id: transferId } });

      await tx.user.update({
        where: { id: transfer.originalOwnerId },
        data: { role: UserRole.BUSINESS_OWNER, isActive: true },
      });
      await tx.user.update({
        where: { id: transfer.actingOwnerId },
        data: {
          role: transfer.previousActingRole,
          warehouseId: transfer.previousActingWarehouseId,
        },
      });
      await tx.ownershipTransfer.update({
        where: { id: transferId },
        data: {
          status: OwnershipTransferStatus.RESTORED,
          resolvedAt: new Date(),
          resolvedByUserId,
        },
      });
    });
  }

  async keepOwnership(transferId: string, resolvedByUserId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.ownershipTransfer.findUniqueOrThrow({ where: { id: transferId } });

      await tx.user.update({
        where: { id: transfer.originalOwnerId },
        data: { role: UserRole.STAFF, isActive: true },
      });
      await tx.ownershipTransfer.update({
        where: { id: transferId },
        data: {
          status: OwnershipTransferStatus.KEPT,
          resolvedAt: new Date(),
          resolvedByUserId,
        },
      });
    });
  }

  async promoteForDeletion(params: { actingOwnerId: string }): Promise<void> {
    await this.prisma.user.update({
      where: { id: params.actingOwnerId },
      data: { role: UserRole.BUSINESS_OWNER },
    });
  }
}
