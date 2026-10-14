<?php

return [
    // Omit for a frontend/backend served through the same public origin.
    'frontend_url' => env('HRM_FRONTEND_URL'),
    'doxa_link_redirect_uri' => env('DOXA_LINK_REDIRECT_URI'),
    'doxa_application_id' => env('DOXA_HRM_APPLICATION_ID'),
    'doxa_access_read_token' => env('DOXA_ACCESS_READ_TOKEN'),
];
