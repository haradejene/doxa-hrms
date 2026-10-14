<?php

namespace Tests\Feature;

use App\Auth\DoxaApplicationAccess;
use App\Models\DoxaLinkTransaction;
use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Contracts\Transport;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Fixtures\OidcProviderTransport;
use Tests\TestCase;

class DoxaLinkTest extends TestCase
{
    private User $admin;
    private User $target;
    private Employee $employee;
    private OidcProviderTransport $provider;
    private string $directory;
    private bool $allowed = true;

    protected function setUp(): void
    {
        parent::setUp();
        $this->directory = storage_path('framework/testing/link-'.bin2hex(random_bytes(8)));
        config(['session.secure' => true, 'session.http_only' => true, 'session.same_site' => 'lax',
            'cache.stores.link-test' => ['driver' => 'file', 'path' => $this->directory],
            'doxa.cache_store' => 'link-test', 'doxa.issuer' => OidcProviderTransport::ISSUER,
            'doxa.client_id' => OidcProviderTransport::CLIENT, 'doxa.client_secret' => null,
            'doxa.redirect_uri' => OidcProviderTransport::CALLBACK,
            'hrm.doxa_link_redirect_uri' => 'https://hrm.example.test/auth/doxa/link/callback']);
        foreach (['2014_10_12_000000_create_users_table.php', '2026_09_15_000000_create_external_identities_table.php',
            '2026_07_01_045079_create_audit_logs_table.php', '2026_10_08_000000_create_doxa_link_transactions_table.php'] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        Schema::create('employees', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('user_id')->nullable();
            $table->string('first_name'); $table->string('last_name'); $table->softDeletes(); $table->timestamps();
        });
        $this->admin = User::factory()->create(['role' => 'hr_admin', 'is_active' => true]);
        $this->target = User::factory()->create();
        $this->employee = Employee::create(['user_id' => $this->target->id, 'first_name' => 'Local', 'last_name' => 'Employee']);
        $this->provider = new OidcProviderTransport;
        $this->provider->callback = config('hrm.doxa_link_redirect_uri');
        $this->app->instance(Transport::class, $this->provider);
        $access = \Mockery::mock(DoxaApplicationAccess::class);
        $access->shouldReceive('allowed')->andReturnUsing(fn () => $this->allowed);
        $this->app->instance(DoxaApplicationAccess::class, $access);
        $this->actingAs($this->admin, 'web')->withSession(['link-test' => true]);
    }

    protected function tearDown(): void
    {
        foreach (['doxa_link_transactions', 'audit_logs', 'external_identities', 'employees', 'users'] as $table) {
            Schema::dropIfExists($table);
        }
        if (str_starts_with($this->directory, storage_path('framework/testing/link-'))) {
            (new Filesystem)->deleteDirectory($this->directory);
        }
        parent::tearDown();
    }

    private function begin(): DoxaLinkTransaction
    {
        $response = $this->postJson('/auth/doxa/employees/'.$this->employee->id.'/link');
        $response->assertOk();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue())->withCredentials();
        parse_str(parse_url($response->json('authorization_url'), PHP_URL_QUERY), $query);
        $this->assertSame('login', $query['prompt']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertSame(config('hrm.doxa_link_redirect_uri'), $query['redirect_uri']);
        $this->provider->authorization = $query;
        return DoxaLinkTransaction::firstOrFail();
    }

    private function verified(): DoxaLinkTransaction
    {
        $transaction = $this->begin();
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertRedirect('/employees/doxa-link/'.$transaction->id);
        $this->assertSame(0, ExternalIdentity::count());
        return $transaction->fresh();
    }

    public function test_verified_identity_requires_confirmation_and_exact_mapping_is_audited_without_secrets(): void
    {
        $transaction = $this->verified();
        $this->getJson('/auth/doxa/link/'.$transaction->id)->assertOk()
            ->assertJsonPath('employee_name', 'Local Employee')->assertJsonPath('identity.subject', 'public-subject');
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertOk();
        $this->assertDatabaseHas('external_identities', ['user_id' => $this->target->id, 'issuer' => OidcProviderTransport::ISSUER, 'subject' => 'public-subject']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'doxa.link.succeeded', 'user_id' => $this->admin->id, 'subject_id' => (string) $this->target->id]);
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertStatus(409);
        $this->assertSame(1, ExternalIdentity::count());
        $audit = json_encode(DB::table('audit_logs')->get());
        foreach (['PRIVATE-CODE', 'PRIVATE-ACCESS', 'PRIVATE-REFRESH', $this->provider->idToken, $this->provider->authorization['nonce']] as $secret) {
            $this->assertStringNotContainsString($secret, $audit);
        }
    }

    public function test_non_admin_cannot_initiate(): void
    {
        $this->actingAs($this->target)->postJson('/auth/doxa/employees/'.$this->employee->id.'/link')->assertForbidden();
        $this->assertSame(0, DoxaLinkTransaction::count());
    }

    public function test_inactive_deleted_missing_and_already_linked_targets_are_rejected(): void
    {
        foreach (['inactive', 'deleted', 'missing', 'linked'] as $case) {
            $this->target->update(['is_active' => $case !== 'inactive']);
            DB::table('users')->where('id', $this->target->id)->update(['deleted_at' => $case === 'deleted' ? now() : null]);
            $this->employee->update(['user_id' => $case === 'missing' ? null : $this->target->id]);
            if ($case === 'linked') $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'different']);
            $this->postJson('/auth/doxa/employees/'.$this->employee->id.'/link')->assertStatus(409);
        }
        $this->assertSame(0, DoxaLinkTransaction::count());
    }

    public function test_browser_submitted_target_identity_email_and_destination_are_rejected(): void
    {
        foreach (['user_id', 'issuer', 'subject', 'email', 'return_url'] as $field) {
            $transaction = $this->verified();
            $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm', [$field => 'altered'])
                ->assertStatus(409)->assertJsonPath('error', 'unexpected_input');
            DoxaLinkTransaction::query()->delete();
        }
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_confirmation_rechecks_expiration_binding_target_relationship_activity_and_admin(): void
    {
        foreach (['expired', 'binding', 'relationship', 'inactive', 'deleted', 'admin', 'access'] as $case) {
            $this->allowed = true;
            $this->admin->update(['role' => 'hr_admin']);
            $this->target->update(['is_active' => true]);
            DB::table('users')->where('id', $this->target->id)->update(['deleted_at' => null]);
            $this->employee->update(['user_id' => $this->target->id]);
            $transaction = $this->verified();
            if ($case === 'expired') $transaction->expires_at = now()->subSecond();
            if ($case === 'binding') $transaction->session_binding = str_repeat('0', 64);
            $transaction->save();
            if ($case === 'relationship') $this->employee->update(['user_id' => $this->admin->id]);
            if ($case === 'inactive') $this->target->update(['is_active' => false]);
            if ($case === 'deleted') DB::table('users')->where('id', $this->target->id)->update(['deleted_at' => now()]);
            if ($case === 'admin') $this->admin->update(['role' => 'applicant']);
            if ($case === 'access') $this->allowed = false;
            $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertStatus($case === 'admin' ? 403 : 409);
            DoxaLinkTransaction::query()->delete();
        }
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_cancel_consumes_transaction_without_mapping(): void
    {
        $transaction = $this->verified();
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/cancel')->assertOk();
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertStatus(409);
        $this->assertSame(0, ExternalIdentity::count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'doxa.link.cancelled']);
    }

    public function test_existing_identity_elsewhere_is_rejected_at_callback(): void
    {
        $this->admin->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'public-subject']);
        $this->begin();
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'identity_conflict');
        $this->assertSame($this->admin->id, ExternalIdentity::first()->user_id);
    }

    public function test_callback_denied_application_access_creates_no_mapping(): void
    {
        $this->allowed = false;
        $this->begin();
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'application_access_denied');
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_same_user_duplicate_is_idempotent_but_competing_user_cannot_move_identity(): void
    {
        $transaction = $this->verified();
        $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'public-subject']);
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertOk();
        $other = User::factory()->create();
        $otherEmployee = Employee::create(['user_id' => $other->id, 'first_name' => 'Other', 'last_name' => 'User']);
        $competing = new DoxaLinkTransaction;
        $competing->forceFill([...$transaction->fresh()->getAttributes(), 'id' => bin2hex(random_bytes(32)),
            'identity' => $transaction->fresh()->identity,
            'employee_id' => $otherEmployee->id, 'target_user_id' => $other->id, 'oauth_state_hash' => null,
            'status' => 'verified', 'consumed_at' => null])->save();
        $this->postJson('/auth/doxa/link/'.$competing->id.'/confirm')->assertStatus(409)->assertJsonPath('error', 'identity_conflict');
        $this->assertSame(1, ExternalIdentity::count());
        $this->assertSame($this->target->id, ExternalIdentity::first()->user_id);
    }

    public function test_parallel_confirmations_cannot_duplicate_or_move_identity(): void
    {
        foreach (['same_transaction', 'different_users'] as $case) {
            ExternalIdentity::query()->delete();
            DoxaLinkTransaction::query()->delete();
            $first = $this->verified();
            $first->session_binding = hash('sha256', str_repeat('a', 40));
            $first->save();
            $second = $first;
            if ($case === 'different_users') {
                $other = User::factory()->create();
                $employee = Employee::create(['user_id' => $other->id, 'first_name' => 'Other', 'last_name' => 'User']);
                $second = new DoxaLinkTransaction;
                $second->forceFill([...$first->getAttributes(), 'id' => bin2hex(random_bytes(32)),
                    'identity' => $first->identity, 'oauth_state_hash' => null,
                    'target_user_id' => $other->id, 'employee_id' => $employee->id])->save();
            }
            (new Filesystem)->ensureDirectoryExists($this->directory);
            $database = $this->directory.'/concurrency.sqlite';
            DB::statement('VACUUM INTO '.DB::getPdo()->quote($database));
            $start = (string) (microtime(true) + 1);
            $workers = [];
            foreach ([$first, $second] as $transaction) {
                $worker = new \Symfony\Component\Process\Process([PHP_BINARY, base_path('tests/Fixtures/confirm-link-worker.php'), $database, $transaction->id, (string) $this->admin->id, $start], base_path());
                $worker->start();
                $workers[] = $worker;
            }
            $statuses = [];
            foreach ($workers as $worker) {
                $worker->wait();
                $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput());
                $statuses[] = trim($worker->getOutput());
            }
            sort($statuses);
            $this->assertSame(['200', '409'], $statuses);
            $databaseConnection = new \PDO('sqlite:'.$database);
            $links = $databaseConnection->query('SELECT user_id FROM external_identities')->fetchAll(\PDO::FETCH_COLUMN);
            $this->assertCount(1, $links);
            $this->assertContains((int) $links[0], [$first->target_user_id, $second->target_user_id]);
            $databaseConnection = null;
            (new Filesystem)->delete($database);
        }
    }

    public function test_callback_replay_and_invalid_state_cannot_create_mapping(): void
    {
        $transaction = $this->verified();
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'oidc_validation_failed');
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertStatus(409);
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_browser_session_mutations_require_csrf(): void
    {
        $this->app->instance('env', 'local');
        $this->postJson('/auth/doxa/employees/'.$this->employee->id.'/link')->assertStatus(419);
        $this->assertSame(0, DoxaLinkTransaction::count());
    }

    public function test_email_matching_another_user_never_changes_the_selected_target(): void
    {
        $matching = User::factory()->create(['email' => 'local@example.test']);
        $transaction = $this->verified();
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertOk();
        $this->assertSame($this->target->id, ExternalIdentity::first()->user_id);
        $this->assertSame(0, $matching->externalIdentities()->count());
    }

    public function test_initiation_rejects_separately_supplied_user_id(): void
    {
        $this->postJson('/auth/doxa/employees/'.$this->employee->id.'/link', ['user_id' => $this->admin->id])
            ->assertStatus(409)->assertJsonPath('error', 'unexpected_input');
        $this->assertSame(0, DoxaLinkTransaction::count());
    }

    public function test_callback_rejects_expired_linking_transaction(): void
    {
        $transaction = $this->begin();
        $transaction->expires_at = now()->subSecond();
        $transaction->save();
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'transaction_expired');
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_callback_rejects_different_browser_before_code_exchange(): void
    {
        $this->begin();
        $this->withCookie(config('session.cookie'), str_repeat('b', 40));
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'oidc_validation_failed');
        $this->assertSame(0, $this->provider->exchanges);
        $this->assertSame(0, ExternalIdentity::count());
        $this->assertSame('pending', DoxaLinkTransaction::first()->status);
    }

    public function test_link_callback_cannot_consume_an_ordinary_login_transaction(): void
    {
        $response = $this->get('https://hrm.example.test/auth/doxa');
        $response->assertRedirect();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue())->withCredentials();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->provider->authorization = $query;
        $this->app->forgetScopedInstances();
        $this->app->instance(Transport::class, $this->provider);
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $query['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'oidc_validation_failed');
        $this->assertSame(0, $this->provider->exchanges);
        $this->assertSame(0, ExternalIdentity::count());
    }
}



