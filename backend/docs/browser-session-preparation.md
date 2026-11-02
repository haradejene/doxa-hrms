# HRM browser/session prerequisite checkpoint

This document records the earlier preparation checkpoint. Its deferred API CSRF gap is now addressed by the credential boundary described in [csrf-boundary.md](csrf-boundary.md). Cookie-bearing stateful API mutations require CSRF; cookieless bearer/public requests retain their existing behavior. The historical inspection below explains why this follow-up was required.

This checkpoint prepares configuration only. No Doxa routes, controllers, authorization calls, callback handling, identity linking, provisioning, or logout integration are implemented. No IAM server is needed for the checks below.

## Inspected local configuration

The actual backend `.env` sets `APP_ENV=local`, `APP_URL=http://localhost:8000`, `SESSION_DRIVER=file`, `SESSION_LIFETIME=120`, and `CACHE_DRIVER=file`. Frontend `.env.local` uses `NEXT_PUBLIC_API_URL=http://localhost:8000`; the frontend origin allowed by the backend is `http://localhost:3000`.

The session cookie is `doxa_hrms_session`, derived from the local `APP_NAME`. Its path is `/`, domain is null (host-only), HttpOnly is true, SameSite is `lax`, and partitioning is disabled. Local Secure is false after this preparation; previously it was unset/null. Idle lifetime is 120 minutes and expire-on-close is false. Session payload encryption at rest is false; the session-ID cookie is encrypted by Laravel's `EncryptCookies`, which has no exemptions. These are different encryption settings. Do not expose session files through the web server.

Sessions use `backend/storage/framework/sessions`; cache and file locks use `backend/storage/framework/cache/data`. Both directories exist. File sessions and FileStore are supported prerequisites for a single host. FileStore provides persistent atomic `add`, which the SDK requires for transaction/replay claims. The SDK encrypts transaction payloads before caching them. Never use cookie sessions or array/null cache for the future flow; array sessions are only suitable for tests.

PDO MySQL, PostgreSQL, SQLite, and the PHP Redis extension are installed. The default database connection is MySQL, and Redis connections are configured. Connectivity to either server has not been established by this checkpoint. No session/cache table migrations exist in this project, so database session/cache drivers are not ready merely because connection definitions exist. No infrastructure or migrations were added. Multiple application hosts require a supported shared session store and shared atomic transaction cache; isolated per-host files are insufficient.

## Environment contract

The committed `.env.example` describes HTTP local development, not a production-safe deployment. The existing private `.env` is unchanged.

For deployment, supply these values through the deployment environment:

- `APP_ENV=production`, `APP_DEBUG=false`, and `APP_URL` set to the backend's externally reachable HTTPS URL. `APP_URL` does not itself enable TLS or Secure cookies.
- `SESSION_SECURE_COOKIE=true`. Source configuration defaults to true when `APP_ENV=production`, but an explicit false overrides it: do not carry the local example's false into deployment. Other HTTPS environments, including staging and future local OIDC testing, also need true.
- `SESSION_SAME_SITE=lax` for the expected top-level GET callback. Strict is not suitable for the SDK. None requires Secure/HTTPS and a justified cross-site browser topology; do not select it automatically. Cross-site POST callbacks do not have the same Lax-cookie behavior and are not prepared here.
- Leave `SESSION_DOMAIN=null` unless a reviewed browser topology actually requires sharing across application subdomains. Never scope the HRM cookie to the IAM domain or a broad parent domain merely for redirects. Preserve a stable backend host, cookie name, path, domain, and application key throughout a transaction. Cookies are not isolated by port: avoid sibling local applications using the same cookie name on the same host.
- Set `SANCTUM_STATEFUL_DOMAINS` explicitly to the trusted application frontend/backend hosts with ports where applicable, without schemes. Set `CORS_ALLOWED_ORIGINS` to the exact trusted frontend origins including schemes and ports. Do not add IAM to these lists for top-level redirects. The existing CORS configuration supports credentials and filters out the literal wildcard origin; allowed origin patterns are empty.
- Keep persistent server-side session/cache drivers. Protect storage permissions and persist the application key securely. If using multiple hosts, provision and verify shared storage before enabling login.

Apply deployment configuration using the usual configuration-cache rebuild. There is no configuration cache currently in the inspected local checkout. `TrustProxies` has no explicitly trusted proxies; a deployment behind TLS termination needs an infrastructure-specific trusted-proxy review so HTTPS/request URL detection is correct. No proxy trust was broadened here.

The installed SDK's provider refuses to resolve its browser context unless Secure is exactly true, HttpOnly is true, SameSite is lax/none, and the session driver is not cookie. Therefore the current HTTP development setup can exercise existing HRM behavior but cannot run the future SDK browser flow as configured. Use HTTPS with Secure cookies for that work; do not bypass the SDK checks.

## CSRF and API impact: behavioral change deferred

The `web` group includes encrypted/queued cookies, `StartSession`, and the application's `VerifyCsrfToken`. `routes/web.php` currently contains only the welcome route. The `api` group includes Sanctum's `EnsureFrontendRequestsAreStateful`, API throttling, and route bindings. Stateful requests receive cookie/session/CSRF middleware; `auth:sanctum` checks the web guard before bearer tokens.

However, `App\Http\Middleware\VerifyCsrfToken::$except` contains `api/*`. All API mutations therefore bypass CSRF verification even when authenticated using a browser cookie. This is an existing gap, independent of OIDC; CORS and SameSite are not substitutes for CSRF validation. The exemption is unchanged because removing it changes existing API/client behavior and exceeds this configuration-only checkpoint.

Before enabling browser session authentication, replace the blanket exemption with a reviewed, narrowly scoped policy. Cookie-authenticated logout, password/profile updates, and all POST/PUT/PATCH/DELETE business mutations need CSRF protection. Login/registration need login-CSRF consideration when establishing a browser session; review the public application-submission endpoint separately. Bearer-only external clients must remain usable without a browser CSRF cookie, while requests carrying ambient session authentication must not bypass verification simply because they also include an Authorization header.

Coordinate frontend/client changes first: initialize CSRF via `/sanctum/csrf-cookie`, send credentials and the corresponding X-XSRF-TOKEN header for stateful mutations, and verify actual behavior with middleware active (Laravel's normal unit-test environment bypasses CSRF checks). The current frontend API client has `withCredentials: false` and stores the existing Sanctum bearer token in localStorage; it is not prepared for cookie-session API mutations. Neither frontend code nor the exemption was changed. No OAuth tokens or new browser token storage were introduced.

Do not exempt future web routes wholesale. When callback handling is separately authorized, review its method and SDK state/session validation explicitly; no callback route or CSRF exception is added here.

## Session identity stability

Ordinary `StartSession` starts/resumes and saves the same valid session ID; no custom middleware/provider was found rotating it on every request. The SDK hashes that ID for its transaction binding. A callback must return with the same cookie/session that began the transaction.

Current password login calls `Auth::attempt` in `AuthController::login`. With the default web SessionGuard, successful login invokes `SessionGuard::login` -> `updateSession` -> `session->migrate(true)`, destroying the previous session and generating a new ID. The controller does not separately call `regenerate()` or regenerate the CSRF token there. Logout calls `Auth::guard('web')->logout`, then `session->invalidate()` and `regenerateToken()` when a request session exists; invalidate flushes data and migrates/destroys the ID. Registration creates a bearer token and does not call web-guard login. No authentication behavior was changed.

Password login or logout in another tab during a future OAuth round trip can invalidate its browser binding. That must fail safely and require a fresh attempt. Future integration must not rotate the ID between transaction creation and validation; any post-authentication rotation belongs after successful callback validation, in a separately approved implementation.

## Remaining implementation gates

Review and implement the browser-CSRF/client policy before enabling session-authenticated API mutations. Establish the HTTPS browser topology and verify Secure/HttpOnly/Lax cookies, the same host/session across the redirect, trusted proxy handling, and persistent storage in the target deployment. Confirm any shared-store availability/atomicity for multiple hosts. OIDC client configuration and IAM registration belong to the subsequent implementation task, not this preparation.

This checkpoint adds no browser-readable OAuth tokens, JavaScript-readable session cookies, localStorage authentication, broader origins, secrets, production domains, session-ID changes, or new CSRF exemptions. Existing localStorage Sanctum authentication and the API CSRF gap remain explicitly recorded limitations. Full SDK security coverage remains the independent Laravel 10–12 matrix; the previously passing HRM subset is not full coverage.

## Checkpoint validation

`composer validate --strict` passed without warnings. The unchanged HRM PHPUnit suite passed 22 tests / 187 assertions with no failures, errors, or skips. Direct checks against the local configuration confirmed file-session persistence and a stable ID after reopening the session, file-cache persistence and rejection of a duplicate `add` from a separate store instance, and HttpOnly/Lax/host-only cookie flags on the existing welcome route. Production defaults and explicit Secure/SameSite environment overrides passed in-memory checks; the private `.env` was not changed.

A direct CSRF middleware check outside Laravel's testing environment rejected a web mutation without a token and accepted a valid token. It also confirmed that the existing `api/*` exemption accepts a tokenless mutation at the CSRF layer. These checks invoked no API controllers and added no routes or fake OIDC tests. Temporary session/cache entries were removed. `git diff --check` passed. No deployment, IAM, Redis/database connectivity, real browser redirect, or multi-process concurrency claim is made by these checks.
