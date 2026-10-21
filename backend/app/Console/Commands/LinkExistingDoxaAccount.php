<?php

namespace App\Console\Commands;

use App\Models\ExternalIdentity;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/** Privileged operator migration, never an HTTP endpoint or an email-matching mechanism. */
final class LinkExistingDoxaAccount extends Command
{
    protected $signature = 'doxa:link-existing {user : Independently verified local user ID}
        {subject : Independently verified immutable IAM subject} {--actor= : Active local HR administrator ID}
        {--apply : Write the reviewed mapping} {--verified : Operator attests independent identity verification}
        {--confirm= : Exact plan SHA-256 printed by the dry run}';

    protected $description = 'Review or explicitly audit a verified existing-account link without changing user data';

    public function handle(): int
    {
        $issuer = config('doxa.issuer');
        $subject = $this->argument('subject');
        $userId = (string) $this->argument('user');
        $actorId = (string) $this->option('actor');
        if (! is_string($issuer) || ! str_starts_with($issuer, 'https://') || strlen($issuer) > 255
            || ! is_string($subject) || $subject === '' || strlen($subject) > 255
            || ! ctype_digit($userId) || ! ctype_digit($actorId)) {
            $this->error('Supply valid exact identity and local IDs. No mapping was changed.');

            return self::FAILURE;
        }
        $plan = hash('sha256', json_encode([$issuer, $subject, $userId, $actorId], JSON_THROW_ON_ERROR));
        $this->line('Target user: '.$userId.'; issuer: '.$issuer.'; subject SHA-256: '.hash('sha256', $subject));
        $this->line('Plan SHA-256: '.$plan);
        if (! $this->option('apply')) {
            $this->info('Dry run only. Independently verify identity and ownership before --apply --verified --confirm=<plan>.');

            return self::SUCCESS;
        }
        if (! $this->option('verified') || ! hash_equals($plan, (string) $this->option('confirm'))) {
            $this->error('Independent verification and exact plan confirmation are required. No mapping was changed.');

            return self::FAILURE;
        }
        try {
            $mappingId = DB::transaction(function () use ($issuer, $subject, $userId, $actorId, $plan) {
                $actor = User::whereKey($actorId)->lockForUpdate()->firstOrFail();
                $user = User::whereKey($userId)->lockForUpdate()->firstOrFail();
                if (! $actor->isHrAdmin() || ! $actor->is_active || $actor->deleted_at !== null
                    || ! $user->is_active || $user->deleted_at !== null) {
                    throw new \RuntimeException;
                }
                $existing = ExternalIdentity::where('issuer', $issuer)->where('subject', $subject)->lockForUpdate()->first();
                if ($existing) {
                    if ($existing->issuer !== $issuer || $existing->subject !== $subject
                        || (int) $existing->user_id !== (int) $userId || $existing->pending_link_id !== null) {
                        throw new \RuntimeException;
                    }

                    return $existing->id;
                }
                if ($user->externalIdentities()->where('issuer', $issuer)->exists()) {
                    throw new \RuntimeException;
                }
                $mapping = $user->externalIdentities()->create(['issuer' => $issuer, 'subject' => $subject]);
                DB::table('audit_logs')->insert(['user_id' => $actor->id, 'action' => 'doxa.link.operator_linked',
                    'subject_type' => User::class, 'subject_id' => (string) $user->id,
                    'new_values' => json_encode(['issuer' => $issuer, 'subject' => $subject, 'plan_sha256' => $plan], JSON_THROW_ON_ERROR),
                    'created_at' => now(), 'updated_at' => now()]);

                return $mapping->id;
            });
            $this->info('Verified mapping ID: '.$mappingId.'. Account data and roles were not modified.');

            return self::SUCCESS;
        } catch (\Throwable) {
            $this->error('Link failed validation or storage checks. No partial mapping was committed.');

            return self::FAILURE;
        }
    }
}
