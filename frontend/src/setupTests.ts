import { beforeAll, afterEach, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
/**
 * Initialises i18next for every test, matching production where App.tsx imports
 * it at the root.
 *
 * Without this, a component using `useTranslation` renders raw keys — but only
 * in tests whose import graph happens not to reach the i18n module, so the
 * failure looks arbitrary and file-specific rather than like a missing global.
 * Importing it here means tests assert on real English text, as a user sees it.
 */
import './i18n';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
