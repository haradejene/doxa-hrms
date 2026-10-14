<?php

namespace App\Auth;

use App\Models\ExternalIdentity;
use App\Models\User;
use Doxa\Laravel\Identity\DoxaIdentity;

final class LinkedDoxaUserResolver
{
    public function resolve(#[\SensitiveParameter] DoxaIdentity $identity): ?User
    {
        $issuer = $identity->issuer();
        $subject = $identity->subject();

        // MySQL stores these opaque keys in VARBINARY(255): enforce byte limits.
        if ($issuer === '' || $subject === '' || strlen($issuer) > 255 || strlen($subject) > 255) {
            return null;
        }

        $link = ExternalIdentity::query()
            ->where('issuer', $issuer)
            ->where('subject', $subject)
            ->with('user')
            ->first();

        // Also fail closed if another database's collation is less exact.
        if ($link === null || ! hash_equals($issuer, $link->issuer) || ! hash_equals($subject, $link->subject)) {
            return null;
        }

        $user = $link->user;

        // This application's User model does not apply a SoftDeletes scope.
        return $user !== null && $user->is_active && $user->deleted_at === null ? $user : null;
    }
}
