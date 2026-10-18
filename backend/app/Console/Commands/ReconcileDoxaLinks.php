<?php

namespace App\Console\Commands;

use App\Auth\DoxaLinkHost;
use App\Models\DoxaLinkTransaction;
use Doxa\Laravel\Contracts\CredentialStore;
use Doxa\Laravel\Exceptions\CredentialException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileDoxaLinks extends Command
{
    protected $signature = 'doxa:reconcile-links';

    protected $description = 'Consume abandoned Doxa link attempts without reconstructing completion proofs';

    public function handle(DoxaLinkHost $host): int
    {
        $failed = false;
        DoxaLinkTransaction::where('status', '!=', 'completed')->where(function ($query) {
            $query->where('expires_at', '<=', now())->orWhere('reconcile_after', '<=', now());
        })->orderBy('id')->chunkById(100, function ($rows) use ($host, &$failed) {
            foreach ($rows as $candidate) {
                try {
                    // Fence first. A concurrent final receipt commit either wins in full or fails.
                    $row = DB::transaction(function () use ($candidate) {
                        $row = DoxaLinkTransaction::whereKey($candidate->id)->lockForUpdate()->first();
                        if (! $row || in_array($row->status, ['completed', 'failed'], true)) {
                            return null;
                        }
                        if ($row->expires_at->isFuture() && (! $row->reconcile_after || $row->reconcile_after->isFuture())) {
                            return null;
                        }
                        $row->status = 'aborting';
                        $row->reconcile_after = now();
                        $row->save();

                        return $row;
                    });
                    if (! $row) {
                        continue;
                    }
                    if ($row->attempt) {
                        $host->abortPendingLink(['policy' => ['host' => ['link' => $row->id]]], $row->attempt);
                    }
                    if ($row->credential_reference) {
                        $store = app(CredentialStore::class);
                        $id = explode('.', $row->credential_reference)[0];
                        try {
                            $metadata = $store->metadata($id);
                        } catch (CredentialException $exception) {
                            // SDK cleanup may already have purged this context. Outages must retry.
                            if ($exception->category !== 'incompatible_context') {
                                throw $exception;
                            }
                            $metadata = null;
                        }
                        if ($metadata !== null) {
                            if (($metadata['policy']['host']['link'] ?? null) !== $row->id
                                || ($metadata['policy']['host']['target'] ?? null) !== 'hrm:user:'.$row->target_user_id
                                || ($row->attempt !== null && ($metadata['completion']['attempt'] ?? null) !== $row->attempt)) {
                                throw new \RuntimeException;
                            }
                            $store->delete($id, $metadata['version'], 'unusable');
                        }
                    }
                    DoxaLinkTransaction::whereKey($row->id)->where('status', 'aborting')
                        ->update(['status' => 'failed', 'credential_reference' => null, 'reconcile_after' => null, 'consumed_at' => now()]);
                } catch (\Throwable) {
                    // Retain durable work through outages/version conflicts. No sensitive diagnostics.
                    $failed = true;
                }
            }
        });
        if ($failed) {
            $this->error('Some linking attempts still require reconciliation. Retry after storage recovers.');
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
