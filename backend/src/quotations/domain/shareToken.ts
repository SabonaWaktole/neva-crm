import { randomBytes } from 'crypto';

/**
 * Mints the capability token behind a quotation's public URL.
 *
 * 32 bytes of CSPRNG output, base64url-encoded to 43 characters. The length is
 * the security control: this token is the *only* thing standing between the
 * public internet and a customer's pricing, because the route it unlocks has
 * no session and no tenant context by design. At 256 bits it is not guessable
 * and not enumerable, which is what lets the endpoint stay unauthenticated.
 *
 * `base64url` rather than plain base64 so the value survives being pasted into
 * a URL, an email client and a chat window without `+` or `/` being escaped
 * into something that no longer resolves.
 */
export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}
