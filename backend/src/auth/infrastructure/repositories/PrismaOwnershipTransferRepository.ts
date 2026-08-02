import { PrismaClient } from '@prisma/client';
import { IOwnershipTransferRepository } from '../../domain/repositories/IOwnershipTransferRepository';
import {
  OwnershipTransfer,
  OwnershipTransferStatus,
} from '../../domain/entities/OwnershipTransfer';
import { prisma as defaultPrisma } from '../../../shared/infrastructure/prisma/client';

const toDomain = (data: {
  id: string;
  tenantId: string;
  originalOwnerId: string;
  actingOwnerId: string;
  previousActingRole: string;
  previousActingWarehouseId: string | null;
  status: string;
  createdAt: Date;
  createdByUserId: string;
  resolvedAt: Date | null;
  resolvedByUserId: string | null;
}): OwnershipTransfer =>
  OwnershipTransfer.create({
    ...data,
    status: data.status as OwnershipTransferStatus,
  });

export class PrismaOwnershipTransferRepository implements IOwnershipTransferRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findById(id: string): Promise<OwnershipTransfer | null> {
    const data = await this.prisma.ownershipTransfer.findUnique({ where: { id } });
    return data ? toDomain(data) : null;
  }

  async findActiveByOriginalOwnerId(originalOwnerId: string): Promise<OwnershipTransfer | null> {
    const data = await this.prisma.ownershipTransfer.findFirst({
      where: { originalOwnerId, status: OwnershipTransferStatus.ACTIVE },
    });
    return data ? toDomain(data) : null;
  }

  async findActiveByActingOwnerId(actingOwnerId: string): Promise<OwnershipTransfer | null> {
    const data = await this.prisma.ownershipTransfer.findFirst({
      where: { actingOwnerId, status: OwnershipTransferStatus.ACTIVE },
    });
    return data ? toDomain(data) : null;
  }
}
