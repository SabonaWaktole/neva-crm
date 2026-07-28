import { CookieOptions } from 'express';

/**
 * Attributes for the `jwt` session cookie.
 *
 * In production the frontend and the API are on different registrable domains
 * (Vercel and Render), which makes every API call a CROSS-SITE request. A
 * `SameSite=Strict` cookie is never attached to those, so the browser would
 * accept the cookie at login and then silently omit it from the very next
 * request — GET /auth/me would come back `{ user: null }`, login would appear
 * to succeed, and the app would bounce straight back to the login page with no
 * error to explain why. `SameSite=None` is what permits the cross-site send,
 * and browsers only honour it together with `Secure`.
 *
 * Locally the Vite dev server proxies /api to the backend, so the request is
 * same-site and `Lax` applies; `Secure` is off because dev is plain http.
 *
 * Exported as ONE object used by both the set and the clear paths: a cookie is
 * only removable by a Set-Cookie carrying matching attributes, so a divergence
 * between the two would turn logout into a no-op.
 */
export const authCookieOptions = (): CookieOptions => {
  const crossSite = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? 'none' : 'lax',
  };
};

export const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day
