<?php

namespace App\Auth;

use Doxa\Laravel\Contracts\Transport;
use Illuminate\Support\Str;

class DoxaApplicationAccess
{
    public function allowed(string $issuer, string $subject): bool
    {
        // Existing IAM API resolves public_id, which is the existing OIDC sub.
        // Never infer access from email or from a previously successful callback.
        $token = config('hrm.doxa_access_read_token');
        $application = config('hrm.doxa_application_id');
        if ($issuer !== config('doxa.issuer') || ! Str::isUuid($subject)
            || ! Str::isUuid($application) || ! is_string($token) || $token === '') {
            return false;
        }
        try {
            // SDK transport uses a dedicated TLS client without Laravel HTTP
            // diagnostic events, redirects, raw exceptions or credential logging.
            $response = app(Transport::class)->request('GET',
                rtrim($issuer, '/').'/api/admin/users/'.rawurlencode($subject).'/applications', [
                    'headers' => ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'],
                    'query' => ['application_ids' => [$application], 'per_page' => 1],
                ]);
            $records = $response->data()['data'] ?? null;
            return $response->mediaType === 'application/json' && is_array($records) && count($records) === 1
                && ($records[0]['id'] ?? null) === $application
                && ($records[0]['effective_access'] ?? null) === true;
        } catch (\Throwable) {
            return false;
        }
    }
}
