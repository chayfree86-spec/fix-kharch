<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $month = require_month_key($_GET['month'] ?? '');
    $stmt = $pdo->prepare('SELECT budget FROM month_budgets WHERE user_id = ? AND month_key = ? LIMIT 1');
    $stmt->execute([$userId, $month]);
    $budget = $stmt->fetchColumn();

    if ($budget === false) {
        // Fall back to the user's default monthly budget.
        $stmt = $pdo->prepare('SELECT default_monthly_budget FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $budget = (int) $stmt->fetchColumn();
    }

    respond(['ok' => true, 'month' => $month, 'budget' => (int) $budget]);
}

if ($method === 'PUT' || $method === 'POST') {
    $input = json_input();
    $month = require_month_key($input['month'] ?? '');
    $budget = whole_rupees($input['budget'] ?? 0);

    $stmt = $pdo->prepare(
        'INSERT INTO month_budgets (user_id, month_key, budget) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE budget = VALUES(budget)'
    );
    $stmt->execute([$userId, $month, $budget]);

    respond(['ok' => true, 'month' => $month, 'budget' => $budget]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
