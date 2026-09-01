<?php

declare(strict_types=1);

// ------------------------------------------------------------------
// Load environment variables from api/.env into $_ENV / getenv().
// ------------------------------------------------------------------
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            if (preg_match('/^([\'"])(.*)\1$/', $val, $m)) {
                $val = $m[2];
            }
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
            putenv("$key=$val");
        }
    }
}

// ------------------------------------------------------------------
// CORS — allow the configured frontend origins with credentials.
// ------------------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim', explode(',', $_ENV['CORS_ORIGINS'] ?? '')));
if ($origin !== '' && in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

date_default_timezone_set('Asia/Kolkata');

// ------------------------------------------------------------------
// Sessions — long-lived, stored in the app's own directory.
// ------------------------------------------------------------------
$sessionLifetime = 60 * 60 * 24 * 365; // 1 year
$cookieSecure = (($_SERVER['HTTPS'] ?? '') === 'on') || (($_SERVER['SERVER_PORT'] ?? '') === '443');

$sessionDir = __DIR__ . '/.sessions';
if (!is_dir($sessionDir) && @mkdir($sessionDir, 0700, true)) {
    @file_put_contents($sessionDir . '/.htaccess', "Require all denied\nDeny from all\n");
}
if (is_dir($sessionDir) && is_writable($sessionDir)) {
    session_save_path($sessionDir);
}
ini_set('session.gc_maxlifetime', (string) $sessionLifetime);

session_set_cookie_params([
    'lifetime' => $sessionLifetime,
    'path' => '/',
    'secure' => $cookieSecure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/staffapp.php';

// Any uncaught error still returns JSON, not an HTML stack trace.
set_exception_handler(static function (Throwable $e): void {
    error_log('fix-kharch API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error. Please try again.']);
    exit;
});
