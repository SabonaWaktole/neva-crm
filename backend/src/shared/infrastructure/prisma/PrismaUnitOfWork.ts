import { IUnitOfWork } from '../../application/ports/IUnitOfWork';
import { prisma } from './client';

export class PrismaUnitOfWork implements IUnitOfWork {
  async execute<T>(work: () => Promise<T>): Promise<T> {
    return await prisma.$transaction(async (tx) => {
      // In a real implementation, you'd pass `tx` down to repositories.
      // For this simplified version, we just execute the work within the transaction block.
      // A more robust approach uses async local storage or passing the transaction object.
      return await work();
    });
  }
}
