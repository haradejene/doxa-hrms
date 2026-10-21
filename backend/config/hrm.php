<?php

return [
    // HRM opts in explicitly. Other hosts may select existing-account-only.
    'doxa_account_policy' => env('DOXA_ACCOUNT_POLICY', 'provision'),
    'doxa_default_role' => env('DOXA_PROVISIONING_ROLE', 'applicant'),
    // Omit for a frontend/backend served through the same public origin.
    'frontend_url' => env('HRM_FRONTEND_URL'),
    'doxa_link_redirect_uri' => env('DOXA_LINK_REDIRECT_URI'),
    'doxa_application_id' => env('DOXA_HRM_APPLICATION_ID'),
    'doxa_access_read_token' => env('DOXA_ACCESS_READ_TOKEN'),
];
