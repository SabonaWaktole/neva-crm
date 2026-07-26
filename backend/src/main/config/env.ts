/**
 * Startup validation for required environment configuration.
 *
 * Deliberately has NO environment conditionals (no `NODE_ENV !== 'production'`
 * escape hatch). A guard that can be switched off by an environment variable is
 * a guard that will be off in the one deployment that needed it. Every
 * environment, including tests, must supply a real JWT_SECRET.
 */

export class MissingEnvironmentError extends Error {
  constructor(name: string) {
    super(
      `${name} is not set. Refusing to start: a missing signing secret would ` +
        `silently fall back to a well-known value and make every issued token forgeable.`
    );
    this.name = 'MissingEnvironmentError';
  }
}

/** True when a variable is absent, empty, or whitespace-only. */
function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

/** Read JWT_SECRET, throwing if it is missing or blank. */
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (isBlank(secret)) {
    throw new MissingEnvironmentError('JWT_SECRET');
  }
  return secret as string;
}

/**
 * Validate all required configuration up front. Called from the server entry
 * point before the port is bound, so a misconfigured deploy fails immediately
 * and visibly rather than serving traffic with forgeable tokens.
 */
export function assertRequiredEnv(): void {
  requireJwtSecret();
}
