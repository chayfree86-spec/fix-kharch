<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Resolve the Staff-app business this user is linked to.
$stmt = $pdo->prepare('SELECT staff_business_id FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$businessId = $stmt->fetchColumn();
$businessId = $businessId !== false && $businessId !== null ? (int) $businessId : null;

// GET ?month=YYYY-MM -> staff from Staff-app merged with saved manual amounts.
if ($method === 'GET') {
    $month = require_month_key($_GET['month'] ?? '');

    if ($businessId === null) {
        respond([
            'ok' => true,
            'month' => $month,
            'staff' => [],
            'message' => 'No Staff-app business linked. Set it in Settings to load staff.',
        ]);
    }

    try {
        $remoteStaff = staffapp_fetch_staff($businessId);
    } catch (RuntimeException $e) {
        respond(['ok' => false, 'message' => $e->getMessage()], 502);
    }

    // Saved manual amounts for this month.
    $stmt = $pdo->prepare(
        'SELECT external_staff_id, amount FROM staff_amounts WHERE user_id = ? AND month_key = ?'
    );
    $stmt->execute([$userId, $month]);
    $saved = [];
    foreach ($stmt->fetchAll() as $r) {
        $saved[(int) $r['external_staff_id']] = (int) $r['amount'];
    }

    $staff = array_map(static function (array $s) use ($saved): array {
        return [
            'id' => (string) $s['id'],           // Staff-app staff id
            'name' => $s['name'],
            'fixAmount' => (int) $s['monthlySalary'], // reference fixed salary
            'amount' => $saved[$s['id']] ?? 0,        // manually filled actual
        ];
    }, $remoteStaff);

    respond(['ok' => true, 'month' => $month, 'staff' => $staff]);
}

// PUT { month, staffId, amount, name, fixAmount } -> save/replace the manual amount.
if ($method === 'PUT' || $method === 'POST') {
    $input = json_input();
    $month = require_month_key($input['month'] ?? '');
    $staffId = (int) ($input['staffId'] ?? 0);
    if ($staffId <= 0) {
        respond(['ok' => false, 'message' => 'Valid staffId is required.'], 422);
    }
    $amount = whole_rupees($input['amount'] ?? 0);
    $name = trim((string) ($input['name'] ?? ''));
    $fixAmount = whole_rupees($input['fixAmount'] ?? 0);

    $stmt = $pdo->prepare(
        'INSERT INTO staff_amounts (user_id, month_key, external_staff_id, staff_name, fix_amount, amount)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            staff_name = VALUES(staff_name),
            fix_amount = VALUES(fix_amount)'
    );
    $stmt->execute([$userId, $month, $staffId, $name, $fixAmount, $amount]);

    respond([
        'ok' => true,
        'staff' => ['id' => (string) $staffId, 'name' => $name, 'fixAmount' => $fixAmount, 'amount' => $amount],
    ]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
