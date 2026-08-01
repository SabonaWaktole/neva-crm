import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const backendRoot = path.resolve(__dirname, '..', '..');

/**
 * Resolve the base test database URL.
 *
 * Precedence: an already-exported DATABASE_URL wins (CI), otherwise `.env.test`,
 * otherwise `.env`. dotenv does not override existing vars, so loading both in
 * that order gives the precedence above for free.
 */
export function resolveBaseDatabaseUrl(): string {
  for (const file of ['.env.test', '.env']) {
    const full = path.join(backendRoot, file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full });
    }
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Export it, or provide backend/.env.test or backend/.env.'
    );
  }
  return url;
}

/** Database name owned exclusively by a given Jest worker. */
export function schemaForWorker(workerId: string | number): string {
  return `test_w${workerId}`;
}

/**
 * Point a base connection string at a worker's own database.
 *
 * MySQL has no schema-within-a-database layer, so a worker's isolation unit is a
 * whole database and it is named in the URL PATH. This used to set a `?schema=`
 * query parameter, which is the Postgres arrangement — every worker then shared
 * the single database named in the base URL and the parameter was ignored.
 */
export function urlForSchema(baseUrl: string, schema: string, connectionLimit?: number): string {
  const url = new URL(baseUrl);
  url.pathname = `/${schema}`;
  url.searchParams.delete('schema');
  if (connectionLimit !== undefined) {
    url.searchParams.set('connection_limit', String(connectionLimit));
  }
  return url.toString();
}

/** The same connection string with no database selected, for CREATE DATABASE. */
export function serverUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = '/';
  return url.toString();
}
