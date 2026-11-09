<?php

return [
    'imap' => [
        'enabled' => (bool) env('PROSPECTION_IMAP_ENABLED', false),
        'host' => env('PROSPECTION_IMAP_HOST', 'imap.gmail.com'),
        'port' => (int) env('PROSPECTION_IMAP_PORT', 993),
        'encryption' => env('PROSPECTION_IMAP_ENCRYPTION', 'ssl'),
        'username' => env('PROSPECTION_IMAP_USERNAME', env('MAIL_USERNAME')),
        'password' => env('PROSPECTION_IMAP_PASSWORD', env('MAIL_PASSWORD')),
        'folder' => env('PROSPECTION_IMAP_FOLDER', 'INBOX'),
        'validate_cert' => (bool) env('PROSPECTION_IMAP_VALIDATE_CERT', true),
    ],
];
