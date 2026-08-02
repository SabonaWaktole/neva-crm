/**
 * Relocated to `shared/domain/errors` — the "type it exactly to confirm"
 * pattern is now used by both tenant deletion and user deletion. Re-exported
 * here so existing imports of this path keep working.
 */
export { ConfirmationMismatchError } from '../../../shared/domain/errors/ConfirmationMismatchError';
