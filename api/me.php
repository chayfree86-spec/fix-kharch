<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();

$stmt = $pdo->prepare('SELECT id, name, email, mobile FROM users WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    session_destroy();
    respond(['ok' => false, 'message' => 'Not authenticated.'], 401);
}

respond([
    'ok' => true,
    'user' => [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'mobile' => $user['mobile'],
    ],
    'data' => load_bootstrap_data($pdo, $userId),
]);
