# Doxa application account resolution

## Contract and ownership

The original `access_denied` was a local identity-link failure: IAM user 292 had
effective HRM access, but no HRM `(issuer, subject)` mapping. IAM application
access and a local account association are separate decisions. Email never proves
that association, including when an IAM account uses `admin@doxa.com`.

The shared Laravel SDK now offers the additive APIs:

```php
use Doxa\Laravel\Contracts\AccountResolver;
use Doxa\Laravel\Identity\DoxaIdentity;
use Illuminate\Contracts\Auth\Authenticatable;

// Application-owned policy; CRM may have entirely different creation/lifecycle rules.
final class ApplicationAccountResolver implements AccountResolver
{
    public function resolve(DoxaIdentity $identity): ?Authenticatable
    {
        // Exact trusted mapping first; deny or transactionally create under host policy.
        // Never use an email match as a link, and never log in a user here.
        return null; // Safe deny-unmapped starting point; implement the host's explicit policy.
    }
}

$user = $doxa->resolveAccount($request, $applicationResolver);
// Null means denied. Only the application establishes an eligible user's local session.
```

`resolveAccount` uses `handleAuthorizedCallback`: existing state/browser binding,
code/PKCE exchange, JWT signature/issuer/audience/nonce/expiry validation remain
unchanged. Before invoking host policy, it makes a fresh authenticated GET to the
fixed issuer-relative `/oauth/application-access`, requires HTTP 200 JSON with
exactly `{"effective":true}`, and fails closed on denial, malformed responses,
redirects, TLS failure or outage. It returns no credentials and stores no tokens.
SDK transport retains TLS verification, bounded reads, timeouts and no redirects.
All attempts are single use. Ordinary legacy `handleCallback` and managed-link
APIs remain compatible; new integrations should use `resolveAccount` for this
fresh access guarantee. The managed linking protocol continues using its own
existing SDK access check and durable credential store.

The SDK owns authentication and access validation. The application owns mapping
storage, transactional user creation, activation, role assignment and sessions.
The SDK interface contains no HRM user model, employee logic, CRM tenancy or role
mapping. No new identity-management service or parallel OAuth flow is introduced.
Local numeric user IDs can differ between HRM and CRM; the external `(iss, sub)`
is the reusable identity, not another application's local user ID or role.

## HRM policy

`config/hrm.php` explicitly selects `provision` by default; environments may select
`DOXA_ACCOUNT_POLICY=existing-account-only` to deny all unknown identities. Other
values also deny provisioning. `DOXA_PROVISIONING_ROLE=applicant` is the only
accepted HRM creation role; selecting `management` or `hr_admin` fails closed.
The role setting never changes an already mapped user's role.

HRM requests `openid profile email` so the existing SDK can extract signed profile
claims. UserInfo remains disabled. No issuer, callback URI, certificate or client
registration is changed. A deployment's client must already allow the requested
scopes. Missing email claims are a safe denial, not an invented email address.

For a known exact mapping, HRM reuses the same user without synchronizing email,
name, password, roles, permissions or business data. Provisional links, inactive
accounts (`is_active=false`, including the local disabled/suspended condition),
deleted users and broken mappings are denied, with no replacement provisioning.
HRM has no separate suspended status column. Existing database uniqueness on
`(issuer, subject)` and `(user_id, issuer)` remains authoritative.

For an unknown identity, `DoxaAccountResolver` calls the application-bound
`DoxaUserProvisioner` inside the same database transaction as mapping and
`doxa.account.provisioned` audit creation. The default `HrmDoxaUserProvisioner`:

- Requires a valid email and strict boolean `email_verified=true` from the SDK.
- Canonicalizes new emails to lowercase; a case-insensitive collision with **any**
  existing user, including inactive/deleted users, requires explicit linking.
- Creates an active `applicant`, following HRM's existing applicant registration
  activation rule; password is null and `email_verified_at` is recorded.
- Uses validated name or neutral `Doxa user`; does not synchronize later claims.
- Creates no employee, membership, tenant, personal token or role assignment.

Two first logins can race: database uniqueness chooses the winner, the losing
transaction rolls back its whole user/mapping/audit, and bounded retries resolve
the committed mapping. Mapping locks prevent bypassing a provisional link.
Creator/audit/storage failure rolls back and prevents local login. A completed
provisioned account may be reused by a subsequent fresh authorization attempt;
consumed OAuth callbacks cannot be replayed. IAM access is checked on every
future login even for existing users. This does not add continuous IAM logout or
revocation synchronization for sessions already established.

An application can bind its own `DoxaUserProvisioner` implementation to customize
creation. It must return a newly persisted eligible `User` on the same database
connection, perform all writes inside the supplied ambient transaction, and avoid
external side effects. It must not return an existing account based on email.
HRM's default creator deliberately admits only applicant roles. Another Doxa
application implements the SDK `AccountResolver` interface with its own model,
safe roles, email policy, lifecycle checks, unique constraints and transaction.

## Existing users and the administrator

**Latest local state, 2026-10-21:** following the user's explicit authorization
of IAM user 292 to existing HRM user 1, the exact identity was independently
rechecked using local IAM/HRM database reads and IAM's effective-access logic.
The existing operator command was dry-run, then applied with attestation and the
reviewed confirmation plan. Mapping **3** now targets existing local user **1**,
role `hr_admin`; operator audit **39** records actor 1, target 1 and the reviewed
plan. Subject hash prefix: `bad67a5504af`. No automatic email linking was used.
Transaction snapshots of all 38 protected HRM tables remained identical; only
one mapping and one audit were added. A fresh independent read confirmed the
committed mapping and exactly one matching audit. See the latest section in
`LOCAL_IAM_VERIFICATION.md`. The earlier review below is historical and describes
the pre-authorization state; a complete authenticated browser login remains
unverified. Do not rerun an apply merely to test login; use a fresh OIDC flow.

Read-only local inspection found HRM user 1 (`admin@doxa.com`) active with role
`hr_admin`, no employee record and no external identity mapping. IAM user 292 has
an unverified email colliding with that account. No link was guessed or created.
No role, password, permission or business data was changed.

For users with an employee record, use the existing HR-admin employee screen's
**Link Doxa account** action. It requires reauthentication and explicit confirmation,
fresh access checking and an audited mapping commit. Account selection must be
independently verified; a matching email or central IAM administrator role is not
authorization. Later logins reuse that exact mapping automatically.

For existing users without employee records (including the local admin), a
privileged operator migration is available without manufacturing an employee:

```text
php artisan doxa:link-existing <LOCAL_USER_ID> <VERIFIED_IMMUTABLE_SUBJECT> --actor=<ACTIVE_LOCAL_ADMIN_ID>
```

This is **dry-run by default** and prints the exact plan hash and subject hash.
It does not claim the subject was authenticated and does not perform an email
lookup. A trusted operator must independently verify the IAM account's public
subject/issuer, ownership of the intended local account, central access, and the
authority to associate them. Preserve that approval in the operator's records.
Only then run the same selection with:

```text
--apply --verified --confirm=<EXACT_PLAN_SHA256>
```

The confirmation hash prevents changing the reviewed selection; it is not an
authentication credential or substitute for independent verification. This is a
privileged CLI/database operation, not a web authentication endpoint. The actor
must be an active local HR administrator. The transaction preserves all user
attributes, denies conflicts/provisional mappings, and creates
`doxa.link.operator_linked` in the existing audit table. Exact repeats return the
existing mapping without duplicate audit. Independently inspect mapping ID,
target ID, exact issuer/subject and audit, then perform a fresh browser login.
The initial provisioning implementation did not run a live `--apply`. The later
explicitly authorized local administrator operation is recorded above.

### Reviewed local administrator plan (2026-10-21; not applied)

Read-only queries independently located the existing HRM row by email and
confirmed **local user 1**, active, not deleted, role `hr_admin`, without an
employee record or issuer mapping. IAM database user **292** has immutable public
subject `01a15da3-43e1-7149-95a1-a77fb98209bf`. The configured issuer is exactly
`https://localhost:8443`. Neither email equality nor these database facts prove
that the person controlling that IAM identity owns the existing HRM administrator.

Before any write, the authorized operator must:

1. Independently establish ownership/authority for both accounts through trusted
   IAM administration and an existing trusted HRM administrator verification
   channel. Record explicit approval of the exact issuer, immutable subject,
   local target ID, and actor ID. Do not treat an unverified matching email,
   application access, or a central administrator role as ownership evidence.
2. Observe a **fresh** administrator OIDC attempt, without replaying a callback.
   Match the safe `doxa.login.account_denied` event's `subject_sha256` against
   `9a2af6f01a03f2bc51733334f54d464e4f33ed9e73ee6a2564d588840e3f9cdb`
   (SHA-256 of issuer + NUL + subject). This event can only follow successful SDK
   state/code/ID-token validation and the fresh positive application-access
   decision. With the current unmapped/unverified claims its reason should be
   `email_unverified`. A different digest or stage requires investigation before
   linking. No such fresh event was observed during this review.
3. Recheck current target/actor status and absence of conflicting/provisional
   mappings. Capture a protected baseline of the target's user attributes,
   permission assignments and related business data for subsequent comparison;
   do not print password hashes or session credentials. The reviewed target is
   user 1; use actor 1 **only if the authorized operator is legitimately acting
   for that administrator**. A numeric actor ID is not operator authentication.

From the HRM `backend` directory, review the plan (no writes):

```powershell
& 'C:\xampp\php\php.exe' artisan doxa:link-existing 1 01a15da3-43e1-7149-95a1-a77fb98209bf --actor=1
```

For this exact issuer/subject/target/actor selection the reviewed plan SHA-256 is
`4fc30ed4250d7f0c883bd38d6ed368caae27107019126f434ae67ad05a9a3799`.
The dry run only checks input shape and prints the selection; **it does not check
database eligibility or ownership**. Re-review any change instead of reusing this
confirmation. Running the dry run inside a read-only PostgreSQL transaction
confirmed unchanged user attributes, permission assignments, employee count,
mapping count and audit count in this review.

Only after independent verification and explicit authorization, an operator may
run the following prospective command. **It was not run, and this investigation
does not authorize it.** If the actor differs, regenerate and review the plan.

```powershell
& 'C:\xampp\php\php.exe' artisan doxa:link-existing 1 01a15da3-43e1-7149-95a1-a77fb98209bf --actor=1 --apply --verified --confirm=4fc30ed4250d7f0c883bd38d6ed368caae27107019126f434ae67ad05a9a3799
```

`--verified` is an attestation, not an automated verification step; the plan hash
binds the selection, not an authentication credential. Execution requires trusted
CLI/database access. Apply validates active, undeleted actor/target, requires the
actor's local `hr_admin` role, rejects mapping conflicts/provisional mappings, and
commits only the mapping and its `doxa.link.operator_linked` audit transaction.
It neither saves the user nor assigns permissions, roles or business records.
An exact repeat reuses the mapping without a duplicate audit.

After an approved apply, independently inspect the database (read-only):

```sql
SELECT e.id, e.issuer, e.subject, e.user_id, e.pending_link_id,
       u.email, u.role, u.is_active, u.deleted_at
FROM external_identities e JOIN users u ON u.id = e.user_id
WHERE e.issuer = 'https://localhost:8443'
  AND e.subject = '01a15da3-43e1-7149-95a1-a77fb98209bf';

SELECT id, user_id, action, subject_type, subject_id, new_values, created_at
FROM audit_logs
WHERE action = 'doxa.link.operator_linked' AND subject_id = '1'
ORDER BY id DESC;
```

Require exactly one released mapping to user 1 (`pending_link_id IS NULL`) and
the audit's correct actor, target, issuer, subject and reviewed plan hash. Compare
the protected baseline: password, role, permissions, account status and business
data must be unchanged. Then use a fresh isolated browser session for a new
authorization-code flow. Require redirect to HRM `/dashboard`, the
`doxa.login.session_established` event with user ID 1, and authenticated
`/api/auth/me` identifying local user 1 with its existing `hr_admin` role. A second
fresh login must reuse the same mapping without new user/mapping/link-audit rows.
If SDK validation or session creation fails, diagnose that specific new event;
do not replay a code, relink, change roles, or weaken validation.

## Deployment and verification boundaries

Callback troubleshooting now distinguishes local account-policy rejection
(`doxa.login.account_denied`, with fixed reason and hashed external identity key),
SDK rejection (`doxa.login.sdk_denied`), runtime failure (`doxa.login.failed`), and
successful local session creation (`doxa.login.session_established`). Diagnostic
events never include request/query contents, profile email, tokens, exception
messages/traces, or session credentials. Generic browser errors remain unchanged.
See the runtime follow-up in `LOCAL_IAM_VERIFICATION.md`: the running HRM worker
loads this SDK API and provisioning policy, but a complete fresh authenticated
callback and live new-user provisioning have not been verified. Do not equate the
fixture-backed passing suites below with those live checks.

No new migration is required. Existing identity uniqueness, nullable password,
audit table and pending-link migrations must already be installed. No migrations
were run; the later authorized local mapping is recorded above. Release the updated shared SDK before
deploying this HRM controller: it calls the new SDK API. At HRM commit preparation,
those SDK changes remain uncommitted in the separate IAM repository. The local Composer path
dependency points to the shared package working tree; do not ship a vendor patch.
Keep issuer/client/callback registration, TLS verification, CSRF, persistent
server-side sessions/cache, scheduler and local role middleware intact.

The shared SDK is in the sibling repository's `packages/doxa-laravel`; only its
additive API, interface, tests and documentation are part of this task. Existing
IAM application changes and documents are separate and must remain intact.

Tests use isolated databases and simulated provider HTTP with real SDK signatures,
state, nonce and PKCE validation. Independent worker tests use a real shared SQLite
file. No production-like credentials or live mappings are used. PostgreSQL/MySQL
concurrency and live first-login provisioning remain deployment checks; isolated
tests must not be presented as a completed live provisioning login.

Actual local validation for this change:

| Check | Result |
| --- | --- |
| Full HRM `php artisan test --compact` | 143 passed / 1,250 assertions |
| Full shared SDK PHPUnit suite | 476 passed / 3,624 assertions |
| Shared SDK PHPStan level 5 | No errors |
| Pint on changed/new HRM and SDK PHP files | Passed |
| Frontend Node suites | 25 passed |
| Frontend TypeScript | Passed |
| HRM and SDK whitespace checks | Passed |
| Frontend ESLint 8.57.1 | Blocked by pre-existing `eslint/config` export incompatibility |

The HRM tests include explicit operator linking of an isolated existing
`admin@doxa.com` fixture, repeated mapped login without user-data changes,
independent process contention with differing email claims for the same subject,
revocation/access failure before host creation, and transactional audit rollback.
Live first-login provisioning remains unverified. The local administrator mapping
was explicitly authorized and applied later; its authenticated browser login is
still unverified.
