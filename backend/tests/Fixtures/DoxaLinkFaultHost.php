<?php

namespace Tests\Fixtures;

use App\Auth\DoxaLinkHost;
use Illuminate\Http\Request;

class DoxaLinkFaultHost extends DoxaLinkHost
{
    public bool $loseCommitAck = false;

    public bool $cannotVerify = false;

    public bool $cannotAbort = false;

    public ?\Closure $afterCommit = null;

    public function commitPendingLink(Request $request, array $metadata, string $attempt): array
    {
        $result = parent::commitPendingLink($request, $metadata, $attempt);
        if ($this->afterCommit) {
            ($this->afterCommit)();
        }
        if ($this->loseCommitAck) {
            throw new \RuntimeException('Synthetic acknowledgement loss');
        }

        return $result;
    }

    public function verifyPendingLinkCommit(Request $request, array $metadata, string $attempt): array
    {
        if ($this->cannotVerify) {
            throw new \RuntimeException('Synthetic verification outage');
        }

        return parent::verifyPendingLinkCommit($request, $metadata, $attempt);
    }

    public function abortPendingLink(array $metadata, string $attempt): void
    {
        if ($this->cannotAbort) {
            throw new \RuntimeException('Synthetic recovery outage');
        }
        parent::abortPendingLink($metadata, $attempt);
    }
}
