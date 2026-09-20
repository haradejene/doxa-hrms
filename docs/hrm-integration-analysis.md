# Existing HRM integration analysis

Inspection date: 2026-09-07. Repository: `Documents/Github/doxa-hrms`.

This document analyzes the existing Doxa HRMS. No demo application, integration code, migrations, authentication changes, or database operations were introduced. Findings describe checked-in source and locally installed packages, not verified production behavior or a live database inventory. Recommendations below are future work only.

The repository already had modifications to `backend/composer.lock` and `frontend/app/(public)/layout.tsx` when inspection began. Those changes were preserved.

## 1. Current HRM authentication architecture

HRM is a Laravel API with a Next.js frontend. Installed packages inspected locally are Laravel 10.50.2, Sanctum 3.3.3, Spatie Laravel Permission 6.25.0, and Next.js 14.1.0. Composer declares Laravel `^10.10`, Sanctum `^3.3`, and Spatie Permission `^6.25`. There is no current OAuth client or OIDC integration in the application code examined.

The effective frontend authentication mechanism is an HRM-issued Sanctum personal access token, sent as `Authorization: Bearer ...`. These tokens are not Passport OAuth access tokens. HRM validates its own local email/password credentials and issues its own tokens.

The backend default guard is `web`, using Laravel's session driver and Eloquent `App\Models\User` provider. Login calls `Auth::attempt`, then creates a Sanctum token. API middleware includes Sanctum's stateful middleware, and Sanctum checks `web` before falling back to bearer authentication. This means session support exists alongside the actual browser bearer-token workflow. The Axios client sets `withCredentials: false`; it does not initialize `/sanctum/csrf-cookie` before login. `VerifyCsrfToken` excludes `api/*`. Cookie/session behavior remains dependent on deployed origins and runtime environment; source inspection is not proof of a clean session-only or token-only configuration.

The API CORS configuration combines wildcard origins with credentials enabled. This needs review before any future cookie-based integration. Laravel session configuration defaults to file storage and a 120-minute lifetime, independently of token lifetime; runtime environment overrides were not inspected.

Evidence: [auth configuration](../backend/config/auth.php), [Sanctum configuration](../backend/config/sanctum.php), [HTTP kernel](../backend/app/Http/Kernel.php), [AuthController](../backend/app/Http/Controllers/AuthController.php), [Axios client](../frontend/services/api.ts), [CSRF exclusions](../backend/app/Http/Middleware/VerifyCsrfToken.php), [CORS configuration](../backend/config/cors.php), [session configuration](../backend/config/session.php).

## 2. Current HRM user model

The users schema is defined in [the users migration](../backend/database/migrations/2014_10_12_000000_create_users_table.php). No subsequent users-table extension was found in the active migration directory. Backup migrations are not the canonical schema history, and no migrations were run to inspect this database.

| Column | Schema / purpose |
| --- | --- |
| `id` | Auto-incrementing bigint primary key; local HRM identity. |
| `name` | Required string. |
| `email` | Required unique string; local login identifier; also separately indexed. |
| `email_verified_at` | Nullable timestamp. |
| `password` | Required, non-null string containing a password hash. |
| `role` | Enum: `hr_admin`, `management`, `applicant`; defaults to `applicant`. |
| `is_active` | Boolean, defaults true; combined index with role. |
| `last_login_at` | Nullable timestamp. |
| `avatar` | Nullable string. |
| `remember_token` | Nullable Laravel remember-token column. |
| `deleted_at` | Nullable soft-deletion timestamp. |
| `created_at`, `updated_at` | Laravel timestamps. |

[User.php](../backend/app/Models/User.php) permits mass assignment of `name`, `email`, `password`, `role`, `is_active`, `last_login_at`, and `avatar`. It hides password and remember token from JSON. It casts `email_verified_at` to datetime and password to hashed; there are no explicit boolean/datetime casts for `is_active`/`last_login_at`. It uses Sanctum `HasApiTokens`, `HasFactory`, and `Notifiable`.

Although the schema contains `deleted_at`, User does not use the `SoftDeletes` trait. The schema therefore does not by itself exclude soft-deleted rows from authentication. User also does not implement email-verification enforcement. No login-time enforcement of `is_active` or update of `last_login_at` was found.

HRM identifies users internally by numeric `users.id`, with email used for credential lookup. There is no IAM ID, external subject, issuer, or public UUID field. Preserve this local primary key during integration: business records already reference it.

User has an `employee()` has-one relationship; Employee belongs to User through `employees.user_id`. The employees migration does not make `user_id` unique, so the database does not enforce the model's implied one-to-one relationship. `employee_number`, employee ID, and user ID are separate identifiers. Employees have their own name/email and business fields. User references also appear in job creators, interviewers, reviewers, approvals, notifications, and audit records.

Evidence: [Employee model](../backend/app/Models/Employee.php), [employees migration](../backend/database/migrations/2026_07_01_045058_create_employees_table.php), [active migrations](../backend/database/migrations).

## 3. Current HRM role/permission architecture

**Roles exist as one enum column on users.** `isHrAdmin()` checks `hr_admin`; `isManagement()` accepts management or HR admin; `isApplicant()` checks applicant. These helper methods were not found in controller authorization paths.

Roles are assigned by a submitted registration role or the database default, and by UserSeeder for the initial administrator. No administrator-only role-assignment endpoint, role editor, or role reassignment service was found. Employee creation omits role and therefore gets `applicant`. The illustrative future `HR_MANAGER` role does not currently exist; do not silently translate it to a current enum value.

**Permission infrastructure is installed, but not integrated into the current user model.** The Spatie migration defines `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, and `role_has_permissions`. Configuration enables the package's permission-check registration and disables teams. User has no `HasRoles` trait; no application `assignRole`, `syncRoles`, `hasPermissionTo`, or permission seed definitions were found. Existing table contents were not queried, so their presence in a live database and any manually inserted assignments are unknown.

Spatie's polymorphic pivot tables are existing package infrastructure, not a proposed IAM mapping. Integration does not require adding a polymorphic identity relationship. Sanctum token abilities are another separate concept: `createToken('auth_token')` uses the installed package's default `['*']` abilities; no `tokenCan` or ability middleware checks were found in application routes/controllers.

Frontend `types/index.ts` declares `admin | hr | manager | employee`, inconsistent with the backend enum, and types user ID as string rather than the database integer. Frontend role display is not a reliable authorization contract.

Evidence: [User](../backend/app/Models/User.php), [permission schema](../backend/database/migrations/2026_07_01_042137_create_permission_tables.php), [permission configuration](../backend/config/permission.php), [frontend types](../frontend/types/index.ts).

## 4. Current HRM login flow

1. `/login` collects email and local password, then POSTs `/api/auth/login`.
2. AuthController validates the inputs and calls `Auth::attempt`. Invalid credentials return 401. It does not check `is_active`.
3. Successful login deletes **all** existing personal access tokens for the local user, then creates `auth_token` and returns `{user, token, message}`. Login on one device consequently invalidates other bearer-token logins.
4. The frontend stores token and user in localStorage and writes JavaScript-readable `auth_token` and `user` cookies, each with a seven-day max age and SameSite=Lax. These cookies are not HttpOnly and are not explicitly Secure.
5. Next.js middleware checks only the existence of the token cookie to permit dashboard navigation or redirect from login. It does not validate the token or the user's role. Axios obtains the actual API bearer token from localStorage.
6. Sanctum resolves the user on protected API requests. `GET /api/auth/me` returns that local user. On 401, Axios clears the token storage/cookie and redirects to login, but does not clear the stored user data.

Sanctum `expiration` is null and token creation specifies no expiry: the seven-day browser cookie is not a backend token expiry. Tokens are stored hashed in `personal_access_tokens`, with optional expiry and last-used timestamps. No OAuth refresh token or refresh flow exists.

Logout POSTs `/api/auth/logout` and deletes the current access token. It does not explicitly log out the web guard or invalidate a Laravel session. The header's finally block removes localStorage key `token`, although login stores `auth_token`; it also leaves both cookies and the cached user. This can cause stale login state and redirects back to the dashboard until a later API 401 clears the token. If a request authenticates through a web session rather than a stored token, the controller's assumption that `currentAccessToken()` is a deletable database token also needs review.

Password change requires the current local password, stores the new hash, and deletes other tokens while retaining the current one. Profile update can change local user name/email. Registration/login broadly catch exceptions and may return 500 for validation errors. Registration logs the entire request and validated attributes, including password input; the browser logs the login response, including its token. These are existing findings, not changes made by this task.

Evidence: [login page](../frontend/app/login/page.tsx), [API interceptors](../frontend/services/api.ts), [navigation middleware](../frontend/middleware.ts), [logout handler](../frontend/components/layout/header.tsx), [AuthController](../backend/app/Http/Controllers/AuthController.php), [token schema](../backend/database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php). `frontend/services/auth.ts` is empty; the flow lives in the page, API client, and header.

## 5. Current HRM user creation flow

| Existing entry point | Behavior | Suitability for IAM provisioning |
| --- | --- | --- |
| Public `POST /api/auth/register` | Requires name, unique email, password and confirmation; accepts `hr_admin`, `management`, or `applicant`; defaults to applicant; activates user and issues token. | Not a trusted provisioning endpoint; it allows public privileged-role selection and requires a local password. |
| Authenticated `POST /api/employees` | Creates a local User first, then an Employee linked by user ID. Uses a fixed password and omits role. | Reusable business operation after redesign, not a safe or idempotent identity-provisioning contract today. |
| UserSeeder | Creates the initial HR administrator by email with a hard-coded seed password. | Bootstrap/development path, not integration provisioning. |
| Public `POST /api/applications` | Creates a recruitment application without a User account or user link. | Not user provisioning; public applicants need a separate product decision. |

The administrator-facing UI is Employees -> Add New Employee (`/employees/new`). It submits first/last name, email, employee number, hire date, and optional employment fields. EmployeeController creates a local user using the combined name, unique email, and a fixed password, then creates the employee. The user receives the database default role `applicant`; the UI does not assign a staff role. There is no surrounding transaction, so an employee insert failure can leave an orphan login account. Unique-email checks also prevent simply attaching an existing local user through this endpoint.

This is an administrator-facing workflow, but the backend only requires authentication; it is not presently restricted to an administrator. No standalone protected `/users` provisioning API, invitation lifecycle, IAM-ID lookup/upsert, or dedicated role-management UI was found. Profile/employee update endpoints can change identity fields locally, which conflicts with IAM ownership unless field ownership is reconciled later.

Evidence: [employee creation UI](../frontend/app/(dashboard)/employees/new/page.tsx), [EmployeeController](../backend/app/Http/Controllers/EmployeeController.php), [UserSeeder](../backend/database/seeders/UserSeeder.php), [recruitment ApplicationController](../backend/app/Http/Controllers/ApplicationController.php), [API routes](../backend/routes/api.php).

## 6. How HRM authorization currently works

All protected API routes share `auth:sanctum`. A custom `role` alias points to CheckRole, which returns 401 without a user and 403 if the scalar role is not in the allowed list. **No route uses that alias.** AuthServiceProvider has empty policy mappings and no custom gates. No policies directory, authorization form requests, controller authorization calls, or per-resource permission checks were found. The base controller includes Laravel's authorization trait, but that alone enforces nothing.

Consequently the inspected employee, payroll, attendance, recruitment, and performance routes have authentication but no demonstrated role boundary. Comments such as "HR/admin only" do not impose a check. Employee/application lists and record lookup paths are not scoped to the requesting user's ownership. Recording a current user as reviewer or creator is attribution, not permission enforcement. The dashboard/sidebar also exposes navigation without role filtering.

Central IAM admission to HRM must not be mistaken for authorization to every HRM operation. HRM needs its own enforced role/permission and record-ownership rules before broadening admission through IAM.

Evidence: [API routes](../backend/routes/api.php), [CheckRole](../backend/app/Http/Middleware/CheckRole.php), [AuthServiceProvider](../backend/app/Providers/AuthServiceProvider.php), [EmployeeController](../backend/app/Http/Controllers/EmployeeController.php), [PerformanceController](../backend/app/Http/Controllers/PerformanceController.php), [sidebar](../frontend/components/layout/sidebar.tsx).

## 7. Proposed mapping between IAM users and HRM users

Preserve `users.id` as HRM's local primary key and all existing business foreign keys. Add an explicit external-identity link in a future migration, unique on `(issuer, subject)` and attached to local `users.id`. For a single issuer this can be columns on users; if multiple providers are actually required, use a dedicated identity table with an ordinary user foreign key. No cross-database foreign key or polymorphic relationship is needed.

Conceptual example: IAM user 123, HRM access allowed -> external identity link -> HRM user 45 -> locally assigned HRM role. Actual IAM currently has public UUIDs; `123` is illustrative. Decide a stable external subject contract with IAM rather than importing its internal database integer. A future OIDC subject can be opaque or pairwise; retain issuer with it. Email is a mutable profile attribute, not the durable key.

For existing accounts, require an administrator-reviewed linking process with identity proof and collision handling. Never automatically attach an existing privileged HRM user solely because an asserted email matches. New-user creation must be idempotent and must not overwrite local roles on each login. Access granted in IAM does not imply an HR admin role. Define a pending/no-access local state or deny admission until a suitable role is assigned; the current default applicant role is not an adequate staff authorization policy.

IAM owns identity, authentication, central accounts, app registration/access, OAuth, and eventually OIDC/SSO. HRM owns the local user representation, roles, permissions, employee links, and business data. IAM suspension or HRM-access revocation should terminate admission according to an agreed policy without deleting payroll/history or reassigning local roles.

## 8. What HRM changes will eventually be required

- Add the external identity mapping and a reviewed migration/linking process preserving local IDs and employee history.
- Separate local account representation from local credentials. Permit credentialless linked users or otherwise explicitly disable their local password authentication; do not manufacture shared passwords or copy IAM password hashes.
- Add OAuth initiation/callback and secure server-side storage of state, PKCE verifier, and tokens. Recommend the existing Laravel backend as the confidential client, with browser session cookies; this is a future architectural change requiring deliberate frontend/API adaptation.
- Reconcile identity fields: IAM controls central name/email; HRM may keep distinctly named work-contact or business profile fields. Resolve existing duplicate user/employee email storage and uniqueness constraints.
- Add safe transactional provisioning or just-in-time representation creation, plus administrator-controlled local role assignment. Keep it separate from the public recruitment flow.
- Enforce role/permission and record-level checks in HRM. Decide whether to retain the scalar enum or actually adopt the already-installed Spatie system; do not silently change role architecture as part of OAuth wiring.
- Correct the observed credential logging, privileged public registration, fixed passwords, active-user checks, and logout cleanup before production federation.
- Design local session expiry, central revocation propagation, logout semantics, and outage behavior; keep OAuth credentials outside browser-accessible storage under the proposed backend-client design.
- Add real authentication, role-boundary, provisioning/linking, and OAuth integration tests in this existing repository when implementation is authorized.

These changes are recommendations only. Sanctum does not need to be removed automatically: HRM can retain its local API authentication boundary while changing how a trusted identity establishes the local session. HRM does not need Passport as an authorization server simply to become an OAuth client.

## 9. What IAM changes will eventually be required

- Register this real HRM deployment as a client, with exact callback URLs and environment-specific credentials; map that client explicitly to the existing IAM HRM application/access grants.
- Enable Authorization Code + S256 PKCE only after integrating active-user, active-application, and grant checks at authorization, code exchange, and refresh. Define permitted scopes and token lifetimes.
- Define the stable external user identifier and trusted identity retrieval contract. OAuth alone does not establish an interoperable sign-in identity contract.
- Keep HRM roles and permissions out of IAM's ownership. A central administrator's identity must not automatically become an HRM administrator.
- Define access revocation, refresh handling, signing-key distribution, token validation/resource audiences, and correlated audit events. No shared database or private signing key is needed between IAM and HRM.
- If asynchronous provisioning is selected later, add a narrowly authorized, retry-safe delivery contract; do not call HRM's current public registration API as a provisioning shortcut.
- Add OIDC discovery, ID-token validation contract, issuer/subject semantics and SSO/logout capabilities only in a separately authorized later phase. Current IAM Passport preparation is not an OIDC provider.

The IAM status here reflects the preceding IAM design/configuration task; this inspection does not alter that repository.

## 10. Recommended OAuth/OIDC integration flow

Use the existing HRM Laravel backend as the OAuth client and keep its Next.js UI. That permits confidential-client credentials and tokens to stay server-side. This is a recommendation, not implemented behavior.

**OAuth-first integration testing:** while the existing HRM login remains available in a controlled environment, test code/PKCE issuance, callback errors, token exchange, refresh, and revocation against an explicitly scoped IAM resource. Generate per-attempt state and an S256 verifier/challenge. Verify state at the callback and exchange the code server-side with the same redirect URI and verifier. OAuth token acquisition alone must not silently log a browser into an arbitrary HRM account. Any interim non-OIDC identity endpoint would require an explicit, reviewed contract; do not invent it during this inspection. [PKCE specification](https://www.rfc-editor.org/rfc/rfc7636)

**Later OIDC sign-in:** HRM initiates Authorization Code + PKCE with state and nonce. IAM authenticates and checks HRM access. HRM exchanges the code, validates the ID token's signature, issuer, audience, expiry, and nonce, then resolves the trusted issuer/subject to its local user. It establishes an HRM session and applies only HRM-owned roles and permissions. The ID token establishes identity; the access token authorizes API calls. OIDC is the later identity layer, not a feature to implement now. [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html)

For a user with no approved local representation/role, use an explicit pending or denied path instead of assigning privileges automatically. HRM logout ends its local session; central SSO logout and OAuth grant revocation need separate defined behavior. Do not route ordinary payroll authorization decisions to IAM.

## 11. Open questions, risks, and verification

### Decisions to settle

1. Are external recruitment applicants also central identities, or does the public application process remain accountless? Current public application submission creates no user.
2. Who approves links for existing HRM accounts, especially administrators, and resolves email collisions?
3. Which actual HRM roles are required? There is no current HR_MANAGER enum, and frontend/back-end role vocabularies disagree.
4. Will provisioning occur just in time or through a protected synchronization API? Who assigns the initial local role?
5. Which name/email fields are central identity versus HRM work-contact data?
6. Is local password login retired for linked users, and is a tightly controlled emergency-access path needed?
7. What are the real deployment origins/callback URLs? IAM and HRM both default to localhost ports 3000/8000 and cannot run there simultaneously without adjustment.
8. How quickly must IAM suspension or HRM-access revocation invalidate an existing HRM session? What happens during IAM outages?
9. Are OAuth-only testing and eventual OIDC login separate milestones, or is a temporary custom identity contract explicitly required?
10. Are multiple issuers, companies, or tenant boundaries required? Spatie teams are currently disabled; no tenant authorization architecture should be assumed.

### Existing risks to carry forward

Public privileged-role registration, missing role/ownership enforcement, plaintext credential logging, a shared employee bootstrap password, and missing inactive-account checks are the most material observed issues. Also track JavaScript-readable tokens, login-response token logging, ineffective logout cleanup, unbounded token lifetime, unused soft-deletion semantics, nontransactional user/employee creation, inconsistent role types, and incomplete session/CORS/CSRF alignment. These are source-level findings; no exploit requests or production data inspection were performed.

### Checks run after inspection

| Check | Result and limits |
| --- | --- |
| `php vendor/phpunit/phpunit/phpunit --do-not-cache-result` in backend | Passed: 2 tests, 2 assertions. Existing tests are only the unit true assertion and root-page smoke test; they do not cover authentication or authorization. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` in frontend | Passed, exit 0; no emitted files or incremental cache. |
| `npm.cmd run lint` in frontend, `CI=1` | Did not perform linting: Next 14 opened an ESLint configuration prompt. No setup option was selected and no lint config was created. Existing `eslint.config.mjs` uses a different configuration style than the installed command recognizes. |

Backend checks used process-only `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, empty `DB_URL`, and stderr logging. The tests have no migration/seed operations. The existing phpunit file has SQLite settings commented out, so the process overrides avoided using the application database. No database migrations or database inspection commands were run. PowerShell blocked `npm.ps1`; the standard `npm.cmd` launcher was used without changing execution policy.

The tracked diff fingerprint before and after inspection/checks remained `b9e4ac7c35a90fdbdc71c62f8b049f593981d293`, confirming the two pre-existing tracked modifications were unchanged. This report is the only intended new repository file. Checks do not establish functional security correctness; their coverage is limited as described above.

Stop after this analysis. No HRM or IAM integration has been implemented.

## Federation Preparation

Updated 2026-09-17. This section supersedes the historical inspection findings above where changes are described. Partial preparation files were already present when this task began; they were reviewed and completed. No application database migration, account linking, OAuth, OIDC, Passport configuration, client registration, or IAM endpoint was run or implemented. Tests use an isolated in-memory SQLite database.

### Identity mapping design

`external_identities` has its own numeric ID, a required ordinary foreign key `user_id -> users.id`, required `issuer` and `subject` (255 bytes maximum on MySQL), timestamps, and a unique `(issuer, subject)` constraint. There is no email key or polymorphism. A separate table isolates identity links from HRM authorization and supports provider changes or multiple approved providers without replacing the user. MySQL keys use VARBINARY to preserve exact case and trailing-byte comparisons rather than the application's case-insensitive collation. SQLite uses binary string comparison. Foreign-key deletion is restricted: a link must be deliberately dealt with before hard deletion of its user. No existing business foreign keys are changed.

`User::externalIdentities()` and `ExternalIdentity::user()` expose the mapping. These are persistence primitives, not a public linking service or proof of administrator approval. No request can create a link through registration, login, profile editing, or employee creation. Only verified issuer/subject may be used in a future resolver; never email, and never unverified request parameters. Provider allowlisting, length validation, exact issuer contract and verified identity proof must be implemented with the future linking workflow. The example issuer `central-iam` is illustrative; future OIDC must use the exact trusted issuer value.

### Existing-user linking strategy ? proposed, not executed

1. Back up the database and inventory local user IDs, local roles, active/deleted state, employee references and business records. Separately obtain verified IAM issuer/subject data. Email can flag review candidates but cannot approve a link.
2. An authorized HRM administrator selects the existing numeric user ID, verifies both identities through trusted evidence, checks employee ownership and records approval with reviewer, time and reason. Privileged accounts require an independent second reviewer. Do not infer approval from IAM application access or central administrator status.
3. In a transaction, lock the chosen user, reject inactive/deleted accounts pending lifecycle review, and check the exact issuer/subject. An existing link to the same user is an idempotent success; a link to a different user is a conflict, never an overwrite. The database unique constraint arbitrates concurrent attempts. Review unexpected additional subjects for the same issuer/user rather than merging automatically.
4. Duplicate HRM candidates, conflicting employee associations, changed/recycled emails, and privileged collisions enter manual resolution. Preserve user IDs, password hashes, role, employee IDs and historical references; do not merge or delete business accounts as a shortcut.
5. Pilot reviewed links and audit outcomes before expanding. Removing a mistaken link must not remove the local user or business records. Production migration deployment and account linking are separate operations; neither was performed here.

An audit-capable review tool/service is still required before linking accounts operationally. No automatic email backfill or migration of accounts is included.

### New-user provisioning and password transition

The password migration makes only `users.password` nullable, retaining existing IDs and hashes. MySQL and PostgreSQL use ALTER COLUMN; SQLite 3.35+ replaces only the unindexed password column transactionally, without rebuilding users or changing references. Rollback refuses while null-password users exist: it never manufactures passwords. Verify the migration on the deployment database/version and a restored backup before rollout; tests here do not establish MySQL/PostgreSQL production compatibility.

Existing active, non-deleted users retain local password authentication and Sanctum. Null-password users fail local login with the same 401 as other invalid credentials. No IAM hash is copied, and no shared or generated federation password is created. Existing linked local accounts retain their local password during this transition; disabling it later requires an explicit rollout decision.

Employee creation now atomically creates an employee and an **inactive, passwordless applicant** local representation. Existing employee creation UI still works without a password field. This new account cannot log in until a separately approved credential enrollment or future identity-linking/activation process exists. It receives no implicit staff role. Existing users are not altered. Public local registration remains applicant-only and requires a user-chosen password.

Future provisioning should create the local representation and verified link atomically, remain inactive until HRM approval, and assign roles only through HRM-owned decisions. Decide JIT versus pre-provisioning, email-uniqueness collision handling, applicant participation, and central-versus-work-contact profile field ownership. Never reuse public registration as an IAM provisioning endpoint. IAM application access alone cannot activate a local account or grant `hr_admin`.

### Exact authorization boundary and route inventory

The role architecture remains `users.role = hr_admin | management | applicant`. Spatie Permission is installed, but User does not use HasRoles; no Spatie migration, new role, gate or policy was introduced. Role helpers are `User::isHrAdmin()`, `isManagement()` (which also recognizes hr_admin), and `isApplicant()`; they do not enforce requests. Enforcement occurs in `app/Http/Middleware/CheckRole.php`, registered as `role` in `app/Http/Kernel.php`, and applied in `routes/api.php`. AuthServiceProvider has no policy/gate mappings; controllers do not enforce record ownership. Frontend navigation is not an authorization boundary.

At the original inspection all these routes authenticated users without role/ownership checks; the partial working-tree preparation protected only employee create/update. The completed preparation applies `auth:sanctum`, `EnsureActiveUser`, and an explicit interim `role:hr_admin` group to **every business route**:

| Controller | Routes under `/api` |
| --- | --- |
| DashboardController | GET dashboard/{metrics,activities,notifications,recent-employees,analytics} |
| EmployeeController | GET employees, GET employees/{id}, POST employees, PUT employees/{id} |
| JobPostingController | GET/POST job-postings; PUT/DELETE job-postings/{id} |
| ApplicationController | GET applications, GET applications/{id}, PUT applications/{id} |
| InterviewController | GET interviews, GET interviews/{id}, POST interviews |
| AttendanceController | GET/POST attendance, POST attendance/bulk |
| PayrollController | GET payroll, GET payroll/periods, POST payroll/{process,draft}, PUT payroll/items/{id}, GET/PUT settings/payroll |
| PerformanceController | GET/POST performance, PUT/DELETE performance/{id} |

This deliberately restrictive interim boundary closes the known data exposure to publicly registered applicants and future federated users. **Management users can still authenticate and manage their own profile/password, but business routes now return 403** until an explicit management/record-ownership matrix is approved. This behavior change is necessary to avoid inventing granular permissions or allowing authentication alone to expose payroll/HR records. It is not a final business authorization policy. HR administrators retain business access.

Self-service routes POST auth/logout, GET auth/me, PUT auth/password and PUT auth/profile require authenticated active, non-deleted accounts but no staff role; they operate on the current user. Public routes remain POST auth/register, POST auth/login, GET jobs, GET jobs/{id}, POST applications, and the web welcome page. Public recruitment remains a distinct workflow, not an external identity linking path.

### Security review and changes

| Issue and risk | Required before external sign-in? | This phase |
| --- | --- | --- |
| Inactive/deleted accounts could authenticate; existing tokens survived deactivation checks | Yes | Login checks active and deleted_at; protected API middleware rejects inactive/deleted local representations on every request, including session/bearer use. No broad SoftDeletes lifecycle refactor. |
| Plaintext request logging, login-response tokens and Axios error objects could disclose credentials | Yes | Removed credential-bearing registration logging and frontend login logging; authentication errors no longer log traces or expose exception details. Safe user-ID success logs remain. |
| Public registration could choose privileged roles | Yes | Public registration always assigns applicant; submitted role/identity fields are ignored. Validation errors return 422. |
| Fixed employee password; partial account creation | Yes | Employee and user inserts are transactional; new local representation is inactive and has no password. |
| Known administrator seed password | Yes for production use | Demo UserSeeder now refuses outside local/testing. Existing seeded accounts still require operator review and credential rotation; no passwords were silently changed. |
| Logout failed for session authentication and retained browser state | Yes | Revoke actual current personal token only, safely handle Sanctum transient/session tokens, log out web guard, invalidate session and regenerate CSRF token. Frontend clears actual auth_token/user storage and cookies even on network failure; 401 cleanup also removes profile state. |
| Authentication without business authorization | Yes | Apply the interim hr_admin boundary above. Fine-grained management and ownership decisions remain a prerequisite to broadening access. |
| Wildcard CORS with credentials | Yes before cookie-based external login | Explicit comma-separated CORS_ALLOWED_ORIGINS, trimmed, empty/wildcard entries excluded; default http://localhost:3000. Production must configure exact frontend origins. CORS is not authorization. |
| Local lifecycle and central revocation | Yes before federation | Local active/deleted checks enforced; central suspension propagation, token expiry and unlink/reactivation behavior remain future design work. |

### Remaining risks and decisions requiring confirmation

- Approve the intended management/ownership matrix before restoring management business access; the UI still displays links users may be forbidden to use.
- Select link approvers, privileged dual approval, identity proof and audit retention; finalize trusted issuer/subject contract and provider allowlist.
- Decide new employee credential enrollment/activation, provisioning model, applicant access and profile field ownership.
- Existing seed/shared-password accounts and historical logs require a controlled inventory, rotation and log-access/retention review; this phase did not inspect or rewrite production data.
- Browser tokens remain JavaScript-readable, Sanctum expiry remains unbounded, and API CSRF exemptions/stateful-session alignment need resolution before adopting cookie-based external sign-in. No SSO or secure cookie redesign is claimed here.
- Local deactivation denies requests while inactive but does not delete every stored token; reactivation can revive old tokens. Confirm permanent revocation, session lifetime, IAM outage and central access-revocation policies before federation.
- MySQL/PostgreSQL deployment migration verification, backup/rollback rehearsal, exact production CORS origins and minimum supported SQLite version remain rollout checks. PostgreSQL compatibility of the wider existing migration history was not asserted.
- A failed network logout clears browser state but cannot guarantee remote token revocation. Central logout remains undefined and unimplemented.

### Validation

Tests cover local login, preservation of IDs/hashes across the password migration, employee and attendance references, explicit identity association, duplicate issuer/subject rejection, case-sensitive/scoped subjects, email mutation and no email/request-field linking, unchanged applicant/management/admin roles, null-password denial, inactive/deleted login/token rejection, privileged registration prevention, every business-route denial for linked applicant/management users, administrator employee creation and rollback on insert failure, logout, CORS rejection, safe authentication logging, foreign-key integrity, guarded password rollback and production seed refusal.

Validation results are recorded after the final test/check run below. No application database was migrated and no existing account was linked.

### Files in this preparation

- `.gitignore`: make this previously ignored report versionable (other docs stay ignored).
- `backend/app/Models/User.php`, `ExternalIdentity.php`: identity relations and user casts.
- `backend/app/Http/Controllers/AuthController.php`, `EmployeeController.php`: authentication/credential/lifecycle fixes and atomic employee creation.
- `backend/app/Http/Middleware/EnsureActiveUser.php`, `backend/routes/api.php`: active-account and local role enforcement.
- `backend/config/cors.php`, `backend/database/seeders/UserSeeder.php`: explicit browser origins and production seed guard.
- `backend/database/migrations/2026_09_15_000000_create_external_identities_table.php`: new identity table only.
- `backend/database/migrations/2026_09_15_000001_make_users_password_nullable.php`: nullable local credential only.
- `backend/phpunit.xml`, `backend/tests/Feature/FederationPreparationTest.php`: isolated database and security regression coverage.
- `frontend/app/login/page.tsx`, `frontend/components/layout/header.tsx`, `frontend/services/api.ts`, `frontend/services/auth-storage.ts`, `frontend/tests/auth-storage.test.cjs`: secret logging removal, browser cleanup and two executable Node tests. Relevant installed Next.js docs directory requested by frontend/AGENTS.md was absent; these changes retain the existing framework APIs.
- `docs/hrm-integration-analysis.md`: this preparation design, route inventory, rollout strategy and verification report.

Pre-existing unrelated changes to `backend/composer.lock` and `frontend/app/(public)/layout.tsx` were preserved without edits.

### Final check results

| Check | Result |
| --- | --- |
| Complete backend suite: `php vendor/phpunit/phpunit/phpunit --do-not-cache-result` | PASS: 22 tests, 187 assertions (20 federation/security tests plus 2 original tests). Real relevant migrations run only in forced in-memory SQLite. |
| Frontend cleanup: `node --test tests/auth-storage.test.cjs` | PASS: 2 tests, including repeat cleanup and blocked-storage cookie expiration. |
| TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS. |
| PHP syntax: `php -l` for all PHP files under app/config/database/routes/tests | PASS. No PHPStan/Psalm project configuration was found; syntax checks are not equivalent to a type analyzer. |
| Changed PHP: `php vendor/bin/pint --dirty --test` | PASS after formatting touched PHP files. |
| Whole backend: `php vendor/bin/pint --test` | FAIL on existing formatting in untouched controllers, models, middleware, migrations and seeders. No unrelated formatting applied. |
| Standard frontend: `CI=1 npm.cmd run lint` | Existing Next.js lint command prompts for setup; checked-in flat config is incompatible with this installed command. No setup/configuration changes made. |
| Full frontend fallback: `ESLINT_USE_FLAT_CONFIG=false node node_modules/eslint/bin/eslint.js --no-eslintrc --config node_modules/eslint-config-next/core-web-vitals.js --ext .ts,.tsx app components hooks lib services types middleware.ts` | Executed successfully as a lint tool, reports 9 existing unescaped-apostrophe errors in public jobs detail, public landing page and footer, plus 4 hook-dependency warnings in untouched files. |
| Same fallback lint restricted to changed frontend source | PASS. |
| Whole frontend: `node node_modules/prettier/bin/prettier.cjs --check .` | FAIL: initial whole-tree run reported 49 files; changed frontend files were then formatted, unrelated files left alone. |
| Prettier check restricted to changed frontend source and cleanup test | PASS. |
| `git diff --check` | PASS; only platform line-ending notices. |

No production database, seed operation, IAM service or external identity endpoint was used. No dependencies were added or updated. Production migration compatibility and browser end-to-end behavior have not been verified. Stop here; federation login remains unimplemented.
