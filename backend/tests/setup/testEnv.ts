/**
 * Test-only environment defaults. Runs per test file, before any test module.
 *
 * The auth rate limiter stays MOUNTED in tests (so the middleware path is always
 * exercised); only its threshold is raised, because auth.integration.test.ts
 * legitimately makes 21 auth requests from a single IP. Tests that assert the
 * limiter actually trips set a low value themselves and restore it afterwards.
 *
 * Note this only ever loosens a limit inside the test process. The production
 * default lives in src/main/interfaces/http/middlewares/authRateLimit.ts and is
 * secure when unset, so forgetting to configure it in a real deploy cannot
 * disable protection.
 */
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX ?? '10000';
