# HRM Doxa identity linking implementation report

Implemented in HRM only. No IAM/SDK files changed. No refresh tokens, provisioning,
email matching, role mapping, unlinking, or relinking were introduced. Nothing was
committed or pushed. Existing uncommitted login/session work was preserved.

## 1. Architecture and inspected structure

`Employee` uses SoftDeletes and belongs to `User` through `employees.user_id`.
`User` is the authenticatable local account, has one employee, and has many
`ExternalIdentity` records. User has a `deleted_at` column but no SoftDeletes
scope, so linking explicitly checks it. Employee detail is a Next.js page backed
by `GET /api/employees/{id}`, already restricted to `hr_admin`.

Ordinary Doxa login remains in `DoxaLoginController` and uses
`LinkedDoxaUserResolver` for exact issuer/subject lookup. Existing password and
Sanctum bearer authentication remain unchanged. Linking requires the `web`
session guard, not a bearer token alone. The web group supplies cookies, session,
CSRF and route bindings. Linking independently checks the local `hr_admin` role,
active status and deletion status on every operation.

## 2. Transaction design

New `doxa_link_transactions` table and model:

- Cryptographically random 256-bit ID, encoded as 64 hex characters.
- Immutable server-selected employee ID, target User ID and initiating admin ID.
- SHA-256 browser-session binding and unique SHA-256 hash of SDK-generated state.
- Creation/expiry timestamps; five-minute lifetime including confirmation.
- Pending, verified, processing, completed, cancelled or failed state; consumed timestamp.
- Authenticated encryption of allowlisted verified issuer, subject, name and email.

The SDK independently retains its existing OAuth transaction and validates state,
nonce, PKCE S256, issuer, audience, signature and replay. HRM stores only the SDK
state hash for correlation, not another OAuth implementation. No tokens, codes,
secrets, verifier or nonce are saved in the HRM transaction. The SDK removes
callback query data; HRM captures only the state hash before validation and uses
it after successful SDK validation. Wrong-session requests cannot consume the
owner's transaction.

## 3. Routes

| Method | Route | Behavior |
| --- | --- | --- |
| POST | `/auth/doxa/employees/{employee}/link` | Authorize admin, resolve employee/user, create transaction, SDK `prompt=login` |
| GET | `/auth/doxa/link/callback` | Dedicated verified callback, no mapping |
| GET | `/auth/doxa/link/{id}` | Session-bound allowlisted confirmation data |
| POST | `/auth/doxa/link/{id}/confirm` | Claim, recheck, map, audit, consume atomically |
| POST | `/auth/doxa/link/{id}/cancel` | Consume pending/verified request without mapping |

Routes extend the existing `/auth/doxa` web/session convention, use no-store and
no-referrer SDK middleware, and are throttled. POSTs require CSRF. JSON initiation
returns the SDK authorization URL for browser navigation; ordinary form requests
receive the SDK redirect. Next rewrites forward the nested auth routes.

## 4. Resolution and access eligibility

The route employee resolves to `Employee.user_id`. Callback and confirmation
resolve both original records again, verify the relationship has not changed,
and reject missing, deleted or inactive local accounts. User IDs, identity keys,
email and destinations submitted by the browser are rejected on mutations.

The only mapping key is exact `(issuer, subject)`. Profile email never selects a
local user. Existing binary/exact identity columns and their unique constraint
remain the authority. The current configured Doxa issuer must match exactly.

The SDK has no application-access recheck interface. Read-only inspection of the
existing IAM implementation established that OIDC subject is `User.public_id`
and the existing endpoint is:
`GET /api/admin/users/{public_id}/applications?application_ids[]=...&per_page=1`.
HRM's new adapter requires the returned application ID to match exactly and
`effective_access` to be boolean true. It rechecks at callback and confirmation,
and fails closed on missing configuration, revocation, malformed data, transport
failure or an invalid identity. It uses the SDK's dedicated TLS transport, which
avoids Laravel HTTP diagnostic events, redirects and raw credential exceptions.

## 5. Confirmation

Callback stores the verified identity and redirects to
`/employees/doxa-link/{opaque-id}`. The page displays local employee name, verified
profile name/email when available, exact issuer and subject, the requested
confirmation message, and Confirm link/Cancel. React escapes displayed strings.
POST bodies contain no identity, target or destination. The page never exposes
OAuth credentials or session internals. Callback failures redirect browser users
to a fixed recovery page; JSON clients receive only a safe category.

## 6. Final mapping and conflicts

Confirmation locks the transaction and performs a compare-and-set claim within
one database transaction. It locks/rechecks admin, employee, target and identity
rows, reads current IAM eligibility, checks expiry again after the network read,
and creates the mapping only after all checks. Mapping, success audit and consumed
state commit together. Deadlock retries remain within the same operation.

- Unlinked identity: create exact mapping.
- Same identity already on same user: succeed without duplicate.
- Identity on another user: reject; never move it.
- Target already has another identity from configured Doxa issuer: reject.
- Inactive/deleted target or changed Employee/User relationship: reject.
- Expired, replayed or mismatched transaction: reject.
- Admin authorization lost or IAM access lost: reject.
- Concurrent insert: existing database uniqueness prevents duplicate identity ownership.

Cancellation claims pending/verified state, records a cancellation audit and
consumes the transaction. It never writes ExternalIdentity. Failed owned requests
become terminal; mismatched browsers cannot cancel/fail the owner's request.

## 7. Audit infrastructure

Existing `audit_logs` migration/model were inspected. The model is fully guarded
and there was no audit-writing service. The new allowlisted writer uses that
existing table; no parallel logging system was created.

Events: `doxa.link.initiated`, `doxa.link.succeeded`, `doxa.link.failed`,
`doxa.link.cancelled`. Records contain actor, target User, original admin,
employee, verified issuer/subject when available, timestamps and safe failure
category. Pre-identity failures have null issuer/subject. Request bodies, URLs,
OAuth state, provider responses and raw exceptions are not audit payloads.
An audit failure rolls back successful linking rather than committing unaudited
mapping. Existing OAuth exclusions for Telescope/Debugbar cover nested routes.

## 8. UI

Employee detail returns only configured Doxa issuer's safe identity fields in
`doxa_identities`. The Doxa Identity section shows Not linked and an active
admin-only Link Doxa account button, pending navigation/error states, or Linked
with exact issuer/subject. Success text requires an actual mapping in the fetched
detail. Confirmation has pending/disabled actions and recovery messages.

## 9. Exact implementation files

Created:

- `backend/app/Auth/DoxaApplicationAccess.php`
- `backend/app/Auth/DoxaLinkAudit.php`
- `backend/app/Auth/DoxaLinkClient.php`
- `backend/app/Auth/DoxaLinkFailure.php`
- `backend/app/Http/Controllers/DoxaLinkController.php`
- `backend/app/Models/DoxaLinkTransaction.php`
- `backend/database/migrations/2026_10_08_000000_create_doxa_link_transactions_table.php`
- `backend/tests/Feature/DoxaApplicationAccessTest.php`
- `backend/tests/Feature/DoxaLinkTest.php`
- `backend/tests/Fixtures/confirm-link-worker.php`
- `frontend/components/DoxaIdentity.tsx`
- `frontend/app/(dashboard)/employees/doxa-link/[id]/page.tsx`
- `frontend/tests/doxa-link.test.cjs`
- This report and the working-tree diff/stat snapshots.

Extended existing files (including files already untracked before this task):

- `backend/.env.example`
- `backend/config/hrm.php`
- `backend/routes/web.php`
- `backend/app/Http/Controllers/EmployeeController.php`
- `backend/tests/Fixtures/OidcProviderTransport.php`
- `frontend/next.config.js`
- `frontend/app/(dashboard)/employees/[id]/page.tsx`

## 10. Validation

| Check | Result |
| --- | --- |
| Complete HRM PHPUnit suite (`php artisan test`) | 100 passed, 734 assertions |
| Dedicated linking/access tests | 19 passed, 246 assertions |
| Existing real-SDK OIDC regression tests | Passed in full suite |
| Two actual concurrent PHP workers, same transaction and different target users | Passed; one 200 and one 409, one mapping |
| Frontend tests (`node --test tests/*.test.cjs`) | 17 passed |
| TypeScript (`npx.cmd tsc --noEmit`) | Passed |
| Production build (`npm.cmd run build`) | Passed, exit 0; Next reported an edge compiler SIGTERM warning before successful compilation |
| `composer validate --strict` | Passed |
| `composer check-platform-reqs` | Passed |
| PHP syntax across application/routes/config/database/tests | Passed, 148 PHP files |
| `git diff --check` | Passed |

Concurrency tests use a real shared SQLite file and separate processes, not only
sequential mocks. MySQL-specific deployment concurrency has not been exercised.
Frontend tests execute component behavior using the existing Node/TypeScript VM
test approach; they are not real-browser DOM tests.

## 11. Live browser result and deployment prerequisites

**Not performed.** No approved live URLs/test credentials or configured read
credential were provided. No local listeners were found on the usual HRM/IAM
ports during inspection, and this session has no browser automation connector or
installed browser test runner. Simulated provider tests are not claimed as live
IAM validation. No actual environment or production database migration was run.

Before deployment:

1. Confirm the dedicated HTTPS callback is already registered for the existing
   HRM OAuth client. This task did not change IAM configuration.
2. Set `DOXA_LINK_REDIRECT_URI`, `DOXA_HRM_APPLICATION_ID` and server-only
   `DOXA_ACCESS_READ_TOKEN`; apply the HRM migration through the normal process.
3. Obtain explicit deployment approval for the IAM read credential. The existing
   endpoint requires central IAM admin authorization; HRM must not silently gain
   that credential. A least-privilege service-read capability is not present in
   the inspected SDK/API and remains an architectural gap for teams unwilling
   to use the existing authorized endpoint. Linking stays fail closed otherwise.
4. Preserve HTTPS secure/httpOnly cookies, server-side session/cache, and the
   existing same-origin frontend proxy configuration.
5. Run the positive live path with an existing local employee and an unlinked IAM
   test identity with effective HRM access. Inspect prompt=login, confirmation,
   exact mapping and audit. Then use an identity linked to another local user and
   verify rejection without mapping movement or user creation.

## 12. Remaining security policy

Unlink/relink requires a separate policy for authorization, recovery, revocation,
notification and audit; neither is implemented. Define retention/pruning for
expired linking records and encrypted profile data. IAM access is checked freshly
at confirmation, but HRM and IAM cannot share an atomic database commit; a remote
revocation immediately after the read is a distributed-systems race. Subsequent
ordinary login remains subject to IAM issuance eligibility and local activity.
Infrastructure access logs must omit credential-bearing callback queries, as for
the existing OIDC login flow.

## 13. Full diff/stat

`doxa-link-working-tree.patch` and `doxa-link-working-tree-stat.txt` capture the
full current tracked diff plus untracked source additions. They include the
pre-existing uncommitted work listed at task start and this report; snapshot
files themselves are excluded to avoid recursive growth. This is a working-tree
snapshot against HEAD, not a claim that all included changes originated here.
