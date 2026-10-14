<?php

namespace App\Auth;

use App\Models\DoxaLinkTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class DoxaLinkAudit
{
    public function write(string $action, ?DoxaLinkTransaction $transaction, ?User $actor, ?string $failure = null): void
    {
        // Existing AuditLog has no writer and is fully guarded. Use its existing
        // table with an explicit allowlist; never capture requests or exceptions.
        $identity = $transaction?->identity;
        DB::table('audit_logs')->insert([
            'user_id' => $actor && User::whereKey($actor->id)->exists() ? $actor->id : null,
            'user_name' => $actor?->name,
            'action' => 'doxa.link.'.$action, 'subject_type' => User::class,
            'subject_id' => $transaction?->target_user_id,
            'new_values' => json_encode([
                'initiating_admin_id' => $transaction?->admin_id,
                'employee_id' => $transaction?->employee_id,
                'issuer' => $identity['issuer'] ?? null,
                'subject' => $identity['subject'] ?? null,
                'failure_category' => $failure,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
