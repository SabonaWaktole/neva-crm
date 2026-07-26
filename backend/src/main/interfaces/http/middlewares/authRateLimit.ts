import rateLimit from 'express-rate-limit';

/**
 * Brute-force protection for credential-accepting endpoints.
 *
 * The threshold is configurable so the test suite can exercise the middleware
 * without every auth integration test tripping it, but the DEFAULT is the
 * production-safe value. Absence of configuration yields protection ON — the
 * opposite of the JWT_SECRET fallback this step removed, where absence of
 * configuration silently yielded an insecure default.
 */
const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Built per createApp() call so each app instance gets its own counter store,
 * and so env changes are picked up at construction time.
 */
export const createAuthRateLimiter = () =>
  rateLimit({
    windowMs: positiveIntFromEnv('AUTH_RATE_LIMIT_WINDOW_MS', DEFAULT_WINDOW_MS),
    max: positiveIntFromEnv('AUTH_RATE_LIMIT_MAX', DEFAULT_MAX_ATTEMPTS),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
  });
