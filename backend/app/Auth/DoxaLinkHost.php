<?php

namespace App\Auth;

use App\Models\DoxaLinkTransaction;
use App\Models\Employee;
use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Contracts\PendingLinkHostBinding;
use Doxa\Laravel\Credentials\ManagedLoginPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/** Trusted adapter. Browser parameters never supply ownership or completion proof. */
class DoxaLinkHost implements PendingLinkHostBinding
{
    public function admin(): User
    {
        $user = Auth::guard('web')->user();
        // Reload: a session's cached model must not outlive local revocation.
        $user = $user ? User::query()->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->find($user->id) : null;
        if (! $user || ! $user->isHrAdmin() || ! $user->is_active || $user->deleted_at !== null) {
            throw new DoxaLinkFailure('admin_unauthorized');
        }

        return $user;
    }

    public function binding(Request $request): string
    {
        return hash('sha256', $request->session()->getId());
    }

    public function transaction(Request $request, string $id): DoxaLinkTransaction
    {
        $admin = $this->admin();
        $row = DoxaLinkTransaction::query()->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->find($id);
        if (! $row || $row->admin_id !== $admin->id || ! hash_equals($row->session_binding, $this->binding($request))) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        if ($row->expires_at->isPast()) {
            throw new DoxaLinkFailure('transaction_expired');
        }
        if ($row->client_id !== config('doxa.client_id')) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        $this->target($row);

        return $row;
    }

    public function target(DoxaLinkTransaction $row): User
    {
        $employee = Employee::query()->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->find($row->employee_id);
        $user = User::query()->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->find($row->target_user_id);
        if (! $employee || ! $user || $employee->user_id !== $user->id || ! $user->is_active || $user->deleted_at !== null) {
            throw new DoxaLinkFailure('target_invalid');
        }

        return $user;
    }

    public function eligible(DoxaLinkTransaction $row): ?ExternalIdentity
    {
        $identity = $row->identity;
        $issuer = $identity['issuer'] ?? null;
        $subject = $identity['subject'] ?? null;
        if (! is_string($issuer) || $issuer !== config('doxa.issuer') || $issuer === '' || strlen($issuer) > 255
            || ! is_string($subject) || $subject === '' || strlen($subject) > 255) {
            throw new DoxaLinkFailure('identity_invalid');
        }
        $link = ExternalIdentity::where('issuer', $issuer)->where('subject', $subject)
            ->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->first();
        if ($link && ($link->issuer !== $issuer || $link->subject !== $subject || $link->user_id !== $row->target_user_id
            || ($link->pending_link_id !== null && $link->pending_link_id !== $row->id))) {
            throw new DoxaLinkFailure('identity_conflict');
        }
        if (ExternalIdentity::where('user_id', $row->target_user_id)->where('issuer', $issuer)
            ->when($link, fn ($query) => $query->whereKeyNot($link->id))->exists()) {
            throw new DoxaLinkFailure('target_already_linked');
        }

        return $link;
    }

    public function capture(Request $request, ManagedLoginPolicy $policy): array
    {
        if ($policy->purpose !== 'pending_link' || ! $policy->linkReference) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        $row = $this->transaction($request, $policy->linkReference);
        if ($row->status !== 'pending') {
            throw new DoxaLinkFailure('transaction_replay');
        }

        return ['initiator' => 'hrm:user:'.$row->admin_id, 'link' => $row->id,
            'target' => 'hrm:user:'.$row->target_user_id, 'deadline' => $row->expires_at->timestamp];
    }

    private function bound(Request $request, array $metadata): DoxaLinkTransaction
    {
        $policy = $metadata['policy'] ?? $metadata;
        $host = $policy['host'] ?? [];
        $row = $this->transaction($request, $host['link'] ?? '');
        if (($host['initiator'] ?? null) !== 'hrm:user:'.$row->admin_id
            || ($host['target'] ?? null) !== 'hrm:user:'.$row->target_user_id
            || ($host['deadline'] ?? null) !== $row->expires_at->timestamp
            || ($policy['browser'] ?? null) !== $row->session_binding) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        if (isset($metadata['issuer'])) {
            if ($metadata['issuer'] !== config('doxa.issuer') || $metadata['client'] !== $row->client_id
                || ($row->identity !== null && [$metadata['issuer'], $metadata['subject']] !== [$row->identity['issuer'], $row->identity['subject']])
                || ($row->credential_reference !== null && explode('.', $row->credential_reference)[0] !== $metadata['id'])) {
                throw new DoxaLinkFailure('identity_invalid');
            }
        }

        return $row;
    }

    public function validate(Request $request, array $metadata, string $operation): void
    {
        if (($metadata['purpose'] ?? null) === 'ordinary') {
            // Provenance of the initiating admin never grants access as the target.
            $owner = Auth::guard('web')->user();
            $owner = $owner ? User::find($owner->id) : null;
            $row = DoxaLinkTransaction::find($metadata['policy']['host']['link'] ?? '');
            if (! $row || $row->status !== 'completed' || ! $owner || ! $owner->is_active || $owner->deleted_at !== null
                || $owner->id !== $row->target_user_id || ($metadata['owner']['account'] ?? null) !== 'hrm:user:'.$owner->id
                || ($metadata['owner']['session'] ?? null) !== $this->binding($request)
                || $metadata['issuer'] !== config('doxa.issuer') || $metadata['client'] !== $row->client_id
                || [$metadata['issuer'], $metadata['subject']] !== [$row->identity['issuer'], $row->identity['subject']]
                || $metadata['id'] !== explode('.', $row->credential_reference ?? '')[0]) {
                throw new DoxaLinkFailure('transaction_binding');
            }
            $link = $this->eligible($row);
            if (! $link || $link->id !== $row->mapping_id || $link->pending_link_id !== null) {
                throw new DoxaLinkFailure('commit_unverified');
            }

            return;
        }
        $row = $this->bound($request, $metadata);
        if (($metadata['purpose'] ?? null) !== 'pending_link' || ! in_array($row->status, ['pending', 'verified', 'claimed', 'committed'], true)) {
            throw new DoxaLinkFailure('transaction_replay');
        }
        if ($row->attempt !== null && $row->attempt !== ($metadata['completion']['attempt'] ?? null)) {
            throw new DoxaLinkFailure('transaction_binding');
        }
        if (in_array($operation, ['begin', 'callback'], true) && $row->status !== 'pending') {
            throw new DoxaLinkFailure('transaction_replay');
        }
        if ($operation === 'complete_pending_link' && $row->confirmed_at === null) {
            throw new DoxaLinkFailure('confirmation_required');
        }
        if (isset($metadata['issuer']) && $row->identity !== null) {
            $this->eligible($row);
        }
    }

    public function complete(Request $request, array $metadata): array
    {
        // Ordinary binding is deliberately unavailable to this linking-only adapter.
        throw new DoxaLinkFailure('transaction_binding');
    }

    public function claimPendingLink(Request $request, array $metadata, string $attempt): void
    {
        DB::transaction(function () use ($request, $metadata, $attempt) {
            $this->validate($request, $metadata, 'complete_pending_link');
            $row = $this->bound($request, $metadata);
            $this->eligible($row);
            if (DoxaLinkTransaction::whereKey($row->id)->where('status', 'verified')->whereNull('attempt')
                ->whereNotNull('confirmed_at')->update(['status' => 'claimed', 'attempt' => $attempt,
                    // Durable work ledger, polled by the scheduled recovery command.
                    'reconcile_after' => $row->expires_at]) !== 1) {
                throw new DoxaLinkFailure('transaction_replay');
            }
        });
    }

    public function commitPendingLink(Request $request, array $metadata, string $attempt): array
    {
        DB::transaction(function () use ($request, $metadata, $attempt) {
            $id = ($metadata['policy']['host']['link'] ?? '');
            DoxaLinkTransaction::whereKey($id)->lockForUpdate()->firstOrFail();
            $snapshot = DoxaLinkTransaction::findOrFail($id);
            User::whereKey($snapshot->admin_id)->lockForUpdate()->firstOrFail();
            Employee::whereKey($snapshot->employee_id)->lockForUpdate()->firstOrFail();
            $this->validate($request, $metadata, 'complete_pending_link');
            $row = $this->bound($request, $metadata);
            User::whereKey($row->target_user_id)->lockForUpdate()->firstOrFail();
            if ($row->status !== 'claimed' || $row->attempt !== $attempt) {
                throw new DoxaLinkFailure('transaction_replay');
            }
            $link = $this->eligible($row);
            if (! $link) {
                $link = new ExternalIdentity;
                $link->forceFill(['user_id' => $row->target_user_id, 'issuer' => $metadata['issuer'],
                    'subject' => $metadata['subject'], 'pending_link_id' => $row->id])->save();
            }
            $row->mapping_id = $link->id;
            $row->status = 'committed';
            $row->save();
            app(DoxaLinkAudit::class)->write('mapping_committed', $row, $this->admin());
        });

        return $this->verifyPendingLinkCommit($request, $metadata, $attempt);
    }

    public function verifyPendingLinkCommit(Request $request, array $metadata, string $attempt): array
    {
        $this->validate($request, $metadata, 'complete_pending_link');
        $row = $this->bound($request, $metadata);
        $link = $this->eligible($row);
        if ($row->status !== 'committed' || $row->attempt !== $attempt || ! $link || $link->id !== $row->mapping_id) {
            throw new DoxaLinkFailure('commit_unverified');
        }

        return ['account' => 'hrm:user:'.$row->target_user_id, 'session' => $row->session_binding];
    }

    public function abortPendingLink(array $metadata, string $attempt): void
    {
        DB::transaction(function () use ($metadata, $attempt) {
            $row = DoxaLinkTransaction::whereKey($metadata['policy']['host']['link'] ?? '')->lockForUpdate()->first();
            if (! $row || $row->attempt !== $attempt || ! in_array($row->status, ['claimed', 'committed', 'aborting'], true)) {
                return;
            }
            if ($row->status === 'aborting' && $row->consumed_at !== null) {
                return;
            }
            // Never touch an already valid/pre-existing mapping or another attempt's mapping.
            ExternalIdentity::whereKey($row->mapping_id)->where('pending_link_id', $row->id)
                ->where('user_id', $row->target_user_id)->where('issuer', $row->identity['issuer'])
                ->where('subject', $row->identity['subject'])->delete();
            $row->status = 'aborting';
            $row->consumed_at = now();
            $row->reconcile_after = now();
            $row->save();
            app(DoxaLinkAudit::class)->write('aborted', $row, null);
        });
    }
}
