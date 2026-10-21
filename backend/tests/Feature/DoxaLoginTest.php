<?php

namespace Tests\Feature;

use App\Auth\DoxaUserProvisioner;
use App\Models\User;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Exceptions\ApplicationAccessException;
use Doxa\Laravel\Identity\DoxaIdentity;
use Doxa\Laravel\Transaction\AuthorizationTransaction;
use Illuminate\Database\QueryException;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\Fixtures\OidcProviderTransport as Provider;
use Tests\TestCase;

class DoxaLoginTest extends TestCase
{
    private string $directory;

    private Provider $provider;

    private string $browserId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app->instance('env', 'local'); // Keep real CSRF checks active.
        $this->directory = storage_path('framework/testing/oidc-'.bin2hex(random_bytes(12)));
        (new Filesystem)->makeDirectory($this->directory.'/sessions', 0755, true);
        config([
            'app.url' => 'https://hrm.example.test',
            'session.driver' => 'file', 'session.files' => $this->directory.'/sessions',
            'session.secure' => true, 'session.same_site' => 'lax', 'session.domain' => null,
            'cache.default' => 'oidc-test',
            'cache.stores.oidc-test' => ['driver' => 'file', 'path' => $this->directory.'/cache'],
            'doxa.issuer' => Provider::ISSUER, 'doxa.client_id' => Provider::CLIENT,
            'doxa.redirect_uri' => Provider::CALLBACK, 'doxa.client_secret' => null,
            'doxa.cache_store' => 'oidc-test', 'hrm.frontend_url' => null,
            'doxa.scopes' => ['openid'], 'hrm.doxa_account_policy' => 'existing-account-only',
            'sanctum.stateful' => ['hrm.example.test'],
        ]);
        foreach (['2014_10_12_000000_create_users_table.php', '2019_12_14_000001_create_personal_access_tokens_table.php',
            '2026_09_15_000000_create_external_identities_table.php',
            '2026_09_15_000001_make_users_password_nullable.php',
            '2026_07_01_045079_create_audit_logs_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        Schema::table('external_identities', fn ($table) => $table->string('pending_link_id', 64)->nullable());
        $this->provider = new Provider;
        $this->app->instance(Transport::class, $this->provider);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('external_identities');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
        $directory = realpath($this->directory);
        if ($directory !== false && dirname($directory) === realpath(storage_path('framework/testing'))) {
            (new Filesystem)->deleteDirectory($directory);
        }
        parent::tearDown();
    }

    private function linkedUser(array $attributes = [], string $issuer = Provider::ISSUER, string $subject = 'public-subject'): User
    {
        $user = User::factory()->create(['email' => 'local@example.test', ...$attributes]);
        $user->externalIdentities()->create(['issuer' => $issuer, 'subject' => $subject]);

        return $user;
    }

    private function freshRequest(): void
    {
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->app['auth']->forgetGuards();
        $this->app['session']->forgetDrivers();
        $this->app->forgetInstance('session.store');
    }

    private function begin(): array
    {
        $this->freshRequest();
        $response = $this->get('https://hrm.example.test/auth/doxa');
        $this->assertSame(302, $response->getStatusCode(), $response->getContent());
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->provider->authorization = $query;
        $this->browserId = $response->getCookie(config('session.cookie'))->getValue();
        $this->withCookie(config('session.cookie'), $this->browserId)->withCredentials();

        return $query;
    }

    private function completeCallback(?array $query = null)
    {
        $this->freshRequest();

        return $this->get(Provider::CALLBACK.'?'.http_build_query($query ?? [
            'code' => 'PRIVATE-CODE', 'state' => $this->provider->authorization['state'],
        ]));
    }

    public function test_entry_uses_sdk_openid_pkce_and_does_not_rotate_existing_session(): void
    {
        $initial = $this->get('https://hrm.example.test/sanctum/csrf-cookie')->getCookie(config('session.cookie'))->getValue();
        $this->withCookie(config('session.cookie'), $initial);
        $query = $this->begin();
        $this->assertSame($initial, $this->browserId);
        $this->assertSame('openid', $query['scope']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertSame(Provider::CALLBACK, $query['redirect_uri']);
        $this->assertSame(Provider::CLIENT, $query['client_id']);
        $this->assertSame(43, strlen($query['state']));
        $this->assertSame(43, strlen($query['nonce']));
    }

    public function test_linked_active_user_gets_rotated_secure_local_session_without_tokens_or_profile_sync(): void
    {
        $user = $this->linkedUser(['role' => 'hr_admin']);
        $before = $user->fresh()->getAttributes();
        $this->begin();
        $this->provider->onExchange = function () {
            $this->assertSame($this->browserId, $this->app['request']->session()->getId());
            $this->assertGuest('web');
        };
        $response = $this->completeCallback();
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user, 'web');
        $cookie = $response->getCookie(config('session.cookie'));
        $this->assertNotSame($this->browserId, $cookie->getValue());
        $this->assertFileDoesNotExist($this->directory.'/sessions/'.$this->browserId);
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', $cookie->getSameSite());
        $this->assertSame(0, $user->tokens()->count());
        $this->assertSame($before, $user->fresh()->getAttributes());
        $this->assertSame(0, $this->provider->userinfoCalls);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $response->assertHeader('Referrer-Policy', 'no-referrer');
        $browserOutput = $response->getContent().json_encode($response->headers->all());
        foreach (['PRIVATE-CODE', 'PRIVATE-ACCESS', 'PRIVATE-REFRESH', $this->provider->idToken] as $secret) {
            $this->assertStringNotContainsString($secret, $browserOutput);
            foreach ((new Filesystem)->files($this->directory.'/sessions') as $file) {
                $this->assertStringNotContainsString($secret, $file->getContents());
            }
        }
        $this->withCookie(config('session.cookie'), $cookie->getValue());
        $this->freshRequest();
        $this->withHeader('Origin', 'https://hrm.example.test')->getJson('https://hrm.example.test/api/auth/me')
            ->assertOk()->assertJsonPath('id', $user->id)->assertJsonPath('role', 'hr_admin');
    }

    public function test_unknown_subject_with_matching_email_does_not_link_or_provision(): void
    {
        $user = User::factory()->create(['email' => 'local@example.test']);
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertGuest('web');
        $this->assertSame(1, User::count());
        $this->assertSame(0, $user->externalIdentities()->count());
    }

    public function test_valid_unlinked_identity_cannot_borrow_another_accounts_mapping(): void
    {
        $existing = $this->linkedUser(['role' => 'hr_admin'], Provider::ISSUER, 'different-subject');
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertSame(1, $this->provider->exchanges);
        $this->assertGuest('web');
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('external_identities')->count());
        $this->assertSame('different-subject', $existing->externalIdentities()->sole()->subject);
    }

    public function test_explicit_identity_mapping_allows_a_fresh_attempt_after_unlinked_denial(): void
    {
        $target = User::factory()->create(['role' => 'applicant', 'email' => 'local@example.test']);
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertGuest('web');
        $this->assertSame(0, DB::table('external_identities')->count());

        // Isolated fixture represents a completed explicit link; callbacks never create it.
        $target->externalIdentities()->create(['issuer' => Provider::ISSUER, 'subject' => 'public-subject']);
        $this->begin();
        $response = $this->completeCallback()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($target, 'web');
        $this->assertSame('applicant', $target->fresh()->role);
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('external_identities')->count());
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        $this->freshRequest();
        $this->withHeader('Origin', 'https://hrm.example.test')->getJson('https://hrm.example.test/api/auth/me')
            ->assertOk()->assertJsonPath('id', $target->id)->assertJsonPath('role', 'applicant');
        $this->getJson('https://hrm.example.test/api/employees')->assertForbidden();
    }

    public function test_linked_applicant_replaces_an_existing_admin_session_by_exact_identity(): void
    {
        $admin = $this->linkedUser(['role' => 'hr_admin'], Provider::ISSUER, 'admin-subject');
        $target = User::factory()->create(['role' => 'applicant']);
        $target->externalIdentities()->create(['issuer' => Provider::ISSUER, 'subject' => 'public-subject']);
        $this->provider->claims = ['sub' => 'admin-subject'];
        $this->begin();
        $first = $this->completeCallback()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($admin, 'web');
        $this->withCookie(config('session.cookie'), $first->getCookie(config('session.cookie'))->getValue());

        $this->provider->claims = [];
        $this->begin();
        $second = $this->completeCallback()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($target, 'web');
        $this->withCookie(config('session.cookie'), $second->getCookie(config('session.cookie'))->getValue());
        $this->freshRequest();
        $this->withHeader('Origin', 'https://hrm.example.test')->getJson('https://hrm.example.test/api/auth/me')
            ->assertOk()->assertJsonPath('id', $target->id)->assertJsonPath('role', 'applicant');
        $this->getJson('https://hrm.example.test/api/employees')->assertForbidden();
    }

    public function test_existing_admin_session_is_not_proof_of_a_mapping_for_an_unlinked_identity(): void
    {
        $admin = $this->linkedUser(['role' => 'hr_admin'], Provider::ISSUER, 'admin-subject');
        $this->provider->claims = ['sub' => 'admin-subject'];
        $this->begin();
        $first = $this->completeCallback()->assertRedirect('/dashboard');
        $this->withCookie(config('session.cookie'), $first->getCookie(config('session.cookie'))->getValue());
        $this->provider->claims = [];
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        // A failed account switch preserves the prior session; it is never reported as OIDC success.
        $this->assertAuthenticatedAs($admin, 'web');
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('external_identities')->count());
    }

    public function test_oidc_session_mutation_still_requires_valid_csrf(): void
    {
        $user = $this->linkedUser();
        $this->begin();
        $response = $this->completeCallback();
        $response->assertRedirect();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        $this->withHeader('Origin', 'https://hrm.example.test');
        $xsrf = $response->getCookie('XSRF-TOKEN', false)->getValue();

        $this->freshRequest();
        $this->putJson('https://hrm.example.test/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->freshRequest();
        $this->withHeader('X-XSRF-TOKEN', 'invalid')
            ->putJson('https://hrm.example.test/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->assertSame($user->name, $user->fresh()->name);

        $this->freshRequest();
        $this->withHeader('X-XSRF-TOKEN', $xsrf)
            ->putJson('https://hrm.example.test/api/auth/profile', ['name' => 'Changed'])->assertOk()
            ->assertJsonPath('user.id', $user->id);
        $this->assertSame('Changed', $user->fresh()->name);
        $this->assertSame(0, $user->tokens()->count());
    }

    public static function nonmatchingKeys(): array
    {
        return [
            'issuer case' => ['https://IAM.example.test', 'public-subject'],
            'issuer trailing slash' => [Provider::ISSUER.'/', 'public-subject'],
            'subject case' => [Provider::ISSUER, 'Public-subject'],
            'subject trailing space' => [Provider::ISSUER, 'public-subject '],
        ];
    }

    #[DataProvider('nonmatchingKeys')]
    public function test_identity_keys_are_not_normalized(string $issuer, string $subject): void
    {
        $this->linkedUser([], $issuer, $subject);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
    }

    public function test_exact_subject_with_trailing_space_is_preserved(): void
    {
        $user = $this->linkedUser([], Provider::ISSUER, 'public-subject ');
        $this->provider->claims['sub'] = 'public-subject ';
        $this->begin();
        $this->completeCallback()->assertRedirect();
        $this->assertAuthenticatedAs($user, 'web');
    }

    public static function unavailableUsers(): array
    {
        return ['inactive' => [['is_active' => false]], 'deleted' => [['deleted_at' => '2026-01-01 00:00:00']]];
    }

    #[DataProvider('unavailableUsers')]
    public function test_inactive_or_deleted_linked_user_is_denied(array $attributes): void
    {
        $this->linkedUser($attributes);
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertGuest('web');
    }

    public function test_overlong_subject_is_rejected_without_truncation(): void
    {
        $this->linkedUser([], Provider::ISSUER, str_repeat('a', 255));
        $this->provider->claims['sub'] = str_repeat('a', 256);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
    }

    public function test_multibyte_subject_is_limited_by_bytes_not_character_count(): void
    {
        $this->provider->claims['sub'] = str_repeat('é', 128);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertSame(0, User::count());
    }

    public function test_callback_without_transaction_is_rejected_by_sdk(): void
    {
        $this->completeCallback(['code' => 'PRIVATE-CODE', 'state' => str_repeat('x', 43)])
            ->assertStatus(400)->assertExactJson(['error' => 'invalid_state']);
        $this->assertSame(0, $this->provider->exchanges);
        $this->assertGuest('web');
    }

    public function test_missing_state_and_duplicate_query_are_rejected_by_sdk(): void
    {
        $this->completeCallback(['code' => 'PRIVATE-CODE'])->assertStatus(400)->assertExactJson(['error' => 'invalid_state']);
        $query = $this->begin();
        $this->freshRequest();
        $this->get(Provider::CALLBACK.'?state='.$query['state'].'&state='.$query['state'].'&code=PRIVATE-CODE')
            ->assertStatus(400)->assertExactJson(['error' => 'authorization_error']);
        $this->assertSame(0, $this->provider->exchanges);
    }

    public function test_other_browser_session_cannot_use_transaction(): void
    {
        $this->begin();
        $this->withCookie(config('session.cookie'), str_repeat('b', 40));
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'invalid_state']);
        $this->assertSame(0, $this->provider->exchanges);
    }

    public function test_replayed_callback_is_rejected_by_sdk_even_in_original_session(): void
    {
        $this->linkedUser();
        $this->begin();
        $this->completeCallback()->assertRedirect();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'transaction_replay']);
        $this->assertSame(1, $this->provider->exchanges);
    }

    public static function changedContexts(): array
    {
        return ['client' => ['client_id', 'different-client'], 'callback' => ['redirect_uri', 'https://hrm.example.test/other-callback']];
    }

    #[DataProvider('changedContexts')]
    public function test_changed_transaction_context_is_rejected_before_exchange(string $key, string $value): void
    {
        $this->linkedUser();
        $this->begin();
        config(['doxa.'.$key => $value]);
        $this->completeCallback()->assertStatus(400);
        $this->assertSame(0, $this->provider->exchanges);
        $this->assertGuest('web');
    }

    public static function invalidClaims(): array
    {
        return [
            'nonce' => [['nonce' => 'wrong-nonce'], 'invalid_nonce'],
            'issuer' => [['iss' => 'https://other-iam.example.test'], 'invalid_issuer'],
            'audience' => [['aud' => 'other-client'], 'invalid_audience'],
            'expired token' => [['exp' => 1], 'expired_id_token'],
        ];
    }

    #[DataProvider('invalidClaims')]
    public function test_sdk_id_token_validation_failures_are_safe_and_terminal(array $claims, string $category): void
    {
        $this->linkedUser();
        $this->provider->claims = $claims;
        $this->begin();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => $category]);
        $this->assertGuest('web');
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'transaction_replay']);
        $this->assertSame(1, $this->provider->exchanges);
    }

    public function test_sdk_rejects_invalid_signature(): void
    {
        $this->linkedUser();
        $this->provider->badSignature = true;
        $this->begin();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'invalid_signature']);
        $this->assertGuest('web');
    }

    public function test_pkce_exchange_failure_is_safe_and_cannot_be_retried(): void
    {
        $this->linkedUser();
        $this->provider->rejectPkce = true;
        $this->begin();
        $response = $this->completeCallback();
        $response->assertStatus(400)->assertExactJson(['error' => 'token_exchange_failure']);
        $this->assertStringNotContainsString('PRIVATE', $response->getContent());
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'transaction_replay']);
        $this->assertSame(1, $this->provider->exchanges);
        $this->assertGuest('web');
    }

    public function test_expired_pending_sdk_transaction_is_rejected_before_exchange(): void
    {
        $this->begin();
        $cache = app('cache')->store('oidc-test');
        $key = 'doxa.transaction.'.hash('sha256', $this->provider->authorization['state']);
        $transaction = app('encrypter')->decrypt($cache->get($key));
        // Expire the actual SDK-created pending fixture; no identity or client mock.
        $expired = new AuthorizationTransaction($transaction->state, $transaction->nonce(), $transaction->verifier(),
            $transaction->issuer, $transaction->clientId, $transaction->redirectUri, $transaction->scopes,
            time() - 700, time() - 100, $transaction->browserBinding(), $transaction->provider);
        $cache->put($key, app('encrypter')->encrypt($expired), 60);
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'transaction_expired']);
        $this->assertSame(0, $this->provider->exchanges);
    }

    public function test_provider_access_denial_is_safe_and_terminal(): void
    {
        $query = $this->begin();
        $this->completeCallback(['state' => $query['state'], 'error' => 'access_denied', 'error_description' => 'PRIVATE'])
            ->assertStatus(400)->assertExactJson(['error' => 'user_denied_authorization']);
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'transaction_replay']);
        $this->assertSame(0, $this->provider->exchanges);
    }

    public function test_iam_roles_do_not_grant_local_hr_admin_authorization(): void
    {
        $user = $this->linkedUser(['role' => 'applicant']);
        $this->begin();
        $response = $this->completeCallback();
        $response->assertRedirect();
        $this->assertSame('applicant', $user->fresh()->role);
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        $this->freshRequest();
        $this->withHeader('Origin', 'https://hrm.example.test')->getJson('https://hrm.example.test/api/employees')->assertForbidden();
    }

    public function test_browser_return_target_is_ignored(): void
    {
        $this->linkedUser();
        $this->begin();
        $this->completeCallback(['code' => 'PRIVATE-CODE', 'state' => $this->provider->authorization['state'],
            'return_to' => 'https://attacker.example.test'])->assertRedirect('/dashboard');
    }

    public function test_fixed_server_frontend_origin_is_used(): void
    {
        $this->linkedUser();
        config(['hrm.frontend_url' => 'https://frontend.example.test']);
        $this->begin();
        $this->completeCallback()->assertRedirect('https://frontend.example.test/dashboard');
    }

    public function test_invalid_frontend_configuration_denies_before_local_login(): void
    {
        $this->linkedUser();
        config(['hrm.frontend_url' => 'https://frontend.example.test/?return_to=other']);
        $this->begin();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'configuration_error']);
        $this->assertGuest('web');
    }

    public function test_missing_sdk_configuration_is_a_safe_error_even_with_debug_enabled(): void
    {
        config(['doxa.client_id' => null, 'app.debug' => true]);
        $this->get('https://hrm.example.test/auth/doxa')->assertStatus(400)->assertExactJson(['error' => 'configuration_error'])
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public static function unsafeSessions(): array
    {
        return [
            'insecure cookie' => ['secure', false],
            'JS-readable cookie' => ['http_only', false],
            'browser session storage' => ['driver', 'cookie'],
            'callback-incompatible SameSite' => ['same_site', 'strict'],
        ];
    }

    #[DataProvider('unsafeSessions')]
    public function test_sdk_rejects_unsafe_browser_session_configuration(string $key, mixed $value): void
    {
        config(['session.'.$key => $value]);
        $this->get('https://hrm.example.test/auth/doxa')->assertStatus(400)
            ->assertExactJson(['error' => 'configuration_error']);
        $this->assertGuest('web');
    }

    public function test_discovery_failure_does_not_expose_provider_response(): void
    {
        $this->provider->discoveryFailure = true;
        $response = $this->get('https://hrm.example.test/auth/doxa');
        $response->assertStatus(400);
        $this->assertStringNotContainsString('PRIVATE', $response->getContent());
    }

    public function test_database_failure_is_generic_without_sql_or_identity_details(): void
    {
        $this->begin();
        Schema::drop('external_identities');
        $this->completeCallback()->assertStatus(503)->assertExactJson(['error' => 'authentication_unavailable']);
        $this->assertGuest('web');
    }

    public function test_provisional_mapping_cannot_establish_a_local_session(): void
    {
        $user = $this->linkedUser();
        DB::table('external_identities')->where('user_id', $user->id)->update(['pending_link_id' => str_repeat('a', 64)]);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
    }

    private function enableProvisioning(): void
    {
        config(['hrm.doxa_account_policy' => 'provision', 'hrm.doxa_default_role' => 'applicant']);
        $this->provider->claims = ['email_verified' => true];
    }

    public function test_authorized_first_login_provisions_one_applicant_and_reuses_it(): void
    {
        $this->enableProvisioning();
        $this->begin();
        $first = $this->completeCallback()->assertRedirect('/dashboard');
        $user = User::sole();
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertSame('applicant', $user->role);
        $this->assertNull($user->password);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame(1, DB::table('external_identities')->count());
        $this->assertSame(1, DB::table('audit_logs')->where('action', 'doxa.account.provisioned')->count());
        $before = $user->getAttributes();
        $this->withCookie(config('session.cookie'), $first->getCookie(config('session.cookie'))->getValue());
        $this->provider->claims = ['email_verified' => false, 'email' => 'changed@example.test', 'name' => 'Changed'];
        $this->begin();
        $this->completeCallback()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertSame($before, $user->fresh()->getAttributes());
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('audit_logs')->count());
        $this->assertSame(2, $this->provider->accessChecks);
    }

    public function test_unknown_identity_is_denied_when_policy_is_existing_account_only(): void
    {
        $this->provider->claims = ['email_verified' => true];
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
    }

    public static function diagnosticDenials(): array
    {
        return [[false, 'email_unverified'], [true, 'email_collision']];
    }

    #[DataProvider('diagnosticDenials')]
    public function test_authorized_admin_collision_has_a_safe_local_denial_diagnostic(bool $verified, string $reason): void
    {
        $this->enableProvisioning();
        $this->provider->claims = ['email' => 'admin@doxa.com', 'email_verified' => $verified];
        $admin = User::factory()->create(['email' => 'admin@doxa.com', 'role' => 'hr_admin']);
        $before = $admin->fresh()->getAttributes();
        Log::spy();
        $this->begin();
        $this->completeCallback()->assertForbidden()->assertExactJson(['error' => 'access_denied']);
        $this->assertSame(1, $this->provider->accessChecks);
        Log::shouldHaveReceived('notice')->once()->with('doxa.login.account_denied', [
            'stage' => 'account_resolution', 'reason' => $reason,
            'subject_sha256' => hash('sha256', Provider::ISSUER."\0public-subject"),
        ]);
        Log::shouldNotHaveReceived('error');
        $this->assertGuest('web');
        $this->assertSame($before, $admin->fresh()->getAttributes());
        $this->assertSame(1, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
    }

    public function test_iam_access_denial_is_diagnosed_before_local_account_resolution(): void
    {
        $this->enableProvisioning();
        $this->provider->accessDecision = ['effective' => false];
        Log::spy();
        $this->begin();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'access_denied_or_insufficient_scope']);
        Log::shouldHaveReceived('notice')->once()->with('doxa.login.sdk_denied', [
            'stage' => 'sdk_callback_and_account_resolution', 'category' => 'access_denied_or_insufficient_scope',
            'exception_class' => ApplicationAccessException::class,
        ]);
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
    }

    public static function unsafeProvisioningEmails(): array
    {
        return [[null, null], ['local@example.test', false], ['local@example.test', null], ['invalid', true]];
    }

    #[DataProvider('unsafeProvisioningEmails')]
    public function test_provisioning_requires_a_valid_explicitly_verified_email(?string $email, ?bool $verified): void
    {
        $this->enableProvisioning();
        $this->provider->claims = ['email' => $email, 'email_verified' => $verified];
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
    }

    public function test_email_collision_never_links_or_modifies_the_existing_admin(): void
    {
        $this->enableProvisioning();
        $this->provider->claims = ['email' => 'ADMIN@doxa.com', 'email_verified' => true];
        $admin = User::factory()->create(['email' => 'admin@doxa.com', 'role' => 'hr_admin']);
        $before = $admin->fresh()->getAttributes();
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
        $this->assertSame($before, $admin->fresh()->getAttributes());
        $this->assertSame(1, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
        // The privileged workflow is dry-run by default, requires exact confirmation and audits its write.
        $arguments = ['user' => (string) $admin->id, 'subject' => 'public-subject', '--actor' => (string) $admin->id];
        $this->artisan('doxa:link-existing', $arguments)->assertSuccessful();
        $this->assertSame(0, DB::table('external_identities')->count());
        $this->artisan('doxa:link-existing', [...$arguments, '--apply' => true])->assertFailed();
        $this->assertSame(0, DB::table('external_identities')->count());
        $plan = hash('sha256', json_encode([Provider::ISSUER, 'public-subject', (string) $admin->id, (string) $admin->id], JSON_THROW_ON_ERROR));
        foreach (range(1, 2) as $unused) {
            $this->artisan('doxa:link-existing', [...$arguments, '--apply' => true, '--verified' => true, '--confirm' => $plan])->assertSuccessful();
        }
        $this->assertSame(1, DB::table('audit_logs')->where('action', 'doxa.link.operator_linked')->count());
        // Explicit trusted mappings remain authoritative even when the IAM email
        // would be ineligible for first-login provisioning.
        $this->provider->claims = ['email' => 'ADMIN@doxa.com', 'email_verified' => false];
        foreach (range(1, 2) as $unused) {
            $this->begin();
            $response = $this->completeCallback()->assertRedirect('/dashboard');
            $this->assertAuthenticatedAs($admin, 'web');
            $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        }
        $this->assertSame($before, $admin->fresh()->getAttributes());
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('external_identities')->count());
    }

    public function test_inactive_and_deleted_email_collisions_cannot_provision_replacements(): void
    {
        $this->enableProvisioning();
        $user = User::factory()->create(['email' => 'local@example.test', 'is_active' => false]);
        DB::table('users')->where('id', $user->id)->update(['deleted_at' => now()]);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
        $this->assertSame(1, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
    }

    public function test_unsafe_default_role_configuration_cannot_create_an_administrator(): void
    {
        $this->enableProvisioning();
        config(['hrm.doxa_default_role' => 'hr_admin']);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertSame(0, User::count());
    }

    public function test_provisioning_policy_cannot_bypass_a_disabled_existing_mapping(): void
    {
        $this->enableProvisioning();
        $user = $this->linkedUser(['is_active' => false]);
        $this->begin();
        $this->completeCallback()->assertForbidden();
        $this->assertGuest('web');
        $this->assertFalse($user->fresh()->is_active);
        $this->assertSame(1, User::count());
        $this->assertSame(1, DB::table('external_identities')->count());
        $this->assertSame(0, DB::table('audit_logs')->count());
    }

    public static function deniedApplicationDecisions(): array
    {
        return [[['effective' => false], false], [[], false], [['effective' => true, 'extra' => 1], false], [['effective' => true], true]];
    }

    #[DataProvider('deniedApplicationDecisions')]
    public function test_access_denial_malformed_decisions_and_outages_never_provision(array $decision, bool $unavailable): void
    {
        $this->enableProvisioning();
        $this->provider->accessDecision = $decision;
        $this->provider->accessUnavailable = $unavailable;
        $this->begin();
        $this->completeCallback()->assertStatus(400);
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
    }

    public function test_revoked_access_prevents_future_login_even_with_an_existing_link(): void
    {
        $user = $this->linkedUser(['role' => 'hr_admin']);
        $before = $user->fresh()->getAttributes();
        $this->provider->accessDecision = ['effective' => false];
        $this->begin();
        $this->completeCallback()->assertStatus(400)->assertExactJson(['error' => 'access_denied_or_insufficient_scope']);
        $this->assertGuest('web');
        $this->assertSame($before, $user->fresh()->getAttributes());
    }

    public function test_audit_failure_rolls_back_user_and_mapping_without_a_session(): void
    {
        $this->enableProvisioning();
        Log::spy();
        DB::unprepared("CREATE TRIGGER reject_provision_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'doxa.account.provisioned' BEGIN SELECT RAISE(ABORT, 'Synthetic provisioning failure'); END");
        $this->begin();
        $this->completeCallback()->assertStatus(503)->assertExactJson(['error' => 'authentication_unavailable']);
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
        Log::shouldHaveReceived('error')->once()->with('doxa.login.failed', \Mockery::on(
            fn ($context) => array_keys($context) === ['stage', 'exception_class', 'source', 'line']
                && $context['exception_class'] === QueryException::class
                && $context['stage'] === 'sdk_callback_and_account_resolution'
        ));
    }

    public function test_custom_creator_failure_rolls_back_its_partial_local_user(): void
    {
        $this->enableProvisioning();
        $this->app->instance(DoxaUserProvisioner::class, new class implements DoxaUserProvisioner
        {
            public function create(DoxaIdentity $identity): User
            {
                User::factory()->create();
                throw new \RuntimeException('Synthetic creator failure');
            }
        });
        $this->begin();
        $this->completeCallback()->assertStatus(503);
        $this->assertGuest('web');
        $this->assertSame(0, User::count());
        $this->assertSame(0, DB::table('external_identities')->count());
    }

    public function test_two_first_login_processes_create_one_local_user_mapping_and_audit(): void
    {
        $database = $this->directory.'/concurrent-provision.sqlite';
        DB::statement('VACUUM INTO '.DB::getPdo()->quote($database));
        $workers = [];
        try {
            $start = (string) (microtime(true) + 2);
            foreach (range(1, 2) as $index) {
                $worker = new Process([PHP_BINARY, base_path('tests/Fixtures/provision-first-login-worker.php'),
                    $database, $this->directory.'/worker-'.$index, $start, 'worker-'.$index.'@example.test'], base_path());
                $worker->start();
                $workers[] = $worker;
            }
            $ids = [];
            foreach ($workers as $worker) {
                $worker->wait();
                $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput().$worker->getOutput());
                $ids[] = trim($worker->getOutput());
            }
            $this->assertSame($ids[0], $ids[1]);
            $db = new \PDO('sqlite:'.$database);
            $this->assertSame(1, (int) $db->query('SELECT count(*) FROM users')->fetchColumn());
            $this->assertSame(1, (int) $db->query('SELECT count(*) FROM external_identities')->fetchColumn());
            $this->assertSame(1, (int) $db->query("SELECT count(*) FROM audit_logs WHERE action = 'doxa.account.provisioned'")->fetchColumn());
            $this->assertSame('applicant', $db->query('SELECT role FROM users')->fetchColumn());
            $db = null;
        } finally {
            foreach ($workers as $worker) {
                if ($worker->isRunning()) {
                    $worker->stop();
                }
            }
        }
    }

    public function test_operator_linking_cannot_move_an_identity_or_commit_without_its_audit(): void
    {
        $actor = $this->linkedUser(['role' => 'hr_admin']);
        $target = User::factory()->create(['role' => 'applicant']);
        foreach (['public-subject', 'new-subject'] as $subject) {
            if ($subject === 'new-subject') {
                DB::unprepared("CREATE TRIGGER reject_operator_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'doxa.link.operator_linked' BEGIN SELECT RAISE(ABORT, 'Synthetic operator audit failure'); END");
            }
            $plan = hash('sha256', json_encode([Provider::ISSUER, $subject, (string) $target->id, (string) $actor->id], JSON_THROW_ON_ERROR));
            $this->artisan('doxa:link-existing', ['user' => (string) $target->id, 'subject' => $subject,
                '--actor' => (string) $actor->id, '--apply' => true, '--verified' => true, '--confirm' => $plan])->assertFailed();
            $this->assertSame(0, $target->externalIdentities()->count());
            $this->assertSame(1, DB::table('external_identities')->count());
            $this->assertSame(0, DB::table('audit_logs')->count());
            $this->assertSame('applicant', $target->fresh()->role);
        }
    }
}
