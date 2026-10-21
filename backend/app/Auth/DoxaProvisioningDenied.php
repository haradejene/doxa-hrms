<?php

namespace App\Auth;

final class DoxaProvisioningDenied extends \RuntimeException
{
    public function __construct(public readonly string $reason = 'account_ineligible')
    {
        parent::__construct('Doxa local account provisioning denied.');
    }
}
