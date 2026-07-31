/**
 * The single place `VITE_API_URL` is read.
 *
 * Some hosting panels sanitise the scheme out of environment variable values,
 * so the var can arrive as `api.example.com/api` instead of
 * `https://api.example.com/api`. A scheme-less value is a *relative path* to
 * the browser, so axios resolves it against the SPA's own origin and every
 * request 404s on a URL like `https://spa.example.com/api.example.com/api/...`.
 *
 * Anything that already carries a scheme, and any genuinely root-relative
 * value (`/api`, the dev-proxy default), is passed through untouched.
 */
const normalise = (value: string | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed) return '/api';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed; // same origin — a proxy handles it
  return `https://${trimmed}`;
};

export const API_BASE_URL = normalise(
  import.meta.env.VITE_API_URL as string | undefined
);
