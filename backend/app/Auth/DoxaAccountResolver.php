<?php

namespace App\Auth;

use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Contracts\AccountResolver;
use Doxa\Laravel\Identity\DoxaIdentity;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/** Host account policy. SDK resolveAccount invokes this only after fresh IAM application access. */
final class DoxaAccountResolver implements AccountResolver
{
    public function __construct(private LinkedDoxaUserResolver $linked, private DoxaUserProvisioner $provisioner) {}

    public function resolve(#[\SensitiveParameter] DoxaIdentity $identity): ?User
    {
        if ($identity->issuer() !== config('doxa.issuer') || $identity->subject() === ''
            || strlen($identity->issuer()) > 255 || strlen($identity->subject()) > 255) {
            $this->denied($identity, 'identity_key_invalid');

            return null;
        }
        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                return DB::transaction(function () use ($identity) {
                    $mapping = ExternalIdentity::where('issuer', $identity->issuer())
                        ->where('subject', $identity->subject())->lockForUpdate()->first();
                    if ($mapping) {
                        // Includes provisional, inactive and deleted accounts: never provision around a denial.
                        User::whereKey($mapping->user_id)->lockForUpdate()->first();

                        $user = $this->linked->resolve($identity);
                        if ($user === null) {
                            $this->denied($identity, 'mapping_ineligible');
                        }

                        return $user;
                    }
                    if (config('hrm.doxa_account_policy') !== 'provision') {
                        $this->denied($identity, 'provisioning_disabled');

                        return null;
                    }
                    $user = $this->provisioner->create($identity);
                    if (! $user->wasRecentlyCreated || ! $user->exists || ! $user->is_active || $user->deleted_at !== null
                        || $user->getConnection()->getName() !== DB::connection()->getName()) {
                        throw new DoxaProvisioningDenied;
                    }
                    $user->externalIdentities()->create(['issuer' => $identity->issuer(), 'subject' => $identity->subject()]);
                    DB::table('audit_logs')->insert(['user_id' => $user->id, 'action' => 'doxa.account.provisioned',
                        'subject_type' => User::class, 'subject_id' => (string) $user->id,
                        'new_values' => json_encode(['issuer' => $identity->issuer(), 'subject' => $identity->subject(), 'role' => $user->role], JSON_THROW_ON_ERROR),
                        'created_at' => now(), 'updated_at' => now()]);

                    return $user;
                }, 3);
            } catch (DoxaProvisioningDenied $exception) {
                // Never log an exception object, profile claims, request, or session.
                $reasons = ['email_unverified', 'email_invalid', 'unsafe_default_role', 'email_collision', 'name_invalid'];
                $this->denied($identity, in_array($exception->reason, $reasons, true) ? $exception->reason : 'account_ineligible');

                return null;
            } catch (QueryException $e) {
                // The entire losing transaction (including its new user) rolled back. Re-read the winner.
                $retryable = in_array((string) $e->getCode(), ['23000', '23505'], true)
                    || str_contains($e->getMessage(), 'database is locked');
                if (! $retryable || $attempt === 2) {
                    throw $e;
                }
                usleep(20000);
            }
        }

        return null;
    }

    private function denied(#[\SensitiveParameter] DoxaIdentity $identity, string $reason): void
    {
        Log::notice('doxa.login.account_denied', [
            'stage' => 'account_resolution', 'reason' => $reason,
            'subject_sha256' => hash('sha256', $identity->issuer()."\0".$identity->subject()),
        ]);
    }
}
