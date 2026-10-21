<?php

namespace App\Auth;

use App\Models\User;
use Doxa\Laravel\Identity\DoxaIdentity;

/** Trusted application adapter. Called inside the mapping transaction, never from request fields. */
interface DoxaUserProvisioner
{
    public function create(#[\SensitiveParameter] DoxaIdentity $identity): User;
}
