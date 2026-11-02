# HRM CSRF credential boundary

## Route map inspected before implementation

The actual route collection and `routes/api.php` were inspected, with the existing Sanctum 3.3.3 guard/middleware source. All HRM API routes use the `api` group: Sanctum stateful-request middleware, throttling, and bindings. No HRM route uses plain `auth`; protected routes use `auth:sanctum` plus `EnsureActiveUser`. Sanctum tries the web session guard before bearer authentication. The business group additionally requires `role:hr_admin`.

| Routes (all API paths below start with `/api`) | Methods | Authentication |
| --- | --- | --- |
| `/` | GET/HEAD | Public web welcome, with session and CSRF middleware |
| `/sanctum/csrf-cookie` | GET/HEAD | Public web CSRF/session bootstrap |
| `/auth/login`, `/auth/register` | POST | Public password login / registration, returning existing Sanctum bearer tokens |
| `/jobs`, `/jobs/{id}` | GET/HEAD | Public |
| `/applications` | POST | Public careers application submission |
| `/auth/me` | GET/HEAD | Sanctum session or bearer, active user |
| `/auth/logout` | POST | Sanctum session or bearer, active user |
| `/auth/password`, `/auth/profile` | PUT | Sanctum session or bearer, active user |
| `/dashboard/{metrics,activities,notifications,recent-employees,analytics}` | GET/HEAD | Sanctum session or bearer, active HR admin |
| `/employees` | GET/HEAD, POST | Sanctum session or bearer, active HR admin |
| `/employees/{id}` | GET/HEAD, PUT | Sanctum session or bearer, active HR admin |
| `/job-postings` | GET/HEAD, POST | Sanctum session or bearer, active HR admin |
| `/job-postings/{id}` | PUT, DELETE | Sanctum session or bearer, active HR admin |
| `/applications`, `/applications/{id}` | GET/HEAD | Sanctum session or bearer, active HR admin |
| `/applications/{id}` | PUT | Sanctum session or bearer, active HR admin |
| `/interviews` | GET/HEAD, POST | Sanctum session or bearer, active HR admin |
| `/interviews/{id}` | GET/HEAD | Sanctum session or bearer, active HR admin |
| `/attendance` | GET/HEAD, POST | Sanctum session or bearer, active HR admin |
| `/attendance/bulk` | POST | Sanctum session or bearer, active HR admin |
| `/payroll`, `/payroll/periods` | GET/HEAD | Sanctum session or bearer, active HR admin |
| `/payroll/process`, `/payroll/draft` | POST | Sanctum session or bearer, active HR admin |
| `/payroll/items/{id}` | PUT | Sanctum session or bearer, active HR admin |
| `/settings/payroll` | GET/HEAD, PUT | Sanctum session or bearer, active HR admin |
| `/performance` | GET/HEAD, POST | Sanctum session or bearer, active HR admin |
| `/performance/{id}` | PUT, DELETE | Sanctum session or bearer, active HR admin |

There are no password-reset, PATCH, Doxa login, or OIDC callback routes. Telescope's pre-existing package routes use its separate middleware group and are outside the HRM `api/*` exemption; they were not modified. Frontend services contain calls to DELETE `/api/employees/{id}` and PATCH `/api/applications/{id}/stage` that do not exist in the current backend route map. This checkpoint does not repair those unrelated mismatches.

Every protected unsafe method above can mutate using a browser session when Sanctum recognizes the frontend Origin/Referer and starts/resumes that session. No protected HRM endpoint is declared bearer-only: bearer tokens are a second supported credential mechanism on those same routes. Public routes remain unauthenticated; cookie-bearing public mutations still need CSRF, particularly login which can replace session authentication.

## Smallest boundary

Keep `api/*` in the application CSRF exemption list for compatibility, but override exemption matching for API requests with an attached session and either a decrypted Laravel session cookie or an authenticated web guard. Such requests receive Laravel's unchanged token comparison, encrypted X-XSRF-TOKEN decoding, and 419 rejection behavior. This includes anonymous cookie-bearing sessions, mixed session/bearer credentials, and future unsafe HTTP methods. No route-specific CSRF bypass is added. Web routes retain standard CSRF behavior.

Sanctum's existing stateful pipeline decrypts cookies and starts the session before invoking this middleware. Requests without a recognized stateful Origin/Referer do not get that session pipeline; cookies alone do not authenticate those API requests. Requests with no browser session credentials retain the existing API exemption, even if they have a trusted frontend Origin. A newly started empty session without an incoming session cookie is not itself an existing browser credential. This preserves the current cross-origin bearer frontend and public cookieless clients.

An Authorization header never decides the exemption. A valid bearer token accompanying an authenticated session does not avoid CSRF or override Sanctum's session-first identity selection. Bearer clients that also send a stateful session cookie must supply its CSRF token; truly bearer-only clients should not carry those cookies. A forged or undecipherable cookie does not supply an authenticated session. Missing/untrusted Origin/Referer does not create session authentication; bearer authentication remains unchanged.

No login/password/logout controller, auth route, role rule, middleware ordering, session settings, CORS settings, SDK usage, or authentication semantics are changed. The only production change is the credential-aware exemption decision in `VerifyCsrfToken`.

## Frontend and deployment

The current API client uses a localStorage Sanctum token, an Authorization header, and `withCredentials: false`, with API `http://localhost:8000` and frontend `http://localhost:3000`. That cookieless cross-origin mode remains supported without CSRF headers. Same-origin browser calls send cookies regardless of `withCredentials: false`; if they carry the Laravel session cookie, they must now send a CSRF token. Previously bootstrapped anonymous session cookies also require CSRF for public mutations.

For the future cookie-session milestone, bootstrap `/sanctum/csrf-cookie`, retain cookies, then send credentials and X-XSRF-TOKEN (the URL-decoded encrypted XSRF cookie value) or a trusted server-provided X-CSRF-TOKEN on mutations. JavaScript may read the CSRF cookie; the authentication session cookie remains HttpOnly. Cross-origin clients need `withCredentials: true` / fetch `credentials: include`, exact allowed CORS origins, and trusted Sanctum hosts with ports. Verify that the client actually sends the XSRF header cross-origin; credentials alone are insufficient. Separate frontend/backend hosts may require an explicitly reviewed CSRF-cookie/token delivery topology; do not broaden the session domain automatically. IAM redirects do not require adding IAM to CORS or Sanctum stateful domains.

Existing CORS allows the explicit frontend origin, supports credentials, has empty origin patterns, and filters literal wildcard origins. Cookie Secure/HttpOnly/SameSite settings remain unchanged by this task. Future SDK browser testing requires HTTPS and Secure cookies, stable session identity, correct proxy handling, and persistent/shared storage where applicable. No OAuth browser storage, OIDC flow, IAM call, or frontend migration is added.

## Focused validation

The new tests use the real existing routes and real file-backed sessions/cookies. Only users/token tables from existing migrations are installed in SQLite memory. The test application environment is set to local so Laravel's usual PHPUnit CSRF bypass is disabled; session Secure=false is limited to these HTTP test requests. Middleware and token checks remain active, and no fake OIDC routes are created.

Results: the original suite passed before the change (22 tests / 187 assertions). The new boundary suite passes 21 tests / 104 assertions, and the complete suite passes 43 tests / 291 assertions, with zero failures, errors, or skips. Coverage includes missing/invalid/foreign/malformed tokens, valid encrypted XSRF headers, real session profile updates and logout, GET `/auth/me`, business POST/PUT/DELETE blocking, mixed valid/invalid bearer headers, anonymous session cookies, non-stateful cookie requests, cookieless bearer mutations/logout, and public login/registration/validation. Composer strict validation and platform checks pass. `git diff --check` passes. No IAM server or SDK/OIDC harness was used.
