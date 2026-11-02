# Pre-linked Doxa OIDC login

HRM is the relying party. Doxa IAM validates identity and application access;
HRM owns local users, numeric IDs, roles, permissions, and sessions.

## Routes and policy

- `GET /auth/doxa` calls the installed SDK's `DoxaClient::beginLogin()`.
- `GET /auth/doxa/callback` passes the real request to `handleCallback()`.
- Both routes use Laravel's web session and the SDK's no-store/no-referrer middleware.
- Only `openid` is requested. PKCE is mandatory; UserInfo is disabled.
- HRM uses the identity's exact issuer and subject to query `ExternalIdentity`.
  Empty or greater-than-255-byte keys are rejected. No normalization or truncation
  occurs; a byte-exact comparison also guards against permissive DB collations.
- Missing links, missing/deleted users, and inactive users are denied with
  `access_denied`. There is no email/name fallback, provisioning, profile sync,
  account-linking UI, or IAM role mapping.
- The browser cannot choose a return destination. Successful login goes to the
  fixed dashboard. SDK errors expose only their safe categories; unexpected
  host failures return `authentication_unavailable` without traces or SQL.

The session ID stays stable through SDK callback validation and local eligibility
checks. Only then does `Auth::guard('web')->login($user, false)` destroy/migrate the
old session ID; HRM also regenerates its CSRF token. No Sanctum personal token is
issued and no OAuth token or `DoxaIdentity` is stored in the browser/session/DB.
Telescope and Debugbar exclude these routes from request diagnostics.

## Protected deployment configuration

Configure backend values in protected environment configuration, then rebuild
Laravel's config cache after reviewing the values:

- `DOXA_ISSUER`: exact trusted HTTPS issuer advertised by Doxa discovery.
- `DOXA_CLIENT_ID`: registered OAuth client ID (not the IAM application ID).
- `DOXA_REDIRECT_URI`: exact registered HTTPS URI ending `/auth/doxa/callback`.
- `DOXA_CLIENT_SECRET`: secret only for a confidential registration. Empty/absent
  means public client; the SDK selects the advertised client-authentication method.
- `DOXA_CACHE_STORE`: optional persistent Laravel cache store; empty uses the
  default. File cache/session storage works on one server; multiple servers need
  shared supported transaction cache and shared sessions, with a stable `APP_KEY`.
- `APP_URL`: public HTTPS HRM URL; configure trusted proxies correctly when TLS
  terminates before Laravel. `APP_DEBUG=false` in deployment.
- `SESSION_DRIVER`: server-side; `SESSION_SECURE_COOKIE=true`,
  `SESSION_SAME_SITE=lax`, `SESSION_DOMAIN=null` for host-only cookies. HttpOnly
  remains enabled. HTTP development still supports passwords, but cannot run OIDC.
- `SANCTUM_STATEFUL_DOMAINS`: explicit HRM public host with port where needed.
  Existing credentialed CORS origins must stay explicit; never use wildcard origins.
- `HRM_FRONTEND_URL`: optional fixed HTTPS public frontend origin, without
  query/fragment. By default the redirect is the relative `/dashboard`, preserving
  the browser's public origin even when Next proxies to an internal backend host.

Use one public HRM origin for frontend, API, CSRF-cookie endpoint, and both OIDC
routes. The frontend proxies those paths to `HRM_BACKEND_URL`, a server-side Next
environment value; the existing `NEXT_PUBLIC_API_URL` remains a compatibility
fallback, followed by the existing local backend default. Configure it before
building Next and restart after configuration changes. Register the callback on
the public HRM origin, not an unreachable internal backend host. Serving callback
and frontend on separate hosts does not transfer host-only session cookies.

The API client now uses same-origin cookies and Axios's XSRF header, bootstrapping
`/sanctum/csrf-cookie` before a mutation when necessary. Dashboard/login middleware
checks `/api/auth/me` server-side with incoming cookies and no caching. The existing
password bearer token remains supported. Starting Doxa login clears only legacy
frontend credentials; it does not change the Laravel session ID. OIDC credentials
are never put in localStorage or JavaScript-readable cookies. Local logout still
uses the existing HRM endpoint; IAM logout/revocation synchronization is not added.

Exclude callback query strings from proxy/access logs and monitoring. Keep IAM
and HRM cookies separate, and trust only intended proxy addresses. No TLS bypass
or production domain/secret is built into source.

## Verification and real-account linking

Feature tests use real SDK services and signed RS256 ID tokens; only the provider
HTTP transport is replaced. They exercise discovery, PKCE, nonce/state, exact
identity matching, rejected transactions/replays, post-validation session rotation,
safe failures, local role enforcement, and real CSRF enforcement after OIDC login.
These are host integration tests, not the SDK's complete security suite. The SDK's
independent Laravel 10–12 matrix remains the source of full SDK security coverage.

Validation: 81 HRM tests / 488 assertions pass, including 38 new OIDC integration
cases / 197 assertions and the existing 43 tests / 291 assertions. Frontend's 11
Node tests, TypeScript checking, production build, Composer strict validation,
platform requirements, PHP syntax checks, and `git diff --check` also pass.
The final Next build completed with exit code 0 but emitted a compiler-worker
SIGTERM diagnostic; no dependency upgrade or unrelated build fix was made.

No real IAM identity was linked or provisioned by this change. Real-browser
verification is pending configured HTTPS applications, the existing registered
client/callback, and an approved pre-linked test identity. An administrator must
identify the intended existing active HRM user by its local ID and independently
verify the exact IAM issuer/public subject before creating the existing
`external_identities` relation. Do not infer that link from matching email.

For the live check, record how that approved link was established, visit the HRM
login page, select Continue with Doxa, authenticate at IAM with HRM application
access, and confirm return to the local user's dashboard. Verify `/api/auth/me`
returns that user's local role and a normal Secure/HttpOnly session, then confirm
a browser mutation requires its CSRF token. Record actual results before claiming
end-to-end verification. This procedure does not create users or modify IAM.
