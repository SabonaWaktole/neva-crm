/**
 * Turn an axios error into a message worth showing a user.
 *
 * The API returns validation failures in more than one shape:
 *   - `{ error: string }`      — most handlers
 *   - `{ issues: ZodIssue[] }` — request-validation middleware, which currently
 *                                serialises the raw ZodError
 *   - `{ message: string }`    — occasional third shape
 *
 * A hook that only checks one of these silently falls through to its generic
 * fallback, which is how an invalid custom field type produced a 400 that the
 * user never saw any explanation for. Centralised so the next hook does not
 * have to rediscover all three.
 */
export function extractApiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (!data) return fallback;

  if (typeof data.error === 'string' && data.error) return data.error;

  if (Array.isArray(data.issues) && data.issues.length > 0) {
    const parts = data.issues
      .map((issue: any) => {
        const path = Array.isArray(issue?.path) ? issue.path.join('.') : '';
        const message = issue?.message ?? 'Invalid value';
        return path ? `${path}: ${message}` : message;
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }

  if (typeof data.message === 'string' && data.message) return data.message;

  return fallback;
}
