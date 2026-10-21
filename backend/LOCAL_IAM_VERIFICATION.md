# Local IAM–HRM verification — 2026-10-17

## Authorized existing administrator link applied — 2026-10-21

The user explicitly authorized this specific one-time identity association in the
subsequent implementation task. Before writing, local tools independently
rechecked issuer `https://localhost:8443`, IAM database user 292's pinned immutable
subject (SHA-256 prefix `bad67a5504af`), active IAM lifecycle, effective HRM access,
non-revoked client and registered callback. HRM target was selected by **ID 1**,
then checked active, undeleted and `hr_admin`; email was only a corroborating
attribute. There were no subject/target mapping conflicts. PostgreSQL unique
indexes and the audit table were present. Both repositories' working trees were
inspected and preserved; no application/SDK security policy was changed.

The existing `doxa:link-existing` dry run passed with the reviewed plan hash.
The existing command was then invoked with `--apply --verified --confirm` using
the explicitly authorized selection, within an outer transaction that checked
protected-data postconditions before commit. `--verified` recorded attestation
after the independent checks; it was not used as proof of identity by itself.
The first local preflight stopped before writes because its child IAM helper
inherited HRM environment values; isolating that child with IAM's own parsed
environment fixed the ignored runner, without service or application changes.

Committed at 2026-10-21 15:32:41 (database timestamp): **mapping ID 3**, issuer as
above, IAM user 292's exact subject, existing HRM **user 1**, released
(`pending_link_id=NULL`). **Audit ID 39**, action `doxa.link.operator_linked`,
records actor 1, target 1 and the exact reviewed plan hash. Independent read-only
inspection after commit confirmed the mapping and exactly one matching audit.
No repeated live apply was executed.

All **38 protected HRM tables** (every public application table except the two
intended mapping/audit tables) had identical content digests before and after the
operation, compared in memory only. This includes users/passwords/local roles,
permissions/assignments and business data. Old mapping and audit rows were also
unchanged. Counts after commit: **53 users, 52 employees, 3 mappings**. No new user
or employee, password/role/status/permission change, IAM grant change, or email
verification change occurred.

Full HRM suite rerun: **143 tests / 1,250 assertions passed**. Strengthened the
existing administrator fixture test: after explicit trusted linking, two fresh
OIDC logins with an unverified/colliding email resolve the same administrator
without duplicate users, mappings or operator audit. Existing suite coverage
also checks conflicts, rollback/audit failure, email-only denial, revoked access,
state/nonce/signature/issuer/audience/PKCE and local session security. Scoped Pint
and `git diff --check` passed. Shared SDK full suite: **476 tests / 3,624 assertions
passed**; SDK PHPStan reported no errors, and scoped SDK Pint/whitespace checks
passed. Frontend tests/TypeScript/lint were not rerun: no frontend files were
changed by this operation.

At 15:33–15:34 UTC a fresh cookie-isolated Chrome session (normal TLS validation)
returned HRM login 200, `/auth/doxa` 302 to IAM authorization with exact HTTPS
callback and PKCE S256, then IAM frontend login 200. No credentials were submitted.
A fresh authenticated browser attempt was requested, but no corresponding safe
session-success event was observed at this checkpoint. Actual callback/session,
`/api/auth/me` returning user 1 / `hr_admin`, and a repeated live login remain
unverified; do not describe this operation as a completed browser login.

The older entries below describe pre-link history and are superseded for the
current mapping state by this section. No stage, commit, or push occurred.

## Existing administrator linking review — 2026-10-21

Read-only reinspection confirmed existing local administrator user 1 is active,
not deleted, role `hr_admin`, without an employee or issuer mapping. IAM user 292
still has effective application access and no HRM mapping. Its immutable public
subject is `01a15da3-43e1-7149-95a1-a77fb98209bf`. The expected validated-callback
identity digest (issuer + NUL + subject) is
`9a2af6f01a03f2bc51733334f54d464e4f33ed9e73ee6a2564d588840e3f9cdb`.

Executed only `doxa:link-existing` **dry run**, inside an explicitly read-only
PostgreSQL transaction, selecting verified database target ID 1 and prospective
actor ID 1. User attributes (including password, compared only in memory),
permission assignments, mappings, audits and employee count were unchanged.
This proves plan selection/no writes, not ownership or operator authority.
The dry-run implementation prints a plan without checking database eligibility;
`--verified` is an attestation, and the confirmation hash only binds the selection.
Exact independent verification, approval, prospective commands and post-link
checks are documented in `DOXA_ACCOUNT_RESOLUTION.md` under "Reviewed local
administrator plan". No `--apply` invocation occurred.

No fresh authenticated callback event was observed during this review. A fresh
attempt was requested, but credentials were not submitted automatically. Thus
the received validated identity and precise branch for a new attempt remain
unconfirmed. Current code would reject these unmapped/unverified claims in
`HrmDoxaUserProvisioner::create` (`email_unverified`), return null through the
resolver, and produce HTTP 403 `access_denied` in the callback controller before
local session creation. A verified colliding email would instead fail
`email_collision`. This is distinct from SDK application-access denial and local
role authorization. No additional code defect was established or fixed.

Reran seven focused existing regressions: **7 passed / 105 assertions**. These
cover safe denial reasons, application-access denial, preservation/linking/reuse
of an administrator fixture, conflict/audit rollback, session rotation and prior
session isolation. `git diff --check` passed. These fixture results do not prove
a live post-link callback/session works; that check remains pending an authorized
mapping and a subsequent fresh browser login. Only documentation and an ignored
read-only review helper were changed in this review.

## Runtime follow-up — 2026-10-21

This follow-up does **not** establish a completed browser login. At 14:16 UTC,
a fresh Chrome context with normal certificate verification and preserved cookies
returned 200 for HRM `/login`, then 302 from `/auth/doxa` to the HTTPS IAM
authorization endpoint with callback `https://localhost:3443/auth/doxa/callback`
and PKCE S256. IAM redirected to its frontend login page (200). No credentials
were submitted; no fresh authorization code or callback was produced by this test.

A temporary loopback-only probe (removed afterward) confirmed the actual HRM
worker PID 22220 loads `DoxaClient.php` from the Composer junction into the shared
SDK working tree, with `resolveAccount` and `AccountResolver` available. The live
worker and fresh PHP reported identical SDK SHA-256
`60419bfb22633134af31db3e350b9c366ab9cea5f8db8f02f3603798b3267958`, policy `provision`,
default role `applicant`, and scopes `openid profile email`. Both loaded the
configured combined public/local CA bundle; verified discovery returned 200,
issuer matched, metadata parsing and SDK discovery succeeded. No restart occurred.

Read-only PostgreSQL inspection confirmed nullable user passwords, required
lifecycle columns, the audit table, and unique `(issuer, subject)` / `(user_id,
issuer)` indexes. There remain two existing mappings and zero provisioning audit
records. This verifies schema presence, **not** successful live provisioning or
concurrent PostgreSQL writes.

Recent HRM-client token exchanges identify IAM user 292 (latest observed
2026-10-21 14:06:36). IAM's own access-state function reports effective HRM access.
The identity still has no mapping and has an unverified email colliding with the
local administrator. Under the current code, the first provisioning rejection
for these claims is `email_unverified`; independently, a verified colliding email
would be rejected as `email_collision`. Neither condition permits automatic
administrator linking. Historical logs did not record per-callback denial reasons,
so these observations must not be represented as a trace of a new authenticated
callback during this follow-up.

Added safe diagnostics: `doxa.login.account_denied` includes a fixed reason and
SHA-256 of issuer + NUL + subject; `sdk_denied` includes exception class/category;
`failed` includes stage/class/source line, never exception message or trace;
`session_established` includes only local user ID. No request, query values,
profile email, tokens, cookies or raw session credentials are logged by these
events. Browser denial responses remain generic. Regression tests distinguish
unverified-email denial, collision denial, IAM access denial and database failure.

Follow-up HRM validation: targeted callback suite **65 tests / 422 assertions**;
full suite **143 tests / 1,250 assertions**. Both passed. The shared SDK full suite
also passed **476 tests / 3,624 assertions**, with no PHPStan errors. Scoped Pint
and `git diff --check` passed. Frontend checks were not rerun in this follow-up;
no frontend files were edited here. No new authenticated callback diagnostic was
observed before the follow-up ended. A fresh authenticated
administrator attempt and a verified, non-colliding new-user attempt remain
required. No live mapping, account, role, password or business data was changed.

## First-login policy implementation — 2026-10-21

The earlier denial diagnosis below remains correct: IAM user 292 had central
access but no HRM mapping. The policy is now explicitly extended for **new**
authorized identities. The SDK checks fresh client-bound application access
before the host resolver. HRM reuses exact trusted mappings or provisions an
active passwordless applicant, with user/mapping/audit committed together.
Provisioning requires a validated, explicitly verified email; collisions never
attach an identity to an existing user. Existing-account-only policy is available.
Full details and deployment requirements are in `DOXA_ACCOUNT_RESOLUTION.md`.

Read-only local inspection confirmed existing HRM admin user 1 remains active
with role `hr_admin`, no employee record and no mapping. IAM user 292 currently
has an unverified email colliding with that existing admin. Its association must
therefore use independent operator verification, not automatic provisioning or
email matching. A privileged dry-run-first `doxa:link-existing` command exposes
that explicit audited workflow without manufacturing an employee. No live
`--apply` command, migration, new account or mapping was executed by this task.
No user password/role/permission/business-data change was performed.

Validation: full HRM **140 tests / 1,223 assertions passed**; full SDK **476 tests /
3,624 assertions passed**; SDK PHPStan, scoped PHP formatting, TypeScript and
whitespace checks passed. Existing frontend suites passed **25 tests**. ESLint
remains blocked by its existing ESLint 8 `eslint/config` incompatibility. Tests
use isolated accounts and real SDK validation with provider HTTP fixtures,
including two concurrent first-login processes, rollback, revoked access,
email-policy denials and explicit linking/reuse of an existing administrator.
Live first-login provisioning and PostgreSQL/MySQL concurrency remain unverified.
The SDK package requires a coordinated release before deploying this controller.

## Callback `access_denied` investigation — 2026-10-21

Recent OAuth token exchanges for the configured HRM client identify IAM internal
user 292. Its OIDC subject is the IAM `public_id`; SHA-256 prefix
`bad67a5504af`. Read-only evaluation using IAM's existing
`User::applicationAccessState` for that client's actual application (internal ID 1)
returned `assigned=true`, `effective_access=true`, `ineffective_reason=null`.
The client is not revoked and the configured callback is registered exactly.
The HRM mapping table still contains only mappings 1/2 for IAM users 2/1 to HRM
users 52/53. There is no mapping for IAM user 292. No mappings were changed.

The exact HRM denial branch is `DoxaLoginController::callback`: after
`DoxaClient::handleCallback` returns a validated identity,
`LinkedDoxaUserResolver::resolve` returns null and the controller returns HTTP 403
with `access_denied`. A valid application assignment does not create a local
identity link. The resolver selects neither email nor an existing local session.
State/browser binding, exact callback/client context, code/PKCE exchange, signed
ID-token issuer/audience/nonce/expiry validation precede this local lookup.
Failures there have different SDK error categories. Ordinary OIDC login has
UserInfo disabled and relies on IAM's issuance eligibility; the managed linking
flow separately performs its fresh client-bound application-access check.
Local admin-only API authorization occurs later and is not this callback branch.

Existing logs contain no credential-safe per-callback identity audit, so the
specific browser attempt is correlated through the recent client exchanges and
current exact records, not by replaying a consumed authorization code. The safe
remedy is the existing explicit administrator-controlled linking flow for user
292 and the intended existing local employee. The intended local target was not
provided and must not be guessed or selected by matching email. That association
remains pending user identification and completion of the trusted confirmation
flow. No production-code workaround or change to authorization rules is needed.

Two additional isolated real-SDK regressions cover an unlinked identity being
unable to borrow another user's mapping, and a fresh login succeeding as the
intended applicant after an explicit fixture mapping is installed. These tests
never modify live mappings or provision users from the callback.
Targeted validation (`DoxaLoginTest|DoxaLinkTest|DoxaApplicationAccessTest`):
**78 passed / 790 assertions**, 46.34 seconds. Pint on the changed PHP test and
`git diff --check` passed. This was the targeted set, not a new full-suite run.

## Account-selection audit — 2026-10-20

Read-only inspection found exactly the two existing released mappings below,
both created by explicit confirmation on 2026-10-17. No mapping points to local
HRM administrator user 1. Subjects are represented by SHA-256 prefixes here:

| Mapping | Issuer | Subject hash prefix | IAM internal user | HRM user / local role |
| --- | --- | --- | --- | --- |
| 1 | `https://localhost:8443` | `f4589524c860` | 2 | 52 / `applicant` |
| 2 | `https://localhost:8443` | `bb99c073fff4` | 1 (IAM administrator) | 53 / `applicant` |

The latest retained HRM session identifies user 53, and the latest two token
issuances for this OAuth client identify IAM user 1. These records support the
existing mapping to HRM user 53, not HRM administrator user 1. Ordinary callbacks
do not persist a per-login identity audit, so these observations cannot prove
which browser interaction selected IAM user 1 or whether its IAM session was
reused. No live credential entry or new end-to-end account login was performed
in this audit.

The confirmed UI defect was that the dashboard header, profile menu and sidebar
always displayed `HR Admin` / `admin@doxa.com`, irrespective of the server session.
They now share the account returned by `/api/auth/me`, using a neutral placeholder
when unavailable. No identity mapping, local role, IAM source or SDK was changed.

The callback validates through the real SDK and resolves only exact issuer/subject
against a released identity mapping. It rejects absent/inactive/deleted targets;
database uniqueness prevents conflicting ownership. There is no email fallback,
first-user selection, provisioning, or IAM-role conversion. A successful callback
replaces the prior local account with the mapped account and rotates the session.
A rejected account-switch callback returns an error while preserving any prior
authenticated local session; that retained session is not OIDC success or proof
of a link for the rejected identity. Fresh-profile `/api/auth/me` checks distinguish
this from a newly established session.

Actual validation: full backend suite **119 tests / 1,055 assertions passed**,
including two added existing-session regressions; frontend **25 tests passed**,
including verified account labels and failed account-lookup behavior. TypeScript,
Pint on the changed PHP test, and `git diff --check` passed. Linked, unlinked,
invalid-signature/provider-denied, inactive/deleted/provisional and conflicting
identity cases use isolated real-SDK fixtures, not live password submissions.
In a fresh Chrome profile with default TLS verification, the live login page
returned 200, `/api/auth/me` returned 401, an invalid callback returned 400
`invalid_state`, and `/api/auth/me` remained 401 afterward. Browser fetches used
that isolated profile's own cookie jar. No real credentials were submitted.

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
