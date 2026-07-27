import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * The tenant staff list.
 *
 * Added because several components now fetch it that previously did not:
 * `AppointmentForm` (TD-022, which replaced three invented staff options with
 * the real list) and `QuotationDetailContent` (TD-021, which resolves stored
 * userIds to names). Without a handler those suites still passed, but each
 * logged an unhandled-request error and a "Failed to fetch staff" axios
 * failure — noise that would mask a genuine request problem later.
 *
 * Deliberately includes a deactivated member: assignee dropdowns must exclude
 * them, and the Team Settings list must show them with a badge, so the default
 * fixture should exercise both rather than only the happy shape.
 */
export const mockStaff = [
  { id: 'u1', email: 'ada@example.com', role: 'BUSINESS_OWNER', firstName: 'Ada', lastName: 'Lovelace', isActive: true },
  { id: 'u2', email: 'grace@example.com', role: 'STAFF', firstName: 'Grace', lastName: 'Hopper', isActive: true },
  { id: 'u3', email: 'alan@example.com', role: 'STAFF', firstName: 'Alan', lastName: 'Turing', isActive: false },
];

export const teamHandlers = [
  http.get(`${API_URL}/:tenantSlug/auth/staff`, () =>
    HttpResponse.json({ items: mockStaff })
  ),

  http.get(`${API_URL}/:tenantSlug/auth/invitations`, () => HttpResponse.json([])),
];
