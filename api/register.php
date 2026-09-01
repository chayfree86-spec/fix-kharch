<?php

require_once __DIR__ . '/_bootstrap.php';

require_post();
$input = json_input();

$name = trim((string) ($input['name'] ?? ''));
$email = str_or_null($input['email'] ?? null);
$mobile = str_or_null($input['mobile'] ?? null);
$password = (string) ($input['password'] ?? '');
$businessId = isset($input['businessId']) && $input['businessId'] !== ''
    ? (int) $input['businessId'] : null;
$cafeName = trim((string) ($input['cafeName'] ?? '')) ?: 'My Café';

if ($name === '') {
    respond(['ok' => false, 'message' => 'Your name is required.'], 422);
}
if ($email === null && $mobile === null) {
    respond(['ok' => false, 'message' => 'Email or mobile is required.'], 422);
}
if (strlen($password) < 6) {
    respond(['ok' => false, 'message' => 'Password must be at least 6 characters.'], 422);
}

$pdo = db();

// Uniqueness check across email/mobile.
$stmt = $pdo->prepare(
    'SELECT id FROM users WHERE (email IS NOT NULL AND email = ?) OR (mobile IS NOT NULL AND mobile = ?) LIMIT 1'
);
$stmt->execute([$email ?? '', $mobile ?? '']);
if ($stmt->fetch()) {
    respond(['ok' => false, 'message' => 'An account with this email or mobile already exists.'], 409);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, mobile, password_hash, staff_business_id, cafe_name)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $email,
        $mobile,
        password_hash($password, PASSWORD_DEFAULT),
        $businessId,
        $cafeName,
    ]);
    $userId = (int) $pdo->lastInsertId();

    // Seed the four default categories.
    $stmt = $pdo->prepare(
        'INSERT INTO categories (user_id, slug, name, description, icon, is_default, is_enabled, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?)'
    );
    foreach (default_categories() as [$slug, $catName, $desc, $icon, $order]) {
        $stmt->execute([$userId, $slug, $catName, $desc, $icon, $order]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

session_regenerate_id(true);
$_SESSION['user_id'] = $userId;

respond([
    'ok' => true,
    'user' => [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'mobile' => $mobile,
    ],
    'data' => load_bootstrap_data($pdo, $userId),
]);
