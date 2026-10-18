<?php

namespace Tests\Feature;

use App\Auth\DoxaLinkClient;
use App\Auth\DoxaLinkHost;
use App\Models\DoxaLinkTransaction;
use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Contracts\CredentialHostBinding;
use Doxa\Laravel\Contracts\CredentialStore;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Credentials\CredentialSchema;
use Doxa\Laravel\Credentials\DatabaseCredentialStore;
use Doxa\Laravel\Credentials\LaravelCredentialCipher;
use Doxa\Laravel\Exceptions\CredentialException;
use GuzzleHttp\Promise\Create;
use GuzzleHttp\Psr7\Response;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\Process\Process;
use Tests\Fixtures\DoxaCredentialAckConnection;
use Tests\Fixtures\DoxaLinkFaultHost;
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

    private ?int $accessStatus = null;

    private ?string $accessBody = null;

    private int $accessChecks = 0;

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
        (new Filesystem)->ensureDirectoryExists($this->directory);
        touch($this->directory.'/credentials.sqlite');
        config(['database.connections.link-credentials' => ['driver' => 'sqlite', 'database' => $this->directory.'/credentials.sqlite', 'prefix' => ''],
            'doxa.credentials.enabled' => true, 'doxa.credentials.connection' => 'link-credentials',
            'doxa.credentials.key' => str_repeat('k', 32), 'doxa.credentials.key_id' => 'test']);
        CredentialSchema::create(DB::connection('link-credentials')->getSchemaBuilder(), 'doxa_credential_contexts');
        foreach (['2014_10_12_000000_create_users_table.php', '2026_09_15_000000_create_external_identities_table.php',
            '2026_07_01_045079_create_audit_logs_table.php', '2026_10_08_000000_create_doxa_link_transactions_table.php', '2026_10_17_000000_complete_doxa_link_protocol.php'] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->softDeletes();
            $table->timestamps();
        });
        $this->admin = User::factory()->create(['role' => 'hr_admin', 'is_active' => true]);
        $this->target = User::factory()->create();
        $this->employee = Employee::create(['user_id' => $this->target->id, 'first_name' => 'Local', 'last_name' => 'Employee']);
        $this->provider = new OidcProviderTransport;
        $this->provider->callback = config('hrm.doxa_link_redirect_uri');
        $this->app->instance(Transport::class, $this->provider);
        $this->app->bind(CredentialStore::class, fn () => new DatabaseCredentialStore(DB::connection('link-credentials'),
            new LaravelCredentialCipher(str_repeat('k', 32), 'test'), 'doxa_credential_contexts', 3600,
            function () {
                $this->accessChecks++;

                return Create::promiseFor(new Response($this->accessStatus ?? ($this->allowed ? 200 : 403), ['Content-Type' => 'application/json'], $this->accessBody ?? ($this->allowed ? '{"effective":true}' : '{}')));
            }));
        $this->actingAs($this->admin, 'web')->withSession(['link-test' => true]);
    }

    protected function tearDown(): void
    {
        foreach (['doxa_link_transactions', 'audit_logs', 'external_identities', 'employees', 'users'] as $table) {
            Schema::dropIfExists($table);
        }
        $this->app->forgetInstance(CredentialStore::class);
        DB::purge('link-credentials');
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
            ->assertRedirect('/employees/doxa-link/'.$transaction->id)
            ->assertHeader('Location', '/employees/doxa-link/'.$transaction->id);
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
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertOk();
        $this->assertSame(1, ExternalIdentity::count());
        $audit = json_encode(DB::table('audit_logs')->get());
        foreach (['PRIVATE-CODE', 'PRIVATE-ACCESS', 'PRIVATE-REFRESH', $this->provider->idToken, $this->provider->authorization['nonce']] as $secret) {
            $this->assertStringNotContainsString($secret, $audit);
        }
    }

    public function test_callback_error_redirect_stays_on_the_public_browser_origin(): void
    {
        $this->get('https://hrm.example.test/auth/doxa/link/callback')
            ->assertRedirect('/employees/doxa-link/error')
            ->assertHeader('Location', '/employees/doxa-link/error');
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
            if ($case === 'linked') {
                $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'different']);
            }
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
            if ($case === 'expired') {
                $transaction->expires_at = now()->subSecond();
            }
            if ($case === 'binding') {
                $transaction->session_binding = str_repeat('0', 64);
            }
            $transaction->save();
            if ($case === 'relationship') {
                $this->employee->update(['user_id' => $this->admin->id]);
            }
            if ($case === 'inactive') {
                $this->target->update(['is_active' => false]);
            }
            if ($case === 'deleted') {
                DB::table('users')->where('id', $this->target->id)->update(['deleted_at' => now()]);
            }
            if ($case === 'admin') {
                $this->admin->update(['role' => 'applicant']);
            }
            if ($case === 'access') {
                $this->allowed = false;
            }
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

    public function test_confirmation_denied_application_access_creates_no_mapping(): void
    {
        $transaction = $this->verified();
        $this->allowed = false;
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertStatus(409);
        $this->assertSame(0, ExternalIdentity::count());
        $this->assertSame('aborting', $transaction->fresh()->status);
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
            'status' => 'verified', 'consumed_at' => null, 'attempt' => null])->save();
        $this->postJson('/auth/doxa/link/'.$competing->id.'/confirm')->assertStatus(409)->assertJsonPath('error', 'identity_conflict');
        $this->assertSame(1, ExternalIdentity::count());
        $this->assertSame($this->target->id, ExternalIdentity::first()->user_id);
    }

    public function test_database_prevents_a_second_identity_for_the_same_local_account_and_issuer(): void
    {
        $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'one']);
        $this->expectException(QueryException::class);
        $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'two']);
    }

    public function test_callback_replay_and_invalid_state_cannot_create_mapping(): void
    {
        $transaction = $this->verified();
        $this->getJson('https://hrm.example.test/auth/doxa/link/callback?'.http_build_query(['state' => $this->provider->authorization['state'], 'code' => 'PRIVATE-CODE']))
            ->assertStatus(409)->assertJsonPath('error', 'oidc_validation_failed');
        $this->postJson('/auth/doxa/link/'.$transaction->id.'/confirm')->assertOk();
        $this->assertSame(1, ExternalIdentity::count());
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
            ->assertStatus(409)->assertJsonPath('error', 'oidc_validation_failed');
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

    private function faultHost(): DoxaLinkFaultHost
    {
        $host = new DoxaLinkFaultHost;
        $this->app->instance(DoxaLinkHost::class, $host);
        $this->app->bind(CredentialHostBinding::class, fn () => $host);

        return $host;
    }

    public function test_host_commit_acknowledgement_loss_recovers_read_only(): void
    {
        $row = $this->verified();
        $host = $this->faultHost();
        $host->loseCommitAck = true;
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $this->assertSame('completed', $row->fresh()->status);
        $this->assertSame(1, DB::table('audit_logs')->where('action', 'doxa.link.mapping_committed')->count());
        $this->assertSame(1, ExternalIdentity::count());
    }

    public function test_sdk_promotion_acknowledgement_loss_reconciles_exact_activation(): void
    {
        $row = $this->verified();
        $connection = DB::connection('link-credentials');
        $fault = (object) ['thrown' => false];
        $db = new DoxaCredentialAckConnection($connection->getPdo(), $connection->getDatabaseName(), '', $connection->getConfig());
        $db->fault = $fault;
        $this->app->bind(CredentialStore::class, fn () => new DatabaseCredentialStore($db,
            new LaravelCredentialCipher(str_repeat('k', 32), 'test'), 'doxa_credential_contexts', 3600,
            fn () => Create::promiseFor(new Response(200, ['Content-Type' => 'application/json'], '{"effective":true}'))));
        $this->app->forgetScopedInstances();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $this->assertTrue($fault->thrown);
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $this->assertSame(1, ExternalIdentity::count());
    }

    public function test_mapping_and_audit_roll_back_together_and_attempt_is_consumed(): void
    {
        $row = $this->verified();
        DB::unprepared("CREATE TRIGGER reject_mapping_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'doxa.link.mapping_committed' BEGIN SELECT RAISE(ABORT, 'Synthetic audit outage'); END");
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
        $this->assertSame(0, ExternalIdentity::count());
        $this->assertSame(0, DB::table('audit_logs')->where('action', 'doxa.link.mapping_committed')->count());
        $this->assertSame('aborting', $row->fresh()->status);
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
    }

    public function test_lost_release_receipt_leaves_provisional_mapping_and_durable_recovery(): void
    {
        $row = $this->verified();
        DB::unprepared("CREATE TRIGGER reject_release_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'doxa.link.succeeded' BEGIN SELECT RAISE(ABORT, 'Synthetic receipt outage'); END");
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
        $row = $row->fresh();
        $this->assertSame('committed', $row->status);
        $this->assertSame($row->id, ExternalIdentity::first()->pending_link_id);
        $this->assertStringNotContainsString('.', $row->credential_reference);
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(202);
        $row->reconcile_after = now()->subSecond();
        $row->save();
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->assertSame(0, ExternalIdentity::count());
        $this->assertSame('failed', $row->fresh()->status);
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
    }

    public function test_recovery_never_removes_an_existing_valid_mapping(): void
    {
        $row = $this->verified();
        $existing = $this->target->externalIdentities()->create(['issuer' => OidcProviderTransport::ISSUER, 'subject' => 'public-subject']);
        DB::unprepared("CREATE TRIGGER reject_release_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'doxa.link.succeeded' BEGIN SELECT RAISE(ABORT, 'Synthetic receipt outage'); END");
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
        $row = $row->fresh();
        $row->reconcile_after = now()->subSecond();
        $row->save();
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->assertNotNull($existing->fresh());
        $this->assertNull($existing->fresh()->pending_link_id);
    }

    public function test_finalized_mapping_survives_recovery_and_stale_receipts_reject_changed_mapping(): void
    {
        $row = $this->verified();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $row = $row->fresh();
        $row->reconcile_after = now()->subSecond();
        $row->save();
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->assertSame(1, ExternalIdentity::count());
        ExternalIdentity::query()->delete();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
    }

    public function test_substituted_client_subject_and_issuer_are_rejected(): void
    {
        foreach (['client', 'subject', 'issuer'] as $field) {
            $row = $this->verified();
            if ($field === 'client') {
                $row->client_id = 'wrong-client';
            } else {
                $identity = $row->identity;
                $identity[$field] = 'wrong';
                $row->identity = $identity;
            }
            $row->save();
            $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
            $this->assertSame(0, ExternalIdentity::count());
            DoxaLinkTransaction::query()->delete();
        }
    }

    public function test_duplicate_confirmers_cannot_abort_the_winning_attempt(): void
    {
        $row = $this->verified();
        $host = $this->faultHost();
        $host->afterCommit = function () use ($row) {
            $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(202);
        };
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $this->assertSame(1, ExternalIdentity::count());
        $this->assertSame('completed', $row->fresh()->status);
    }

    public function test_completed_context_does_not_grant_target_access_to_initiating_admin(): void
    {
        $row = $this->verified();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk();
        $this->expectException(CredentialException::class);
        app(DoxaLinkClient::class)->client()->restoreCredentialContext($row->fresh()->credential_reference);
    }

    public function test_inactive_and_wrong_admin_sessions_cannot_confirm(): void
    {
        $row = $this->verified();
        $other = User::factory()->create(['role' => 'hr_admin']);
        $this->actingAs($other, 'web')->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
        $this->actingAs($this->admin, 'web');
        $this->admin->update(['is_active' => false]);
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertForbidden();
        $this->assertSame(0, ExternalIdentity::count());
    }

    public function test_confirm_and_cancel_require_csrf(): void
    {
        $row = $this->verified();
        $this->app->instance('env', 'local');
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(419);
        $this->postJson('/auth/doxa/link/'.$row->id.'/cancel')->assertStatus(419);
        $this->assertSame('verified', $row->fresh()->status);
    }

    public function test_recovery_retries_after_store_outage_and_cleans_cancelled_context(): void
    {
        $row = $this->verified();
        $this->postJson('/auth/doxa/link/'.$row->id.'/cancel')->assertOk();
        $store = \Mockery::mock(CredentialStore::class);
        $store->shouldReceive('metadata')->andThrow(new \RuntimeException('Synthetic store outage'));
        $this->app->instance(CredentialStore::class, $store);
        $this->artisan('doxa:reconcile-links')->assertFailed();
        $this->assertSame('aborting', $row->fresh()->status);
        $this->assertNotNull($row->fresh()->reconcile_after);
        $this->app->forgetInstance(CredentialStore::class);
        $this->app->bind(CredentialStore::class, fn () => new DatabaseCredentialStore(DB::connection('link-credentials'), new LaravelCredentialCipher(str_repeat('k', 32), 'test')));
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->assertSame('failed', $row->fresh()->status);
        $this->assertNull($row->fresh()->credential_reference);
    }

    public function test_missing_false_malformed_and_unavailable_access_never_link(): void
    {
        foreach ([[200, '{}'], [200, '{"effective":false}'], [200, '{"effective":true,"extra":1}'], [500, '{}']] as [$status, $body]) {
            $row = $this->verified();
            $this->accessStatus = $status;
            $this->accessBody = $body;
            $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409);
            $this->assertSame(0, ExternalIdentity::count());
            $this->assertNotSame('completed', $row->fresh()->status);
            DoxaLinkTransaction::query()->delete();
        }
    }

    public function test_confirmation_checks_access_once_and_receipt_replay_does_not_check_again(): void
    {
        $row = $this->verified();
        $this->assertSame(0, $this->accessChecks);
        $receipt = $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk()->json();
        $mapping = ExternalIdentity::firstOrFail()->getAttributes();
        $audits = DB::table('audit_logs')->count();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertOk()->assertExactJson($receipt);
        $this->assertSame(1, ExternalIdentity::count());
        $this->assertSame($mapping, ExternalIdentity::firstOrFail()->getAttributes());
        $this->assertSame($audits, DB::table('audit_logs')->count());
        foreach (['doxa.link.mapping_committed', 'doxa.link.succeeded'] as $action) {
            $this->assertSame(1, DB::table('audit_logs')->where('action', $action)->count());
        }
        $this->assertSame(['destination', 'status'], collect(array_keys($receipt))->sort()->values()->all());
        $this->assertSame(1, $this->accessChecks);
        $this->travel(6)->minutes();
        $this->postJson('/auth/doxa/link/'.$row->id.'/confirm')->assertStatus(409)->assertJsonPath('error', 'transaction_expired');
        $this->artisan('doxa:reconcile-links')->assertSuccessful();
        $this->assertSame($mapping, ExternalIdentity::firstOrFail()->getAttributes());
        $this->assertSame('completed', $row->fresh()->status);
        $this->assertSame(1, DB::table('audit_logs')->where('action', 'doxa.link.succeeded')->count());
    }

    public function test_independent_process_confirmers_preserve_one_winning_mapping(): void
    {
        $row = $this->verified();
        $database = $this->directory.'/host-concurrency.sqlite';
        DB::statement('VACUUM INTO '.DB::getPdo()->quote($database));
        $workers = [];
        $start = (string) (microtime(true) + 1);
        try {
            foreach (range(1, 2) as $unused) {
                $worker = new Process([PHP_BINARY, base_path('tests/Fixtures/confirm-link-worker.php'),
                    $database, $row->id, (string) $this->admin->id, $start, $this->directory.'/credentials.sqlite',
                    $this->app['request']->session()->getId(), $this->directory], base_path());
                $worker->start();
                $workers[] = $worker;
            }
            $statuses = [];
            foreach ($workers as $worker) {
                $worker->wait();
                $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput());
                $statuses[] = trim($worker->getOutput());
            }
            $this->assertContains('200', $statuses);
            foreach ($statuses as $status) {
                $this->assertContains($status, ['200', '202', '409']);
            }
            $db = new \PDO('sqlite:'.$database);
            $this->assertSame(1, (int) $db->query('SELECT count(*) FROM external_identities WHERE pending_link_id IS NULL')->fetchColumn());
            $this->assertSame(1, (int) $db->query("SELECT count(*) FROM audit_logs WHERE action = 'doxa.link.succeeded'")->fetchColumn());
            $db = null;
        } finally {
            foreach ($workers as $worker) {
                if ($worker->isRunning()) {
                    $worker->stop();
                }
            }
        }
    }
}
