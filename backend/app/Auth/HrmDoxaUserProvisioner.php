<?php

namespace App\Auth;

use App\Models\User;
use Doxa\Laravel\Identity\DoxaIdentity;

final class HrmDoxaUserProvisioner implements DoxaUserProvisioner
{
    public function create(#[\SensitiveParameter] DoxaIdentity $identity): User
    {
        $email = $identity->email();
        if ($identity->emailVerified() !== true) {
            throw new DoxaProvisioningDenied('email_unverified');
        }
        if (! is_string($email) || strlen($email) > 255 || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new DoxaProvisioningDenied('email_invalid');
        }
        if (config('hrm.doxa_default_role') !== 'applicant') {
            throw new DoxaProvisioningDenied('unsafe_default_role');
        }
        $email = strtolower(trim($email));
        // Collision means explicit linking is needed, including inactive/deleted local accounts.
        // Never attach a verified email to an existing local account automatically.
        if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            throw new DoxaProvisioningDenied('email_collision');
        }
        $name = $identity->name() ?: 'Doxa user';
        if (strlen($name) > 255) {
            throw new DoxaProvisioningDenied('name_invalid');
        }

        $user = new User;
        $user->forceFill(['name' => $name, 'email' => $email, 'password' => null,
            'role' => 'applicant', 'is_active' => true, 'email_verified_at' => now()])->save();

        return $user;
    }
}
