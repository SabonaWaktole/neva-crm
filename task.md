# Tracked Follow-Ups / Known Technical Debt

Items deliberately deferred rather than forgotten. Each entry states the actual
risk, not just the symptom, so whoever picks it up can judge priority for
themselves.

---

## TD-001 — Integration test fixtures share hardcoded IDs and wipe tables unscoped

**Status:** Open
**Raised:** 2026-07-26, during Phase A Step 1 (test suite stabilization)
**Severity:** Medium — not currently causing failures, but the safety margin is thinner than it looks
**Area:** `backend/tests/integration/**`, `backend/src/**/*.test.ts`

### What was fixed, and what was not

Phase A Step 1 made the suite green and deterministic in both parallel and
serial execution by giving **each Jest worker its own Postgres schema**
(`backend/tests/setup/perWorkerDb.ts`, `globalSetup.ts`, wired in
`jest.config.ts`). That fixed the *cross-worker* collisions that were causing
13 suites / 48 tests to fail in parallel while only 5 failed in serial.

It did **not** fix the underlying fixture design. It made the existing design
survivable rather than correct.

### The actual remaining risk

Two independent bad practices are still present in the suite:

**1. Suites share hardcoded fixture IDs.** These suites all use tenant id
`'t1'` (and overlapping ids like `'u1'`, `'c1-t1'`):

- `tests/integration/appointments/appointmentRoutes.test.ts`
- `tests/integration/clients/clientRoutes.test.ts`
- `tests/integration/integrations/integrationRoutes.test.ts`

**2. Suites truncate tables without any tenant scoping.** These issue bare
`deleteMany({})` against entire tables in `beforeAll`/`afterAll`, which wipes
everything in the schema regardless of who owns it:

| Suite | count of unscoped `deleteMany({})` |
|---|---|
| `tests/integration/appointments/PrismaAppointmentRepository.test.ts` | 25 |
| `tests/integration/tenant/PrismaTenantRepository.test.ts` | 26 |
| `tests/integration/dashboard/dashboardRoutes.test.ts` | 7 |
| `tests/integration/tenant/tenantRoutes.test.ts` | 7 |
| `tests/integration/appointments/appointmentRoutes.test.ts` | 4 |

**Why this is not failing today:** Jest assigns each *worker* a private schema,
and within a single worker it runs suites **sequentially**, one fully finishing
before the next begins. So two suites that share id `'t1'` never touch the
schema at the same time. The isolation currently comes from Jest's execution
model, not from the fixtures themselves.

**Why that is fragile:** the suite is one step away from breaking again, and the
failure mode would be the same confusing non-determinism as before —

- Any move to intra-file concurrency (`test.concurrent`, or a future Jest
  default) removes the sequential guarantee immediately.
- State leaks between suites sharing a worker are already possible: a suite that
  fails partway through leaves rows behind under ids the *next* suite in that
  worker also uses, producing order-dependent passes/failures that reproduce
  only under a specific worker assignment.
- Worker assignment is not stable across runs, so any such bug surfaces
  intermittently and looks like flakiness rather than a fixture bug.
- The `deleteMany({})` calls mean a suite cannot safely assume anything it
  seeded still exists if another suite ran in between.

### Suggested fix

Namespace fixtures per suite instead of relying on execution order. Either:

- derive a unique prefix per suite (e.g. `t-${path.basename(__filename)}`) and
  use it for every id the suite creates; **and**
- replace every unscoped `deleteMany({})` with one scoped to that suite's own
  tenant id.

A shared `tests/setup/fixtures.ts` helper offering `uniqueTenantId()` +
`cleanupTenant(prisma, tenantId)` would let suites be migrated incrementally
rather than in one large change.

### Operational note on the current setup

`globalSetup.ts` provisions exactly `globalConfig.maxWorkers` schemas
(`test_w1..test_wN`) and migrates each. Schemas are intentionally **not**
dropped on teardown so reruns stay fast (`prisma migrate deploy` is a no-op once
current). If a migration is ever applied manually to only one schema, run the
full suite once to bring the rest back to head.

### Coda: this failure mode actually materialized (2026-07-26, Phase B Group 1)

Not theoretical. It happened, exactly as described above.

`tests/integration/tenant/superAdminTenantScope.test.ts` was written during
Phase A Step 3 using the hardcoded slugs `'tenant1'` / `'tenant2'` — the **same
literals** `tests/integration/inventory/inventoryRoutes.test.ts` creates. That
file's `afterAll` only calls `$disconnect()`, so its tenant rows persist in the
worker schema after it finishes.

It passed for two phases anyway, because the new file's own **unscoped
`deleteMany({})` was silently wiping the leftover rows first**. When that was
replaced with scoped teardown (the correct fix, per this entry's own
recommendation), the accidental protection disappeared and the real collision
surfaced:

```
Unique constraint failed on the fields: (`urlSlug`)   ×32
```

— failing 2 suites / 25 tests **in parallel only**, while serial passed. Precisely
the intermittent, worker-assignment-dependent signature predicted above.

**Two lessons worth carrying:**

1. **Unscoped `deleteMany({})` does not just risk destroying other suites' data
   — it actively hides fixture collisions.** Every one of those calls is
   potentially masking a latent conflict that will surface the moment someone
   does the right thing and scopes the cleanup. Expect this when migrating the
   suites listed above; a suite failing right after its teardown is scoped is
   evidence of a pre-existing collision, not of a bad migration.
2. **Fix the fixtures, not the teardown.** The correct repair was namespacing
   slugs and emails per run (`scope-a-${uuid.slice(0,8)}`), not restoring the
   global wipe. Both new files now do this and pass three consecutive parallel
   runs plus serial.

---

## TD-002 — Test doubles are hand-written and drift from their interfaces

**Status:** Open
**Raised:** 2026-07-26, during Phase A Step 1
**Severity:** Low-Medium — caused 5 suites to stop executing entirely, undetected
**Area:** `backend/tests/**`

Five suites had silently stopped compiling (and therefore stopped running)
because hand-written mocks drifted from interfaces that had changed:
`updateRoleAndWarehouse` on `IUserRepository`, `delete` on
`IInvitationRepository`, and `warehouseId` on `req.user`. Among them were
`resolveTenant.test.ts` and `authorize.test.ts` — the core tenant-isolation
middleware tests. They have since been fixed and all pass, so no isolation
regression was hiding there, but the suite gave no signal that they had gone
dark for an extended period.

A related variant: doubles built as bare `jest.fn()` return `undefined` where
the interface declares `Promise<void>`. Production code that legitimately
fire-and-forgets (`.catch()` without `await`) then throws `TypeError: Cannot
read properties of undefined (reading 'catch')` inside the *test only*. This bit
both `RequestPasswordResetUseCase.test.ts` and `InviteStaffUseCase.test.ts`.

**Suggested fix:** generate doubles from the interface (`jest-mock-extended`'s
`mock<IFoo>()` is already a devDependency and returns auto-typed, auto-resolving
mocks) instead of hand-writing object literals. That makes both drift classes
impossible — a new interface method cannot be forgotten, and every method
returns a promise by default.

**Guardrail worth considering regardless:** add a `tsc --noEmit` step over
`tests/**` to CI, so a test suite that stops compiling fails the build loudly
instead of quietly disappearing from the run.

---

## TD-003 — Email credential exposed in git history (rotate, do not rewrite)

**Status:** Open — **owner action required (account-level, not a code change)**
**Raised:** 2026-07-26, during Phase A Step 2 (security hardening)
**Severity:** High — a live credential is readable by anyone with repo access
**Area:** git history, `backend/.env` (no longer tracked)

### What was found

`backend/.env` was tracked in roughly ten commits and removed in `bf8c1ca`
("feat: implement invitation acceptance flow and email notifications"). It is
**not** in `HEAD` today and is correctly ignored now, but the blobs remain
reachable in history. Contents at the last committed revision (inspected by key
name and value length only; values were never printed):

| Key | Length | Assessment |
|---|---|---|
| `EMAIL_PASS` | 21 | **Real-looking credential — this is the exposure** |
| `EMAIL_USER` | 25 | A `@gmail.com` address |
| `DATABASE_URL` | 49 | Points at `localhost` — local dev only, low risk |
| `VITE_API_URL` (in `frontend/.env`) | 62 | An API endpoint URL, not a secret |

**`JWT_SECRET` was never committed, in any file, in any commit.** Verified with
`git grep JWT_SECRET $(git rev-list --all)`; the only hits are source references
to `process.env.JWT_SECRET`. This matters because Step 2 found that dev and
production had been running on the hardcoded `'secret'` fallback — but that
weakness did **not** compound into a leaked signing key.

### Recommendation: rotate, do not rewrite history

**Rotate the Gmail App Password for the sending account.** If the repository was
ever cloned, forked, or pushed to a remote — and it was — then rewriting history
does not retract anything that has already been copied. Rotation is what
actually closes the exposure; history rewriting only reduces future casual
discovery, at the cost of breaking every existing clone and requiring a
coordinated force-push. Rotation is fast, safe, and sufficient. Treat a history
rewrite as an optional, separate hygiene decision, not as the remediation.

`DATABASE_URL` needs no action: it is a `localhost` connection string with a
local-only password.

### Owner action item

Rotating the Gmail App Password is an account-level action outside the codebase
and is owned by the repository owner. No code change will complete this item.

---

## TD-004 — RESOLVED: repo-root `.gitignore` did not cover a root-level `.env`

**Status:** Closed 2026-07-26 (fixed in the same pass that raised it)

The root `.gitignore` patterns `*/.env` and `*/.env.*` both require a directory
prefix, so a bare repo-root `.env` would not have matched and would have been
tracked. No such file existed, so nothing was ever exposed through this gap.

Fixed by adding bare `.env` and `.env.*` lines to the root `.gitignore`.
Verified with a temporary probe file: `git check-ignore -v .env` now reports
`.gitignore:3:.env`. Recorded here only so the reasoning behind those lines is
not lost and they are not "tidied away" later as redundant — they are not
redundant with the `*/`-prefixed patterns.

Note that the per-directory `backend/.gitignore` and `frontend/.gitignore` are
what actually cover the real env files today (`git check-ignore -v backend/.env`
cites `backend/.gitignore:6`), so the root patterns are a second layer rather
than the primary defence.

---

## TD-005 — Dead SUPER_ADMIN branches in tenant-scoped authorization checks

**Status:** Open
**Raised:** 2026-07-26, during Phase A Step 3 (Super Admin tenant-scope fix)
**Severity:** Low — unreachable and harmless today; a clarity and audit-safety risk
**Area:** `backend/src/**` application-layer use cases and one route guard

### Background

Phase A Step 3 removed the `SUPER_ADMIN` exemption from `resolveTenant`. Tenant
scoping is now absolute: any request to `/:tenantSlug/...` whose token
`tenantId` does not match the URL-resolved tenant gets a 403, with no role-based
exception. `SUPER_ADMIN` has a null `tenantId`, so it is now denied on every
tenant-scoped route.

`resolveTenant` runs **before** these checks in the middleware chain, so the
role branches below can no longer be reached by a `SUPER_ADMIN`.

### The now-unreachable branches

Each grants `SUPER_ADMIN` permission alongside `BUSINESS_OWNER`:

| Location | Form |
|---|---|
| `src/auth/application/use-cases/InviteStaffUseCase.ts:16` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/auth/application/use-cases/GetPendingInvitationsUseCase.ts:9` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/auth/application/use-cases/CancelInvitationUseCase.ts:9` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/auth/application/use-cases/UpdateUserRoleUseCase.ts:15` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/clients/application/use-cases/DefineCustomFieldUseCase.ts:20` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/clients/application/use-cases/DefineOutcomeCategoryUseCase.ts:17` | `!== BUSINESS_OWNER && !== SUPER_ADMIN` |
| `src/integrations/interfaces/http/integrationRoutes.ts:21` | `authorize([BUSINESS_OWNER, STAFF, SUPER_ADMIN])` |

### Why this is a cleanup item, not a bug

Nothing is broken. `resolveTenant` blocks first, so these branches cannot grant
access they should not. Behaviour is correct today and covered by
`tests/integration/tenant/superAdminTenantScope.test.ts`.

### Why it is still worth doing

**Dead role checks inside security-relevant guards are exactly the stale code
that misleads the next person auditing this area.** Someone reading
`InviteStaffUseCase` in isolation will reasonably conclude a Super Admin can
invite staff into any tenant — the opposite of the actual, deliberate policy.
That misreading is most likely during a security review, which is precisely when
being wrong is most expensive. It also invites a bad repair: if someone later
"fixes" a Super Admin 403 by loosening `resolveTenant` rather than reading these
call sites, the original bypass comes straight back.

### Suggested fix

Remove `SUPER_ADMIN` from each condition so the checks state the real policy
(`BUSINESS_OWNER` only for the six use cases; drop `SUPER_ADMIN` from the
`authorize([...])` list on `integrationRoutes.ts:21`).

**Care required:** these conditions are still live for `BUSINESS_OWNER`, so each
edit must preserve that path. Do not delete the guards wholesale — only the
`SUPER_ADMIN` term. Run the full suite after; the existing use-case unit tests
cover the `BUSINESS_OWNER` and `STAFF` paths.

**Consistency note:** `ConnectIntegrationUseCase` and
`DisconnectIntegrationUseCase` already *explicitly deny* `SUPER_ADMIN`
(`authorRole === SUPER_ADMIN` → unauthorized). That module was independently
consistent with the policy before Step 3 made it global, and is the pattern the
others should match.

---

## TD-006 — `req.user!.role as any` casts away enum checking at 24 call sites

**Status:** Open
**Raised:** 2026-07-26, during Phase B Group 1 (found while auditing `as any` usage)
**Severity:** Low-Medium — no known live bug; removes compile-time protection on a security-relevant value
**Area:** `backend/src/**/interfaces/http`

### What it is

24 call sites pass the caller's role into a use case as `req.user!.role as any`:

| File | Count |
|---|---|
| `src/inventory/interfaces/http/inventoryController.ts` | 23 |
| `src/auth/interfaces/http/controllers/AuthController.ts` | 1 |

The cast exists because `req.user.role` is typed `string` (see the `Express.Request`
augmentation in `src/main/interfaces/http/middlewares/authenticate.ts`) while the
use cases expect the `UserRole` union:

```ts
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  STAFF: 'STAFF',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
```

`as any` silences the mismatch instead of resolving it.

### Why it matters

**Role is an authorization input, and `as any` removes the compiler's ability to
check it.** With the cast in place, a typo (`'BUSSINESS_OWNER'`), a stale value
after a role is renamed, or a genuinely invalid string all compile cleanly and
fail silently at runtime — a role comparison that never matches usually means a
permission check that quietly denies, or in the wrong branch shape, quietly
allows. This is the same category of problem as the `(req as any).user?.role`
cast removed from `tenantRoutes.ts` during Phase B Group 1: the moment that cast
was removed, the compiler immediately surfaced a real latent type gap
(`req.user` being optional) that the cast had been hiding. There is no reason to
expect these 24 to be different.

No live bug is known — the values flowing through are real roles from a signed
JWT — so this is a hardening item, not an outage risk.

### Suggested fix

Type the source rather than casting at every use. Narrow the
`Express.Request['user'].role` augmentation in `authenticate.ts` from `string` to
`UserRole`, then delete all 24 casts. The token payload is already typed as
`UserRole` in `TokenPayload` (`src/auth/application/ports/ITokenService.ts`), so
the augmentation is the only place the type is widened — fixing it there is a
one-line change that removes every cast downstream.

**Care required:** `authenticate.ts` populates `req.user` from
`tokenService.verify()`, whose return type is already `TokenPayload`. Confirm no
caller depends on assigning an arbitrary string to `req.user.role` (test doubles
included — see [TD-002], several construct `req.user` by hand) before narrowing.

### Explicitly out of scope when found

Discovered during the Phase B Group 1 `as any` audit, whose remit was tenantId
sourcing. These casts are on `role`, not `tenantId`, so they were deliberately
left alone rather than folded into an unrelated pass.

---

## TD-007 — SINGLE_SELECT custom fields cannot be created from the UI

**Status:** Open
**Raised:** 2026-07-26, during Phase B Group 1 Item 2 (deferred by decision, not overlooked)
**Severity:** Low — a valid backend capability with no way to reach it
**Area:** `frontend/src/pages/settings/ClientSettingsContent.tsx`

### What is missing

`SINGLE_SELECT` is a fully supported backend `FieldType`: the domain entity
validates it, the request schema accepts it, and the repository persists its
`options` array. It is simply absent from the settings dropdown, which offers
only TEXT / NUMBER / DATE / BOOLEAN.

Adding it to the dropdown alone would **not** work. Both the request schema and
the domain entity reject a SINGLE_SELECT with an empty `options` list:

- `src/clients/interfaces/http/schemas/clientSchemas.ts` — `.refine(...)`,
  "Options are required for SINGLE_SELECT fields"
- `src/clients/domain/entities/CustomFieldDefinition.ts` — same rule in `create`

So the dropdown entry and an options editor have to ship together, which is why
this was deferred rather than folded into the BOOLEAN fix: it is new UI, not a
bug fix.

### What is already in place

Most of the work is done and unused:

- `frontend/src/components/ui/CustomFieldInput` already implements a `dropdown`
  variant that renders an `options` array.
- `ClientFormContent` now routes field types through `FIELD_TYPE_TO_INPUT`,
  which already maps `SINGLE_SELECT → 'dropdown'`. Rendering works the moment a
  SINGLE_SELECT field exists.
- `CustomFieldDefinition` in `frontend/src/types/client.ts` carries `options?`.

### What remains

Only the authoring UI in the settings slide-over:

1. Add `<option value="SINGLE_SELECT">` to the field-type dropdown.
2. When SINGLE_SELECT is selected, show an options editor (add / remove / reorder
   rows), disallow submission with zero options, and pass `options` through
   `defineCustomField`.
3. `useDefineCustomField` and `clientService.defineCustomField` currently accept
   `{ fieldName, fieldType }` only — widen to include `options?: string[]`.

Server-side rejection is already correct and, since Item 2, its message is now
surfaced to the user, so a mistake here fails visibly rather than silently.

---

## TD-008 — SuperAdminShell's sidebar was never redesigned after Super Admin lost tenant access

**Status:** Open
**Raised:** 2026-07-26, during Phase B Group 1 Item 3
**Severity:** Low — cosmetic dead ends, no data or security risk
**Area:** `frontend/src/pages/shell/SuperAdminShell.tsx`, `frontend/src/hooks/useNavigation.ts`
**Natural home:** alongside Super Admin tenant management (audit item #14 — create / suspend / remove tenants)

### This is not a routing bug to patch

Phase A Step 3 established that **SUPER_ADMIN gets zero access to any individual
tenant's business data** — it is a platform-level role that administers tenants
themselves, never their Clients, Appointments, Inventory or Quotations. That
decision is correct, deliberate, and enforced in `resolveTenant` with tests in
`tests/integration/tenant/superAdminTenantScope.test.ts`.

Six dead sidebar links pointing at pages Super Admin is now *correctly forbidden
from ever reaching* is not a defect in the links. It is a sign that the shell's
navigation was never revisited after the role's remit changed. Patching it with
better routing would be fixing the wrong layer.

### Current state, concretely

`SuperAdminShell` is mounted at `/admin` and calls the shared `useNavigation`
hook. `SUPER_ADMIN` is not `'STAFF'`, so it falls through to the **owner** list:
Dashboard, Clients, Appointments, Inventory, Quotations, Reports, Settings.

Three things compound:

1. **No tenant slug in the click handler.** `SuperAdminShell` navigates with
   ``onNavItemClick={(id) => navigate(`/${id}`)}`` — no `:tenantSlug` segment,
   unlike `StaffShell` / `BusinessOwnerShell` which use
   ``navigate(`/${tenantSlug}/${id}`)``. So `/clients` matches the `/:tenantSlug`
   route with a slug of `"clients"`, not the clients page.
2. **The shell only routes two paths.** Internally it defines `/` (redirect) and
   `/dashboard`. Nothing else resolves.
3. **The backend would refuse anyway.** Since Step 3 every `/:tenantSlug/...`
   endpoint returns 403 for a null-tenant Super Admin — by design.

Net: **6 of 7 sidebar links are dead ends.** Only Dashboard works.

### Why defer rather than fix now

The right fix is a small design pass on what a platform-level shell should
actually contain — presumably Dashboard plus Tenant Management, matching the
role as defined. That pass is unavoidable when Super Admin tenant management
(create / suspend / remove tenants) is built, because the shell will need real
new links at that point regardless. Doing it twice is wasted work; folding a
redesign into a bug-fixing batch is the wrong scope.

### When picked up

- Give `SUPER_ADMIN` its own nav list in `useNavigation` rather than defaulting
  to `ownerNavItems`. Note the hook currently branches only on `role === 'STAFF'`,
  so every non-staff role silently inherits the owner list — Super Admin is just
  the case where that is visibly wrong.
- Decide the click-handler contract for a shell with no tenant context.
- `useNavigation.test.ts` already asserts no-duplicate-ids for a `SUPER_ADMIN`
  user; extend it to assert the expected link set once that set is decided.

---

## TD-009 — Client list exposes no assigned-staff or status filter

**Status:** Open
**Raised:** 2026-07-26, during Phase B Group 2 Item 1 (deferred by decision)
**Severity:** Low — a required capability that exists end-to-end except for the UI
**Area:** `frontend/src/pages/clients/ClientListContent.tsx`

### What is missing

SRS §6.2 Search & Filter Clients requires two things:

- *"Search by name, contact number, or email"* — **done** in Phase B Group 2:
  a single box sending `search`, matched across all three columns in both
  repository branches.
- *"Filter results by assigned staff or client status"* — **not exposed.**

### Everything below the UI already works

- `SearchClientsFilters` has `assignedUserId` and `status`.
- `searchClientsSchema` validates both (`status` as a `ClientStatus` enum,
  `assignedUserId` as a uuid).
- `ClientController.searchClients` already forwards both to the use case.
- Both repository branches — raw-SQL and Prisma `findMany` — already apply them.

The list view simply never sends them: its effect calls
`fetchClients({ search: debouncedSearchTerm })` and nothing else. There is a
"Filter" button in the toolbar that is currently inert.

### What remains

1. Controls for status (a select over `ClientStatus`) and assignee (a select over
   the tenant staff list — `useTeam().staff` is already fetched on this page for
   the assignee column, so no new request is needed).
2. Include them in the `fetchClients` payload alongside `search`.
3. Add them to `SearchClientsParams` in `frontend/src/types/client.ts`, which
   already carries `assignedUserId` but not as something the page sends.

No backend work. Deferred because it is a small feature with its own UI design
(where the controls live, whether the inert "Filter" button opens a panel),
rather than part of closing the assignment/search gaps Group 2 was scoped to.
