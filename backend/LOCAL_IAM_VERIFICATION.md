# Local IAM–HRM verification — 2026-10-17

## Finalization evidence — 2026-10-18

The shared Git root was rechecked as `doxa-hrms`, branch `main`. No changes
were initially staged. No IAM repository files or running IAM services were
modified during finalization. No idempotency defect was found; application
implementation was preserved and the existing replay test was strengthened.

### Exact same-session confirmation replay

Live replay could not be re-recorded: `https://localhost:3443` refused the
connection and both completed verification transactions are past their original
five-minute deadlines. Matching original session files still exist, but their
presence does not establish a currently authenticated browser session. No
transaction deadline or session was revived and no live mapping was created or
removed. The earlier live duplicate-request status remains unverified.

The isolated real-SDK feature test
`test_confirmation_checks_access_once_and_receipt_replay_does_not_check_again`
repeats the same empty confirmation POST for the same completed transaction with
the same retained session cookie. Both requests return 200 with exactly the same
receipt. Assertions verify one unchanged mapping, unchanged total audit count,
exactly one mapping-commit audit and one success audit, one application-access
check, and a response containing only `status` and `destination`. After advancing
six minutes, the same POST returns 409 `transaction_expired`; reconciliation
preserves the completed mapping and transaction. Rejected requests may produce
separate failure audits; they never repeat the success/commit audit.

Existing cancellation tests return 409 on confirmation after cancellation;
conflicting mappings, other sessions, concurrent confirmation, acknowledgement
loss, failed receipt persistence, recovery, CSRF, and local authorization are
covered in the rerun suite. The local-role regression specifically retains
`applicant` and rejects the employee API with 403 after IAM sign-in.

Read-only live database inspection still found exactly two released mappings
for fixture users 52/53, one mapping-commit and one success audit each, and local
role `applicant` for both. A scoped disclosure scan found zero matching HRM log
files for configured keys and 51 session identifiers. No SDK token values remained
to sample after cleanup; this is not an exhaustive historical log guarantee.

### Certificate trust

Installed Google Chrome was launched headlessly with default certificate
validation and no certificate overrides. Navigation to the exact HTTPS login
origin failed with `ERR_CONNECTION_REFUSED`; this does not verify browser trust.
Windows `X509Chain.Build` against the existing local server certificate returned
false: `PartialChain`, `RevocationStatusUnknown`, `OfflineRevocation`. Its expiry
is 2026-11-16. System trust was not established by this check. No root was installed,
no certificate bypass was used, and no HTTPS requirements were weakened.
Normal desktop-browser verification remains a manual check once services run.

### Actual final checks

- `php artisan test --compact`: **117 passed, 1,028 assertions**, 41.00 seconds
  after strengthening the existing replay test. The preliminary rerun before
  that test change passed 117 tests / 1,015 assertions.
- `node --test tests/auth-storage.test.cjs tests/doxa-link.test.cjs tests/session-auth.test.cjs`:
  **22 passed**, zero failures/skips.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed.
- `php backend/vendor/bin/pint --test` with every changed/new PHP path: passed.
- `git diff --check`: passed. Tracked implementation diffs, new source/test files,
  and both reports were reviewed; the staged diff is reviewed before commit.
- `node node_modules/eslint/bin/eslint.js .`: blocked by the existing
  `ERR_PACKAGE_PATH_NOT_EXPORTED` for `eslint/config` with ESLint 8.57.1.
  No tooling migration was attempted.

Existing untracked `backend/docs/` checkpoint documents and diff snapshots remain
outside the intended commit. They contain historical contracts and are superseded
by these two current reports. Ignored local helpers and private material are not
staged. The commit includes only the reviewed HRM implementation, tests and reports.

Production still requires the migrations, supported durable credential storage,
dedicated protected keys, registered HTTPS callbacks, trusted TLS, secure shared
sessions/cache as appropriate, scheduler/reconciliation monitoring and sanitized
access logs described in `DOXA_LINK_IMPLEMENTATION.md`. Production-like transport
and deployment remain unverified. No live IAM outage was injected; deterministic
failure/recovery tests passed. This is not complete production-readiness approval.

The real browser-based linking and subsequent IAM sign-in passed against the
running local IAM database and SDK. This report supersedes the earlier
implementation report's statement that live verification had not been performed.
Testing used headless Google Chrome through the installed Playwright package;
provider HTTP was not mocked for these browser checks.

## Configuration and running services

The pre-existing IAM backend advertised `http://localhost:8002` and its public
HRM OAuth client registered only `http://localhost:8000/auth/doxa/callback`.
Those HTTP services were retained. No IAM or SDK source/environment file was edited.

The SDK requires HTTPS. A workspace-local TLS proxy and a separate IAM PHP worker
now provide:

| Service | Local endpoint |
| --- | --- |
| HRM public browser origin | `https://localhost:3443` |
| HRM Next development server | `http://127.0.0.1:3000` |
| HRM Laravel server | `http://127.0.0.1:8000` |
| Exact IAM issuer | `https://localhost:8443` |
| IAM verification worker | `http://127.0.0.1:8003` |
| Existing IAM login UI/API | `http://localhost:3001` / `http://localhost:8002` |
| Ordinary OAuth callback | `https://localhost:3443/auth/doxa/callback` |
| Linking OAuth callback | `https://localhost:3443/auth/doxa/link/callback` |

Existing OAuth client `01a113a7-739f-7071-bc0a-52006dd27e74` is public and uses
S256 PKCE with no client secret. Both HTTPS callbacks were added through the
authenticated IAM administrator API, preserving the existing HTTP callback.
This changed local IAM registration data and generated its normal audit activity;
it did not change repository files or application assignments.

The IAM worker receives its HTTPS issuer, application URL, secure-cookie and
diagnostic settings as process environment overrides. It reads the existing IAM
configuration and database. The original IAM login UI/API remain HTTP loopback
services; this is a local verification setup, not production HTTPS deployment.

`backend/.env` now contains the HTTPS issuer/client/callback settings, a dedicated
random managed-credential encryption key and key identifier, PostgreSQL credential
connection selection, secure named HRM session cookie, local stateful origins,
and disabled debug/Telescope/Debugbar diagnostics. Secret values are omitted here.
`frontend/.env.local` adds `HRM_BACKEND_URL=http://127.0.0.1:8000` for reliable
IPv4 server-side rewrites. Both environment files are ignored by Git.

TLS private material, helper scripts, protected backups and sanitized results are
under ignored `backend/storage/app/local-integration/`. The local certificate is
valid for 30 days. PHP trusts its CA through a process-scoped additional INI file;
SDK certificate verification remains enabled. Chrome verification used the exact
local certificate's SPKI pin, not a global ignore-certificate-errors setting.
No system trust-store changes were made. Normal desktop-browser trust is not
established; see the 2026-10-18 finalization evidence below.

## Database and recovery

Before migration, both environment and `current_database()` checks confirmed
local PostgreSQL at `127.0.0.1:5432`, database `doxa_hrms`, with `APP_ENV=local`.
No development migration was run against a production target.

Executed successfully:

```text
php artisan migrate:status
php artisan migrate --pretend
php artisan migrate
php artisan migrate --path=database/doxa
php artisan schedule:list
php artisan doxa:reconcile-links
php artisan doxa:credentials:cleanup
```

The two pending HRM link migrations and the SDK credential schema are installed.
SDK readiness passed using PostgreSQL, through its dedicated connection/PDO;
neither in-memory SQLite nor MySQL is used for local managed credentials.

`php artisan schedule:work` remains running. Both scheduled commands run every
minute: `doxa:reconcile-links` and `doxa:credentials:cleanup`. Reconciliation was
also run twice consecutively after live testing. Completed mappings and their
single success audits survived recovery and credential expiry/cleanup.

## Live outcomes

Two explicitly prepared, labelled verification accounts were used instead of
associating IAM identities with arbitrary existing employees. This was manual
local test setup, separate from OAuth callbacks; neither account was provisioned
from an IAM login. Their local passwords are null and roles remain `applicant`.

| Local HRM fixture | Employee / user | IAM identity used | Final result |
| --- | --- | --- | --- |
| `hrm-verification-hara@example.test` | employee 51 / user 52 | seeded Hara account | confirmed mapping; IAM login works |
| `hrm-verification-negative@example.test` | employee 52 / user 53 | seeded central IAM administrator | cancellation first; later confirmed mapping; IAM login works |

Verified with real browser interactions and database inspection:

- Existing local HR administrator password login returned 200. Cookie-only
  `/api/auth/me` returned the active local `hr_admin` account.
- Linking started from the employee screen and redirected to IAM. IAM login and
  consent completed using the existing registered client.
- SDK callback validation returned to HRM and displayed the exact verified issuer
  and subject. Name/email are absent with the configured `openid`-only scope;
  the confirmation screen correctly uses its existing fallback text.
- No mapping existed from callback alone. The explicit Confirm link action
  returned 200. The SDK's authenticated application-access GET returned 200 with
  exactly `{"effective":true}`.
- There are exactly two released external mappings, both for issuer
  `https://localhost:8443`, with `pending_link_id=null`. Each has exactly one
  `doxa.link.mapping_committed` audit and one `doxa.link.succeeded` audit.
- New, separate browser sessions signed in through IAM as HRM users 52 and 53.
  Both `/api/auth/me` requests returned 200 with local role `applicant`; the
  admin-only employee API returned 403. No legacy local bearer token was present
  in browser storage for these IAM sign-ins. IAM administrator status did not
  become an HRM administrator role.
- Cancellation returned 200; a subsequent confirmation attempt returned 409.
- Before its later explicit link, the central IAM identity was unlinked and its
  ordinary HRM callback returned 403 `access_denied`, without provisioning a user.
- The seeded Sara account, which has no effective HRM assignment, authenticated
  at IAM (200), but its consent POST returned 401 `access_denied`. It did not
  reach the HRM callback or create a Sara mapping. This local IAM denial was 401,
  not an invented 403 or a fabricated application-access decision.
- Replaying completed/consumed references from another local session returned
  409. Starting another link for an already linked account returned 409
  `target_already_linked`. Mapping and success-audit counts stayed unchanged.
- Missing-CSRF browser mutations returned 419; anonymous linking reads returned
  403. HRM session cookies were Secure, HttpOnly and SameSite Lax.

The same-session duplicate confirmation POST was sent by the live harness after
each successful UI confirmation. Its status recording hit a harness-only
`Response.status()` versus `Response.status` error after the request returned;
the database still contained one mapping/success audit per account. The harness
has been corrected. Exact same-session 200 receipt replay remains covered by the
newly executed automated suite; its live status was not re-recorded, and should
not be represented as a fully passing uninterrupted browser-script assertion.
The independent fresh-browser IAM sign-in checks above did complete successfully.

Conflict/uniqueness, rollback/audit atomicity, uncertain promotion acknowledgement,
and exact idempotent recovery were verified by the newly executed existing tests.
No live network-outage or process-kill fault was injected into the successful
IAM flow. Existing employees' identity mappings were not changed.

## Concrete issues found

1. Laravel's `redirect()` built an absolute callback destination using the
   internal backend origin. That sent the browser away from the Next confirmation
   screen after successful SDK verification. The only application change in this
   task makes both linking callback outcomes relative `RedirectResponse`s, matching
   the ordinary OIDC login controller. Tests now assert exact relative Location
   headers for success and error redirects.
2. The PHP development server emitted the application-access body without an
   explicit length. PHP's streamed HTTP reader returned the complete 18-byte JSON
   body, then empty reads while EOF remained false. The SDK correctly failed
   closed before a mapping commit. The local HTTPS proxy now buffers this small
   endpoint response and supplies its exact Content-Length without changing its
   status or body. The same streamed read then ended cleanly and real completion
   succeeded. No SDK code or validation was weakened.

## Historical live-verification validation (2026-10-17)

- Backend: `php artisan test --compact` — **117 passed, 1,015 assertions**.
- Frontend: `node --test tests/auth-storage.test.cjs tests/doxa-link.test.cjs tests/session-auth.test.cjs`
  — **22 passed**.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false` — passed.
- Pint on this task's changed controller/tests — passed.
- `git diff --check` — passed.
- ESLint was attempted again and remains blocked by the existing configuration:
  installed ESLint 8.57.1 does not export `eslint/config` imported by
  `eslint.config.mjs`. No unrelated tooling changes were made.

HRM log checks found no matches for the configured keys or sampled live SDK
credentials/session identifiers. One check covered two still-retained SDK token
values and 45 session identifiers; the final check covered 50 session identifiers
after SDK credential cleanup had removed the sampled tokens. Confirmation JSON
exposed no credential/session/token fields. This is scoped verification, not a
claim to have exhaustively checked every historical or external log. Existing
password login intentionally returns its legacy HRM bearer token; that pre-existing
authentication contract was not rewritten or confused with retained SDK tokens.

## Commands used to leave services running

Use separate PowerShell terminals so IAM process overrides do not leak into HRM:

```powershell
# HRM backend working directory
$env:PHP_INI_SCAN_DIR='C:/Users/Alif Computer/Documents/Github/doxa-hrms/backend/storage/app/local-integration/tls'
php artisan serve --host=127.0.0.1 --port=8000 --no-reload

# HRM frontend working directory
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000

# HRM repository root; local TLS listeners on 3443 and 8443
node backend/storage/app/local-integration/https-proxy.cjs

# IAM backend working directory; source stays unchanged
$env:OIDC_ISSUER='https://localhost:8443'
$env:APP_URL='https://localhost:8443'
$env:APP_DEBUG='false'
$env:LOG_CHANNEL='stderr'
$env:SESSION_SECURE_COOKIE='true'
$env:VIEW_COMPILED_PATH='C:/Users/Alif Computer/Documents/Github/doxa-hrms/backend/storage/framework/views'
php -S 127.0.0.1:8003 -t 'C:/Users/Alif Computer/Documents/Github/user-management-system/backend/public' 'C:/Users/Alif Computer/Documents/Github/doxa-hrms/backend/storage/app/local-integration/iam-router.php'

# HRM backend working directory
php artisan schedule:work
```

## Scope and release-readiness limits

This task changed ignored `backend/.env` and `frontend/.env.local`, added ignored
local TLS/test helpers, changed the callback controller and its regression tests,
and added this report. All earlier implementation work remains intact. Backend
and frontend share the `doxa-hrms` Git root. No staging, commit or push occurred
during that earlier live-verification phase; finalization is recorded below.
The IAM Git status remains its original four untracked documentation files, with
no tracked diff. Local OAuth registration/session/audit data changed as described.

The local core linking/sign-in flow passed. A normal desktop-browser run with a
trusted local CA, exact same-session replay status recording, and production-like
transport/outage verification remain distinct release-readiness checks. This task
did not migrate a production database or establish a production TLS deployment.
The user's eventual intended real employee association remains a separate choice;
the two labelled verification mappings were preserved rather than removed.

Historical Git status snapshots from 2026-10-17 follow; these are not the final
status after the 2026-10-18 finalization commit.

### doxa-hrms

```text
 M backend/.env.example
 M backend/app/Auth/LinkedDoxaUserResolver.php
 M backend/app/Console/Kernel.php
 M backend/app/Http/Controllers/DoxaLinkController.php
 M backend/app/Http/Controllers/EmployeeController.php
 M backend/app/Models/DoxaLinkTransaction.php
 M backend/app/Providers/AppServiceProvider.php
 M backend/config/database.php
 M backend/config/doxa.php
 M backend/tests/Feature/DoxaLinkTest.php
 M backend/tests/Feature/DoxaLoginTest.php
 M backend/tests/Fixtures/confirm-link-worker.php
 M frontend/app/(dashboard)/employees/doxa-link/[id]/page.tsx
 M frontend/tests/doxa-link.test.cjs
?? backend/DOXA_LINK_IMPLEMENTATION.md
?? backend/LOCAL_IAM_VERIFICATION.md
?? backend/app/Auth/DoxaLinkHost.php
?? backend/app/Console/Commands/ReconcileDoxaLinks.php
?? backend/database/doxa/2026_10_17_000001_create_doxa_credential_contexts.php
?? backend/database/migrations/2026_10_17_000000_complete_doxa_link_protocol.php
?? backend/docs/browser-session-preparation.md
?? backend/docs/csrf-boundary.md
?? backend/docs/doxa-identity-linking.md
?? backend/docs/doxa-link-working-tree-stat.txt
?? backend/docs/doxa-link-working-tree.patch
?? backend/docs/doxa-oidc-login.md
?? backend/tests/Fixtures/DoxaCredentialAckConnection.php
?? backend/tests/Fixtures/DoxaLinkFaultHost.php
```

### user-management-system (unchanged)


```text
?? docs/client-application-access.md
?? docs/lifecycle-hardening-verification.md
?? docs/user-lifecycle-contract.md
?? docs/user-management-implementation-plan.md
```
