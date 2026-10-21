# HRM pending-link completion — 2026-10-17

## Account-resolution update — 2026-10-21

The pending-link protocol below is retained. Ordinary login now uses an additive
SDK access-checked account-resolution API and explicit HRM first-login policy.
See [DOXA_ACCOUNT_RESOLUTION.md](DOXA_ACCOUNT_RESOLUTION.md) for the current
provisioning, verified-email, collision, default-role and operator-linking contract.
The later explicitly authorized local administrator link and its audit are
recorded in `LOCAL_IAM_VERIFICATION.md`. The historical no-provisioning statements below
describe the original pending-link implementation, not the new ordinary-login
policy. The shared SDK now has additive resolution APIs and host-interface tests;
existing ordinary and managed-link APIs remain compatible.

## Repository scope

Backend and frontend share Git root `C:/Users/Alif Computer/Documents/Github/doxa-hrms`.
The frontend is `frontend/`; it is not a separate repository. Final review and
commit preparation were performed on 2026-10-18. Existing untracked `backend/docs/`
files are historical work and are preserved outside this commit.
The sibling `user-management-system` repository and SDK were read only.

## Flow and SDK contract

The existing employee initiation button, registered linking callback, web/CSRF
middleware, local administrator checks, external identity table and audit table
are reused. Only active, undeleted local HR administrators with a matching server
session can initiate, inspect, confirm or cancel a link for the selected employee.

SDK APIs used:

- `ManagedLoginPolicy::pendingLink($transactionId)`
- `AuthorizationOptions::reauthenticate()`
- `DoxaClient::beginManagedLogin($policy, $options)`
- `DoxaClient::handleManagedCallback($request)`
- `ManagedLoginResult::identity()` and `credentialContext()`
- `DoxaClient::restoreCredentialContext($protectedReference)`
- `DoxaClient::completePendingLink($pendingContext)`
- `CredentialContext::serverReference()`

The host binding implements `PendingLinkHostBinding`, registered under
`CredentialHostBinding`: `capture`, `validate`, `complete` (ordinary binding is
rejected), `claimPendingLink`, `commitPendingLink`, `verifyPendingLinkCommit`,
and `abortPendingLink`.

The SDK itself performs a fresh client-bound `/oauth/application-access` check
during `completePendingLink`; HRM does not supply a prior access decision or use
the legacy administrator access-read API for linking. Callback validation alone
creates no mapping. Only an explicit CSRF-protected confirmation POST authorizes
completion. Exact issuer/subject, SDK context, client, initiating administrator,
browser session, local target, deadline and attempt are rechecked.

Mapping creation, the mapping audit and committed transaction state share a local
transaction. Existing `(issuer, subject)` uniqueness is retained; `(user_id,
issuer)` uniqueness also prevents conflicting identities for a local account.
Existing conflicting data causes migration failure instead of being overwritten.
No email matching, provisioning, role mapping or automatic target login is added.

## Durability and recovery

The SDK and HRM database are separate durability boundaries. No HTTP call or SDK
store mutation runs inside the HRM mapping transaction.

A newly committed mapping remains provisional (`pending_link_id`) and cannot be
used for OIDC login or displayed as linked. After acknowledged SDK promotion, the
complete opaque replacement reference is encrypted in the host ledger, the
mapping is released and the success audit is inserted in one host transaction.
Only this durable receipt permits a success response.

Lost mapping-commit acknowledgements are verified read-only by exact attempt.
Lost SDK promotion acknowledgements use the SDK's exact activation reconciliation.
A repeated confirmation returns the existing validated receipt or HTTP 202 while
an attempt is processing, without repeating mapping creation or the access check.
A failed final receipt commit leaves the mapping provisional. The host never
reconstructs a proof from SDK record IDs or stored hashes.

`doxa:reconcile-links`, scheduled every minute, polls durable transaction state.
After cancellation, explicit abort or the original pending deadline, it fences
the attempt, compensates only its own provisional mapping, and conditionally
erases that SDK context using `CredentialStore::metadata` and
`delete(id, version, 'unusable')`. Storage outages and version conflicts leave
durable work for retry. SDK-purged contexts are handled without reviving them.
Existing valid mappings and completed receipts are never compensated. Ordinary
completed-context validation also rejects use of the target's context by the
initiating administrator. Completion never extends SDK deadlines.

The confirmation screen keeps its existing styling and adds processing feedback,
read-only result checks, safe timeout recovery, direct receipt redirects and a
same-tick submission guard. Errors remain generic and announced with `role=alert`.

## Deployment requirements and limits

1. Run normal HRM migrations, including the new host ledger/uniqueness migration.
   Existing pending identity-only link attempts are invalidated; users restart.
2. Configure `DOXA_CREDENTIALS_ENABLED=true`, a dedicated random 32-byte
   `DOXA_CREDENTIAL_KEY`, its nonsecret `DOXA_CREDENTIAL_KEY_ID`, and a supported
   named `DOXA_CREDENTIAL_CONNECTION`. No APP_KEY fallback is used for SDK keys.
3. The provided `doxa_credentials` connection uses a persistent SQLite file at
   `DOXA_CREDENTIAL_DATABASE` (blank defaults to `database/doxa-credentials.sqlite`).
   Create this private file before installation. A named PostgreSQL connection
   can be selected instead. SDK storage rejects MySQL/MariaDB and in-memory SQLite;
   the existing HRM business database can remain separate. Use shared PostgreSQL
   for multiple application servers rather than assuming local SQLite is shared.
4. Explicitly install the optional SDK schema with
   `php artisan migrate --path=database/doxa`. This path is deliberately outside
   automatic HRM migrations and refuses installation while credentials are disabled.
   Do not additionally publish/install a duplicate SDK credential-table migration.
5. Keep the HTTPS linking callback registered for the configured OAuth client,
   secure server-side sessions, persistent SDK authorization cache and normal
   Laravel scheduler running. SDK credential cleanup is scheduled when enabled.
   Monitor reconciliation failures and retry after storage recovers. A lost proof
   requires consuming the unfinished attempt and fresh authorization, never replay.

No production database/configuration was changed. The local live IAM linking and
fresh sign-in checks subsequently passed on two labelled verification accounts
using PostgreSQL, as recorded in `LOCAL_IAM_VERIFICATION.md`. Automated tests use
the real SDK with simulated provider HTTP and persistent SQLite credential storage.
Production deployment and normal-browser CA trust remain unverified. Existing
identity-only OIDC login is retained.

## Historical implementation validation (2026-10-17)

Finalization on 2026-10-18 reran the full backend suite: **117 tests / 1,028
assertions passed**, including stronger same-session exact receipt, unchanged
audit/mapping, expiry and recovery assertions. Frontend: **22 passed**; TypeScript,
Pint on every changed/new PHP file, and whitespace checks passed. ESLint remains
blocked by the existing ESLint 8 configuration incompatibility below.

Read-only local PostgreSQL inspection preserved both labelled live mappings and
their single mapping-commit/success audits. Live duplicate status could not be
re-recorded because the HTTPS listener is stopped and the transactions are expired;
the exact same-session 200 receipt replay passed in isolated real-SDK tests.
Chrome without overrides received connection refusal at port 3443. Windows chain
validation returned false (`PartialChain` plus unavailable revocation status).
Normal-browser CA trust remains a manual check; no trust-store changes were made.
See `LOCAL_IAM_VERIFICATION.md` for exact current evidence and historical results.

The following counts are historical, not the final rerun:

- `php artisan test --compact`: 116 passed, 935 assertions.
- Frontend `node --test tests/auth-storage.test.cjs tests/doxa-link.test.cjs tests/session-auth.test.cjs`:
  22 passed.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed.
- Laravel Pint on all changed/new PHP files: passed after formatting.
- `git diff --check`: passed; complete tracked diffs and new source files reviewed.
- ESLint could not run: existing `eslint.config.mjs` imports `eslint/config`,
  which installed ESLint 8.57.1 does not export. No unrelated tooling was changed.

Backend tests cover confirmation, binding substitutions, access denial/missing/
malformed/unavailable decisions, uniqueness, expiry, cancellation, callback replay,
idempotent receipts, transactional audit rollback, host and SDK acknowledgement
loss, receipt-persistence failure, durable recovery and outages, preservation of
valid mappings, provisional-login denial, local admin and CSRF rejection, ordinary
OIDC regression behavior and two independent confirmation processes. Frontend
tests cover confirmation/cancel, duplicate dispatch, processing, timeout recovery,
expiry, receipt redirects, and secret-free UI output.

## Changed files in doxa-hrms

Backend:

- `.env.example`
- `app/Auth/DoxaLinkHost.php` (new)
- `app/Auth/LinkedDoxaUserResolver.php`
- `app/Console/Commands/ReconcileDoxaLinks.php` (new)
- `app/Console/Kernel.php`
- `app/Http/Controllers/DoxaLinkController.php`
- `app/Http/Controllers/EmployeeController.php`
- `app/Models/DoxaLinkTransaction.php`
- `app/Providers/AppServiceProvider.php`
- `config/database.php`
- `config/doxa.php`
- `database/migrations/2026_10_17_000000_complete_doxa_link_protocol.php` (new)
- `database/doxa/2026_10_17_000001_create_doxa_credential_contexts.php` (new)
- `tests/Feature/DoxaLinkTest.php`
- `tests/Feature/DoxaLoginTest.php`
- `tests/Fixtures/confirm-link-worker.php`
- `tests/Fixtures/DoxaCredentialAckConnection.php` (new)
- `tests/Fixtures/DoxaLinkFaultHost.php` (new)
- `DOXA_LINK_IMPLEMENTATION.md` (this report)

Frontend:

- `app/(dashboard)/employees/doxa-link/[id]/page.tsx`
- `tests/doxa-link.test.cjs`

SDK repository: no files changed during the original pending-link task. Later
account-resolution changes are recorded in `DOXA_ACCOUNT_RESOLUTION.md`.
