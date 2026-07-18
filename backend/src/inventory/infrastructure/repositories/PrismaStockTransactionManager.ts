import { PrismaClient, Prisma } from '@prisma/client';
import { IStockTransactionManager, IStockLevelRepository, IStockMovementRepository } from '../../domain/repositories';
import { PrismaStockLevelRepository } from './PrismaStockLevelRepository';
import { PrismaStockMovementRepository } from './PrismaStockMovementRepository';

export class PrismaStockTransactionManager implements IStockTransactionManager {
  constructor(private prisma: PrismaClient) {}

  async executeTransaction<T>(
    work: (repos: {
      stockLevelRepository: IStockLevelRepository;
      stockMovementRepository: IStockMovementRepository;
    }) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // We safely cast tx to PrismaClient here because the repositories only use model delegates
      // (tx.stockLevel, tx.stockMovement) which are identical on TransactionClient.
      const stockLevelRepo = new PrismaStockLevelRepository(tx as PrismaClient);
      const stockMovementRepo = new PrismaStockMovementRepository(tx as PrismaClient);
      
      return work({
        stockLevelRepository: stockLevelRepo,
        stockMovementRepository: stockMovementRepo,
      });
    });
  }
}
