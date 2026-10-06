<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CsrfBoundaryTest extends TestCase
{
    private string $sessionDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        // Exercise real CSRF enforcement instead of Laravel's PHPUnit bypass.
        $this->app->instance('env', 'local');
        $this->sessionDirectory = storage_path('framework/testing/csrf-'.bin2hex(random_bytes(12)));
        (new Filesystem)->makeDirectory($this->sessionDirectory, 0755, true);
        config([
            'session.driver' => 'file',
            'session.files' => $this->sessionDirectory,
            'session.secure' => false,
            'sanctum.stateful' => ['localhost:3000'],
        ]);

        foreach (['2014_10_12_000000_create_users_table.php', '2019_12_14_000001_create_personal_access_tokens_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
        $directory = realpath($this->sessionDirectory);
        if ($directory !== false && dirname($directory) === realpath(storage_path('framework/testing'))) {
            (new Filesystem)->deleteDirectory($directory);
        }

        parent::tearDown();
    }

    private function browserSession(?User $user = null): string
    {
        $response = $this->get('/sanctum/csrf-cookie');
        $response->assertNoContent()->assertCookie('XSRF-TOKEN')->assertCookie(config('session.cookie'));
        $session = $this->app['session.store'];
        if ($user !== null) {
            $session->put(Auth::guard('web')->getName(), $user->id);
            $session->save();
        }
        $this->withCookie(config('session.cookie'), $session->getId());
        $this->withCredentials();
        $this->withHeader('Origin', 'http://localhost:3000');
        $this->app['auth']->forgetGuards();
        // Resume from the cookie/file, not the previous request's in-memory store.
        $this->app['session']->forgetDrivers();
        $this->app->forgetInstance('session.store');

        // Return the real encrypted cookie as used by X-XSRF-TOKEN clients.
        return $response->getCookie('XSRF-TOKEN', false)->getValue();
    }

    public function test_browser_profile_mutation_rejects_missing_csrf_without_changing_user(): void
    {
        $user = User::factory()->create();
        $this->browserSession($user);
        $this->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->assertSame($user->name, $user->fresh()->name);
    }

    public function test_browser_profile_mutation_rejects_invalid_csrf(): void
    {
        $user = User::factory()->create();
        $this->browserSession($user);
        $this->withHeader('X-CSRF-TOKEN', 'arbitrary-token')
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->assertSame($user->name, $user->fresh()->name);
    }

    public function test_browser_profile_mutation_accepts_real_xsrf_cookie_header(): void
    {
        $user = User::factory()->create();
        $xsrf = $this->browserSession($user);
        $this->withHeader('X-XSRF-TOKEN', $xsrf)
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertOk()->assertJsonPath('user.id', $user->id);
        $this->assertSame('Changed', $user->fresh()->name);
    }

    public function test_browser_mutation_rejects_malformed_encrypted_xsrf_header(): void
    {
        $user = User::factory()->create();
        $this->browserSession($user);
        $this->withHeader('X-XSRF-TOKEN', 'not-an-encrypted-token')
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
    }

    public function test_csrf_token_from_another_session_is_rejected(): void
    {
        $other = new \Illuminate\Session\Store('other', new \Illuminate\Session\ArraySessionHandler(120));
        $other->start();
        $this->browserSession(User::factory()->create());
        $this->withHeader('X-CSRF-TOKEN', $other->token())
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
    }

    public function test_browser_me_remains_authenticated_without_csrf_on_get(): void
    {
        $user = User::factory()->create();
        $this->browserSession($user);
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('id', $user->id);
    }

    public function test_browser_logout_requires_csrf_and_valid_token_still_logs_out(): void
    {
        $xsrf = $this->browserSession(User::factory()->create());
        $this->postJson('/api/auth/logout')->assertStatus(419);
        $this->app['auth']->forgetGuards();
        $this->withHeader('X-XSRF-TOKEN', $xsrf)->postJson('/api/auth/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_browser_password_change_requires_csrf(): void
    {
        $user = User::factory()->create();
        $this->browserSession($user);
        $this->putJson('/api/auth/password', [
            'current_password' => 'password', 'password' => 'new-password', 'password_confirmation' => 'new-password',
        ])->assertStatus(419);
        $this->assertSame($user->password, $user->fresh()->password);
    }

    public function test_business_post_put_and_delete_are_protected_before_controller_execution(): void
    {
        $this->browserSession(User::factory()->create(['role' => 'hr_admin']));
        foreach ([['POST', '/api/employees'], ['PUT', '/api/payroll/items/1'], ['DELETE', '/api/job-postings/1']] as [$method, $uri]) {
            $this->app['auth']->forgetGuards();
            $this->json($method, $uri)->assertStatus(419);
        }
    }

    public function test_valid_bearer_header_does_not_bypass_authenticated_session_csrf(): void
    {
        $browser = User::factory()->create();
        $bearer = User::factory()->create();
        $token = $bearer->createToken('machine')->plainTextToken;
        $xsrf = $this->browserSession($browser);
        $this->withToken($token)->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->app['auth']->forgetGuards();
        $this->withHeader('X-XSRF-TOKEN', $xsrf)
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertOk()->assertJsonPath('user.id', $browser->id);
        $this->assertSame($bearer->name, $bearer->fresh()->name);
    }

    public function test_invalid_bearer_header_does_not_bypass_browser_csrf(): void
    {
        $this->browserSession(User::factory()->create());
        $this->withToken('invalid-token')->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
    }

    public function test_anonymous_session_cookie_with_bearer_still_requires_csrf(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('machine')->plainTextToken;
        $xsrf = $this->browserSession();
        $this->withToken($token)->putJson('/api/auth/profile', ['name' => 'Changed'])->assertStatus(419);
        $this->app['auth']->forgetGuards();
        $this->withHeader('X-XSRF-TOKEN', $xsrf)
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_session_cookie_without_stateful_origin_does_not_authenticate_api(): void
    {
        $this->browserSession(User::factory()->create());
        $this->flushHeaders()->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_bearer_profile_mutation_without_origin_needs_no_csrf(): void
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('machine')->plainTextToken)
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_cookieless_bearer_frontend_with_stateful_origin_needs_no_csrf(): void
    {
        $user = User::factory()->create();
        $this->withHeader('Origin', 'http://localhost:3000')->withToken($user->createToken('frontend')->plainTextToken)
            ->putJson('/api/auth/profile', ['name' => 'Changed'])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_bearer_logout_still_revokes_token_without_csrf(): void
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('machine')->plainTextToken)->postJson('/api/auth/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_anonymous_cookie_session_public_mutations_require_csrf(): void
    {
        $xsrf = $this->browserSession();
        foreach (['/api/auth/login', '/api/auth/register', '/api/applications'] as $uri) {
            $this->postJson($uri)->assertStatus(419);
        }
        // Valid CSRF reaches ordinary public validation, without authentication.
        $this->withHeader('X-XSRF-TOKEN', $xsrf)->postJson('/api/applications')->assertUnprocessable();
    }

    public function test_public_cookieless_post_requests_remain_public_with_stateful_origin(): void
    {
        $this->withHeader('Origin', 'http://localhost:3000');
        foreach (['/api/auth/login', '/api/auth/register', '/api/applications'] as $uri) {
            $this->postJson($uri)->assertUnprocessable();
        }
    }

    public function test_cookieless_password_login_still_returns_bearer_token(): void
    {
        $user = User::factory()->create();
        $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->assertOk()->assertJsonPath('user.id', $user->id)->assertJsonStructure(['token']);
    }

    public function test_cookieless_public_registration_still_creates_user_and_token(): void
    {
        $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/auth/register', [
            'name' => 'Public Applicant', 'email' => 'public@example.test',
            'password' => 'public-password', 'password_confirmation' => 'public-password',
        ])->assertCreated()->assertJsonPath('user.role', 'applicant')->assertJsonStructure(['token']);
    }

    public function test_protected_api_without_credentials_still_rejects_as_unauthorized(): void
    {
        $this->putJson('/api/auth/profile', ['name' => 'Changed'])->assertUnauthorized();
    }
}
