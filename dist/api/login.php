<?php

require_once __DIR__ . '/_bootstrap.php';

require_post();
$input = json_input();

$identifier = trim((string) ($input['identifier'] ?? ''));
$password = (string) ($input['password'] ?? '');

if ($identifier === '' || $password === '') {
    respond(['ok' => false, 'message' => 'Email/mobile and password are required.'], 422);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, name, email, mobile, password_hash
     FROM users
     WHERE is_active = 1 AND (email = ? OR mobile = ?)
     LIMIT 1'
);
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string) $user['password_hash'])) {
    respond(['ok' => false, 'message' => 'Invalid login details.'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];

$pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);

respond([
    'ok' => true,
    'user' => [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'mobile' => $user['mobile'],
    ],
    'data' => load_bootstrap_data($pdo, (int) $user['id']),
]);
