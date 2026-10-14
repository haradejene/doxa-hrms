<?php

namespace Tests\Feature;

use App\Models\User;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Transaction\AuthorizationTransaction;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
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
            'sanctum.stateful' => ['hrm.example.test'],
        ]);
        foreach (['2014_10_12_000000_create_users_table.php', '2019_12_14_000001_create_personal_access_tokens_table.php',
            '2026_09_15_000000_create_external_identities_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        $this->provider = new Provider;
        $this->app->instance(Transport::class, $this->provider);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('external_identities');
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
}
