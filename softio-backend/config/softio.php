<?php

return [
    'sso' => [
        'api_url' => rtrim((string) env('SOFTIO_API_URL', 'http://127.0.0.1:8000/api'), '/'),
        'secret' => env('SOFTIO_SSO_SECRET'),
        'module_id' => env('SOFTIO_MODULE_ID') !== null ? (int) env('SOFTIO_MODULE_ID') : null,
        'verify_minutes' => (int) env('SOFTIO_SSO_VERIFY_MINUTES', 10),
    ],
];
