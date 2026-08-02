import { PrismaClient } from '@prisma/client';
import { IDatabaseHealthChecker } from '../application/ports/IDatabaseHealthChecker';

export class PrismaDatabaseHealthChecker implements IDatabaseHealthChecker {
  constructor(private readonly prisma: PrismaClient) {}

  async checkConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
