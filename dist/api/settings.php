<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    respond(['ok' => true, 'data' => load_bootstrap_data($pdo, $userId)]);
}

if ($method === 'PUT' || $method === 'POST') {
    $input = json_input();

    $fields = [];
    $values = [];
    if (array_key_exists('cafeName', $input)) {
        $fields[] = 'cafe_name = ?';
        $values[] = trim((string) $input['cafeName']) ?: 'My Café';
    }
    if (array_key_exists('tagline', $input)) {
        $fields[] = 'tagline = ?';
        $values[] = (string) $input['tagline'];
    }
    if (array_key_exists('currencySymbol', $input)) {
        $fields[] = 'currency_symbol = ?';
        $values[] = substr(trim((string) $input['currencySymbol']) ?: '₹', 0, 8);
    }
    if (array_key_exists('defaultMonthlyBudget', $input)) {
        $fields[] = 'default_monthly_budget = ?';
        $values[] = whole_rupees($input['defaultMonthlyBudget']);
    }
    if (array_key_exists('staffBusinessId', $input)) {
        $fields[] = 'staff_business_id = ?';
        $values[] = $input['staffBusinessId'] === null || $input['staffBusinessId'] === ''
            ? null : (int) $input['staffBusinessId'];
    }

    if ($fields) {
        $values[] = $userId;
        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);
    }

    respond(['ok' => true, 'data' => load_bootstrap_data($pdo, $userId)]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
