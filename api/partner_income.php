<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

const VALID_GROUPS = ['daal_roti', 'chay_chaupal'];
const DEFAULT_PARTNERS = [
    'daal_roti' => ['Vijender Prajapati', 'Chay Chaupal'],
    'chay_chaupal' => ['Sandeep', 'Narender'],
];

function partner_income_row(PDO $pdo, int $userId, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, month_key, partner_group, total_amount, income_date, payment_mode, remarks,
                partner1_name, partner1_amount, partner2_name, partner2_amount, created_at
         FROM partner_incomes WHERE id = ? AND user_id = ? LIMIT 1'
    );
    $stmt->execute([$id, $userId]);
    $r = $stmt->fetch();
    if (!$r) {
        return null;
    }
    return [
        'id' => (string) $r['id'],
        'monthKey' => $r['month_key'],
        'partnerGroup' => $r['partner_group'],
        'totalAmount' => (int) $r['total_amount'],
        'incomeDate' => $r['income_date'],
        'paymentMode' => $r['payment_mode'],
        'remarks' => $r['remarks'],
        'partner1Name' => $r['partner1_name'],
        'partner1Amount' => (int) $r['partner1_amount'],
        'partner2Name' => $r['partner2_name'],
        'partner2Amount' => (int) $r['partner2_amount'],
        'createdAt' => $r['created_at'],
    ];
}

// GET ?month=YYYY-MM|ALL[&group=daal_roti|chay_chaupal]
if ($method === 'GET') {
    $rawMonth = trim((string) ($_GET['month'] ?? ''));
    $group = str_or_null($_GET['group'] ?? null);

    if ($rawMonth === 'ALL' || $rawMonth === '') {
        $month = 'ALL';
        $sql = 'SELECT id, month_key, partner_group, total_amount, income_date, payment_mode, remarks,
                       partner1_name, partner1_amount, partner2_name, partner2_amount, created_at
                FROM partner_incomes WHERE user_id = ?';
        $params = [$userId];
    } else {
        $month = require_month_key($rawMonth);
        $sql = 'SELECT id, month_key, partner_group, total_amount, income_date, payment_mode, remarks,
                       partner1_name, partner1_amount, partner2_name, partner2_amount, created_at
                FROM partner_incomes WHERE user_id = ? AND month_key = ?';
        $params = [$userId, $month];
    }

    if ($group !== null && in_array($group, VALID_GROUPS, true)) {
        $sql .= ' AND partner_group = ?';
        $params[] = $group;
    }
    $sql .= ' ORDER BY income_date DESC, id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $items = array_map(static fn(array $r): array => [
        'id' => (string) $r['id'],
        'monthKey' => $r['month_key'],
        'partnerGroup' => $r['partner_group'],
        'totalAmount' => (int) $r['total_amount'],
        'incomeDate' => $r['income_date'],
        'paymentMode' => $r['payment_mode'],
        'remarks' => $r['remarks'],
        'partner1Name' => $r['partner1_name'],
        'partner1Amount' => (int) $r['partner1_amount'],
        'partner2Name' => $r['partner2_name'],
        'partner2Amount' => (int) $r['partner2_amount'],
        'createdAt' => $r['created_at'],
    ], $stmt->fetchAll());

    // Compute separate summaries for Daal Roti and Chay Chaupal
    $summary = [
        'daal_roti' => [
            'total' => 0,
            'partners' => [
                'Vijender Prajapati' => 0,
                'Chay Chaupal' => 0,
            ],
        ],
        'chay_chaupal' => [
            'total' => 0,
            'partners' => [
                'Sandeep' => 0,
                'Narender' => 0,
            ],
        ],
    ];

    foreach ($items as $item) {
        $g = $item['partnerGroup'];
        if (isset($summary[$g])) {
            $summary[$g]['total'] += $item['totalAmount'];
            $p1 = $item['partner1Name'];
            $p2 = $item['partner2Name'];
            $summary[$g]['partners'][$p1] = ($summary[$g]['partners'][$p1] ?? 0) + $item['partner1Amount'];
            $summary[$g]['partners'][$p2] = ($summary[$g]['partners'][$p2] ?? 0) + $item['partner2Amount'];
        }
    }

    respond([
        'ok' => true,
        'month' => $month,
        'items' => $items,
        'summary' => $summary,
    ]);
}

if ($method === 'POST') {
    $input = json_input();
    $group = trim((string) ($input['partnerGroup'] ?? ''));
    if (!in_array($group, VALID_GROUPS, true)) {
        respond(['ok' => false, 'message' => 'Invalid partner group. Must be daal_roti or chay_chaupal.'], 422);
    }

    $totalAmount = whole_rupees($input['totalAmount'] ?? $input['amount'] ?? 0);
    if ($totalAmount <= 0) {
        respond(['ok' => false, 'message' => 'Income amount must be greater than ₹0.'], 422);
    }

    $incomeDate = trim((string) ($input['incomeDate'] ?? ''));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $incomeDate)) {
        $incomeDate = date('Y-m-d');
    }

    $rawMonth = trim((string) ($input['month'] ?? ''));
    if ($rawMonth === 'ALL' || $rawMonth === '') {
        $month = substr($incomeDate, 0, 7);
    } else {
        $month = require_month_key($rawMonth);
    }

    $paymentMode = trim((string) ($input['paymentMode'] ?? 'Cash'));
    if ($paymentMode === '') {
        $paymentMode = 'Cash';
    }

    $remarks = str_or_null($input['remarks'] ?? null);

    $defaultP1 = DEFAULT_PARTNERS[$group][0];
    $defaultP2 = DEFAULT_PARTNERS[$group][1];

    $partner1Name = trim((string) ($input['partner1Name'] ?? $defaultP1));
    $partner2Name = trim((string) ($input['partner2Name'] ?? $defaultP2));

    // Automatic 50-50 distribution if not explicitly specified
    if (isset($input['partner1Amount']) && isset($input['partner2Amount'])) {
        $partner1Amount = whole_rupees($input['partner1Amount']);
        $partner2Amount = whole_rupees($input['partner2Amount']);
    } else {
        $partner1Amount = (int) floor($totalAmount / 2);
        $partner2Amount = $totalAmount - $partner1Amount;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO partner_incomes (
            user_id, month_key, partner_group, total_amount, income_date, payment_mode, remarks,
            partner1_name, partner1_amount, partner2_name, partner2_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $userId, $month, $group, $totalAmount, $incomeDate, $paymentMode, $remarks,
        $partner1Name, $partner1Amount, $partner2Name, $partner2Amount
    ]);

    respond(['ok' => true, 'item' => partner_income_row($pdo, $userId, (int) $pdo->lastInsertId())]);
}

if ($method === 'PUT') {
    $input = json_input();
    $id = require_int_id($input);

    $fields = [];
    $values = [];

    if (array_key_exists('totalAmount', $input)) {
        $fields[] = 'total_amount = ?';
        $values[] = whole_rupees($input['totalAmount']);
    }
    if (array_key_exists('incomeDate', $input)) {
        $date = trim((string) $input['incomeDate']);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $fields[] = 'income_date = ?';
            $values[] = $date;
            $fields[] = 'month_key = ?';
            $values[] = substr($date, 0, 7);
        }
    }
    if (array_key_exists('paymentMode', $input)) {
        $fields[] = 'payment_mode = ?';
        $values[] = trim((string) $input['paymentMode']);
    }
    if (array_key_exists('remarks', $input)) {
        $fields[] = 'remarks = ?';
        $values[] = str_or_null($input['remarks']);
    }
    if (array_key_exists('partner1Amount', $input)) {
        $fields[] = 'partner1_amount = ?';
        $values[] = whole_rupees($input['partner1Amount']);
    }
    if (array_key_exists('partner2Amount', $input)) {
        $fields[] = 'partner2_amount = ?';
        $values[] = whole_rupees($input['partner2Amount']);
    }

    if (!$fields) {
        respond(['ok' => false, 'message' => 'Nothing to update.'], 422);
    }

    $values[] = $id;
    $values[] = $userId;
    $stmt = $pdo->prepare('UPDATE partner_incomes SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?');
    $stmt->execute($values);

    respond(['ok' => true, 'item' => partner_income_row($pdo, $userId, $id)]);
}

if ($method === 'DELETE') {
    $input = json_input();
    $id = require_int_id($input);
    $pdo->prepare('DELETE FROM partner_incomes WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
