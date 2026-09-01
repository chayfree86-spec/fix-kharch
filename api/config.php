<?php

declare(strict_types=1);

return [
    'db_host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'db_name' => $_ENV['DB_NAME'] ?? 'fix_spend',
    'db_user' => $_ENV['DB_USER'] ?? 'root',
    'db_pass' => $_ENV['DB_PASS'] ?? '',
    'db_charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
];
