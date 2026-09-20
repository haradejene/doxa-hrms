<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class FederationPreparationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            '2014_10_12_000000_create_users_table.php',
            '2019_12_14_000001_create_personal_access_tokens_table.php',
            '2026_07_01_045058_create_employees_table.php',
            '2026_07_01_045059_create_departments_table.php',
            '2026_07_01_045060_create_positions_table.php',
            '2026_07_01_045069_create_attendance_records_table.php',
        ] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }

        (require database_path('migrations/2026_09_15_000001_make_users_password_nullable.php'))->up();
        (require database_path('migrations/2026_09_15_000000_create_external_identities_table.php'))->up();
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('external_identities');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_existing_local_user_can_still_authenticate_and_keeps_its_id(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('local-password'),
            'role' => 'management',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'local-password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'management')
            ->assertJsonStructure(['token']);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_existing_employee_relationship_is_preserved_when_identity_is_linked(): void
    {
        $user = User::factory()->create(['role' => 'management']);
        $employee = Employee::create([
            'user_id' => $user->id,
            'employee_number' => 'EMP-1001',
            'first_name' => 'Existing',
            'last_name' => 'Employee',
            'email' => 'employee@example.test',
            'hire_date' => '2020-01-01',
            'employment_type' => 'full_time',
            'status' => 'active',
        ]);

        $attendanceId = DB::table('attendance_records')->insertGetId(['employee_id' => $employee->id, 'date' => '2026-09-01']);
        $identity = $user->externalIdentities()->create([
            'issuer' => 'central-iam',
            'subject' => 'opaque-user-identifier',
        ]);

        $this->assertDatabaseHas('attendance_records', ['id' => $attendanceId, 'employee_id' => $employee->id]);
        $this->assertSame($user->id, $identity->user_id);
        $this->assertSame($user->id, $employee->fresh()->user_id);
        $this->assertSame('management', $user->fresh()->role);
    }

    public function test_issuer_and_subject_must_be_unique(): void
    {
        $firstUser = User::factory()->create();
        $firstUser->externalIdentities()->create([
            'issuer' => 'central-iam',
            'subject' => 'opaque-user-identifier',
        ]);

        $this->expectException(QueryException::class);

        $secondUser = User::factory()->create();
        $secondUser->externalIdentities()->create([
            'issuer' => 'central-iam',
            'subject' => 'opaque-user-identifier',
        ]);
    }

    public function test_matching_email_does_not_automatically_create_an_external_identity_link(): void
    {
        $user = User::factory()->create(['email' => 'existing@example.test']);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password', 'issuer' => 'central-iam', 'subject' => 'claimed-subject'])->assertOk();
        $this->assertDatabaseMissing('external_identities', [
            'user_id' => $user->id,
            'issuer' => 'central-iam',
            'subject' => 'existing@example.test',
        ]);
        $this->assertCount(0, $user->externalIdentities);
    }

    public function test_federated_identity_does_not_grant_hr_admin_or_replace_the_local_role(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);

        $user->externalIdentities()->create([
            'issuer' => 'central-iam',
            'subject' => 'opaque-user-identifier',
        ]);

        $this->assertFalse($user->fresh()->isHrAdmin());
        $this->assertSame('applicant', $user->fresh()->role);
    }

    public function test_inactive_user_cannot_authenticate_locally(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('local-password'),
            'is_active' => false,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'local-password',
        ])->assertUnauthorized();
    }

    public function test_public_registration_cannot_select_a_privileged_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Applicant',
            'email' => 'new-applicant@example.test',
            'password' => 'local-password',
            'password_confirmation' => 'local-password',
            'role' => 'hr_admin',
        ]);

        $response->assertCreated()->assertJsonPath('user.role', 'applicant');
        $this->assertDatabaseHas('users', [
            'email' => 'new-applicant@example.test',
            'role' => 'applicant',
        ]);
    }

    public function test_password_migration_preserves_existing_ids_credentials_and_relationships(): void
    {
        $migration = require database_path('migrations/2026_09_15_000001_make_users_password_nullable.php');
        $migration->down();
        $user = User::factory()->create(['role' => 'hr_admin']);
        $employee = Employee::create(['user_id' => $user->id, 'employee_number' => 'LEGACY', 'first_name' => 'Old', 'last_name' => 'User', 'email' => $user->email, 'hire_date' => '2020-01-01', 'employment_type' => 'full_time']);
        $before = $user->fresh()->getAttributes();
        $migration->up();
        $this->assertEquals($before, $user->fresh()->getAttributes());
        $this->assertSame($user->id, $employee->fresh()->user_id);
        $user->externalIdentities()->create(['issuer' => 'central-iam', 'subject' => 'approved-admin']);
        $this->assertSame('hr_admin', $user->fresh()->role);
    }

    public function test_credentialless_user_cannot_log_in_with_a_placeholder_password(): void
    {
        $user = User::factory()->create(['password' => null]);
        $user->externalIdentities()->create(['issuer' => 'central-iam', 'subject' => 'opaque']);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password123'])->assertUnauthorized();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_disabled_or_deleted_users_cannot_use_existing_tokens(): void
    {
        foreach ([['is_active' => false], ['deleted_at' => now()]] as $attributes) {
            $user = User::factory()->create();
            $token = $user->createToken('existing')->plainTextToken;
            $user->forceFill($attributes)->save();
            $this->app['auth']->forgetGuards();
            $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
        }
    }

    public function test_deleted_user_cannot_log_in(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['deleted_at' => now()])->save();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertUnauthorized();
    }

    public function test_all_business_routes_require_local_hr_admin_even_when_linked(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        foreach (['applicant', 'management'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $user->externalIdentities()->create(['issuer' => 'central-iam', 'subject' => $role]);
            $this->actingAs($user->fresh(), 'web');
            foreach (app('router')->getRoutes() as $route) {
                $uri = $route->uri();
                if (! str_starts_with($uri, 'api/') || str_starts_with($uri, 'api/auth/') || ! in_array('auth:sanctum', $route->gatherMiddleware())) {
                    continue;
                }
                $this->assertContains('role:hr_admin', $route->gatherMiddleware());
                $this->json($route->methods()[0], '/'.str_replace('{id}', '1', $uri))->assertForbidden();
            }
            $this->getJson('/api/auth/me')->assertOk();
        }
    }

    public function test_admin_employee_creation_has_no_shared_password_and_is_atomic(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr_admin'])->fresh(), 'web');
        $payload = ['first_name' => 'New', 'last_name' => 'Employee', 'email' => 'employee@example.test', 'employee_number' => 'NEW', 'hire_date' => '2026-09-01', 'employment_type' => 'full_time'];
        $this->postJson('/api/employees', $payload)->assertCreated();
        $user = User::where('email', $payload['email'])->firstOrFail();
        $this->assertNull($user->password);
        $this->assertFalse($user->is_active);
        $this->assertSame('applicant', $user->role);
        $this->assertNotNull($user->employee);
        Employee::creating(function () {
            throw new \RuntimeException('Simulated employee insert failure');
        });
        try {
            $this->postJson('/api/employees', array_replace($payload, ['email' => 'failed@example.test', 'employee_number' => 'FAIL']))->assertStatus(500);
            $this->assertDatabaseMissing('users', ['email' => 'failed@example.test']);
        } finally {
            Employee::flushEventListeners();
        }
    }

    public function test_logout_revokes_bearer_token_and_supports_session_authentication(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('existing')->plainTextToken;
        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
        $this->actingAs($user->fresh(), 'web')->withHeader('Origin', 'http://localhost:3000')->withSession(['private_value' => 'secret'])->postJson('/api/auth/logout')->assertOk()->assertSessionMissing('private_value');
        $this->assertGuest('web');
    }

    public function test_identity_keys_are_case_sensitive_and_subjects_are_scoped_by_issuer(): void
    {
        $user = User::factory()->create();
        foreach ([['central-iam', 'Subject'], ['central-iam', 'subject'], ['other-iam', 'Subject']] as [$issuer, $subject]) {
            $user->externalIdentities()->create(compact('issuer', 'subject'));
        }
        $this->assertSame(3, $user->externalIdentities()->count());
        $user->update(['email' => 'changed@example.test']);
        $this->assertSame($user->id, ExternalIdentity::where('issuer', 'central-iam')->where('subject', 'Subject')->firstOrFail()->user_id);
    }

    public function test_cors_does_not_allow_untrusted_origins(): void
    {
        $response = $this->withHeaders(['Origin' => 'https://untrusted.example', 'Access-Control-Request-Method' => 'POST'])->options('/api/auth/login');
        $this->assertNotContains($response->headers->get('Access-Control-Allow-Origin'), ['*', 'https://untrusted.example']);
    }

    public function test_nullable_password_rollback_refuses_to_destroy_credentialless_accounts(): void
    {
        User::factory()->create(['password' => null]);
        $this->expectException(\RuntimeException::class);
        (require database_path('migrations/2026_09_15_000001_make_users_password_nullable.php'))->down();
    }

    public function test_demo_admin_seeding_is_blocked_in_production(): void
    {
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        (new UserSeeder)->run();
    }

    public function test_authentication_logs_do_not_contain_credentials_or_tokens(): void
    {
        Log::spy();
        $response = $this->postJson('/api/auth/register', ['name' => 'Applicant', 'email' => 'safe@example.test', 'password' => 'secret-password', 'password_confirmation' => 'secret-password']);
        $response->assertCreated();
        Log::shouldHaveReceived('info')->with('User created', ['user_id' => $response->json('user.id')])->once();
        Log::shouldHaveReceived('info')->with('Token created for user', ['user_id' => $response->json('user.id')])->once();
        Log::shouldNotHaveReceived('debug');
        Log::shouldNotHaveReceived('error');
    }

    public function test_external_identity_requires_an_existing_local_user(): void
    {
        $this->expectException(QueryException::class);
        DB::table('external_identities')->insert(['user_id' => 999999, 'issuer' => 'central-iam', 'subject' => 'orphan']);
    }
}
