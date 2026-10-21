<?php

return [
    'issuer' => env('DOXA_ISSUER'),
    'client_id' => env('DOXA_CLIENT_ID'),
    'client_secret' => env('DOXA_CLIENT_SECRET') === '' ? null : env('DOXA_CLIENT_SECRET'),
    'redirect_uri' => env('DOXA_REDIRECT_URI'),
    'scopes' => ['openid', 'profile', 'email'],
    'pkce_required' => true,
    'timeout' => 10,
    'discovery_cache_ttl' => 300,
    'jwks_cache_ttl' => 300,
    'client_auth_method' => null,
    'cache_store' => env('DOXA_CACHE_STORE') === '' ? null : env('DOXA_CACHE_STORE'),
    'userinfo_enabled' => false,
    'credentials' => [
        'enabled' => (bool) env('DOXA_CREDENTIALS_ENABLED', false),
        'connection' => env('DOXA_CREDENTIAL_CONNECTION', 'doxa_credentials'),
        'table' => 'doxa_credential_contexts',
        'key' => env('DOXA_CREDENTIAL_KEY'),
        'key_id' => env('DOXA_CREDENTIAL_KEY_ID'),
        'lifetime_seconds' => 3600,
        'unbound_seconds' => 300,
        'tombstone_seconds' => 3600,
        'refresh_margin_seconds' => 60,
    ],
];
