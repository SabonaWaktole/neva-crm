import { execFileSync } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { resolveBaseDatabaseUrl, schemaForWorker, serverUrl, urlForSchema } from './databaseUrl';

const backendRoot = path.resolve(__dirname, '..', '..');

/**
 * Provision one database per Jest worker and migrate each to head.
 *
 * `prisma migrate deploy` is a fast no-op once a database is up to date, so this
 * only costs real time on the first run after a new migration.
 *
 * MySQL, not Postgres. This used to run `CREATE SCHEMA IF NOT EXISTS "name"` —
 * double-quoted identifiers and a schema-inside-a-database model, neither of
 * which MySQL has. Against the MySQL the project actually runs on, that failed
 * with a syntax error in globalSetup and took every backend test down with it.
 */
export default async function globalSetup(globalConfig: { maxWorkers: number }): Promise<void> {
  const baseUrl = resolveBaseDatabaseUrl();
  const workerCount = Math.max(1, globalConfig.maxWorkers ?? 1);
  const schemas = Array.from({ length: workerCount }, (_, i) => schemaForWorker(i + 1));

  // Connected with no database selected: the per-worker databases are what this
  // loop is about to create, so it cannot connect to one of them first.
  const admin = new PrismaClient({ datasources: { db: { url: serverUrl(baseUrl) } } });
  try {
    for (const schema of schemas) {
      // Backticks, and the names are generated as `test_w<n>` rather than taken
      // from any input.
      await admin.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS \`${schema}\``);
    }
  } finally {
    await admin.$disconnect();
  }

  await Promise.all(
    schemas.map(async (schema) => {
      execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
        cwd: backendRoot,
        env: { ...process.env, DATABASE_URL: urlForSchema(baseUrl, schema) },
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });
    })
  );
}
