<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function expense_row(PDO $pdo, int $userId, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, month_key, category, name, amount, notes
         FROM expense_items WHERE id = ? AND user_id = ? LIMIT 1'
    );
    $stmt->execute([$id, $userId]);
    $r = $stmt->fetch();
    if (!$r) {
        return null;
    }
    return [
        'id' => (string) $r['id'],
        'monthKey' => $r['month_key'],
        'category' => $r['category'],
        'name' => $r['name'],
        'amount' => (int) $r['amount'],
        'notes' => $r['notes'],
    ];
}

/**
 * Auto carry-forward: the first time an empty month is opened, copy the fixed
 * expense items (EMI / shop / other / custom) from the most recent earlier
 * month that has any. Runs exactly once per month (guarded by month_init) and
 * never touches a month that already has data. Staff amounts are NOT carried.
 */
function carry_forward_if_new(PDO $pdo, int $userId, string $month): void
{
    // Claim initialization atomically — only the row that actually inserts seeds.
    $ins = $pdo->prepare('INSERT IGNORE INTO month_init (user_id, month_key) VALUES (?, ?)');
    $ins->execute([$userId, $month]);
    if ($ins->rowCount() !== 1) {
        return; // already initialized (or a concurrent request won the race)
    }

    // Never seed a month that already has its own items.
    $cnt = $pdo->prepare('SELECT COUNT(*) FROM expense_items WHERE user_id = ? AND month_key = ?');
    $cnt->execute([$userId, $month]);
    if ((int) $cnt->fetchColumn() > 0) {
        return;
    }

    // Most recent earlier month that has items (YYYY-MM sorts chronologically).
    $prev = $pdo->prepare(
        'SELECT month_key FROM expense_items WHERE user_id = ? AND month_key < ?
         ORDER BY month_key DESC LIMIT 1'
    );
    $prev->execute([$userId, $month]);
    $prevMonth = $prev->fetchColumn();
    if (!$prevMonth) {
        return; // nothing earlier to copy from
    }

    $copy = $pdo->prepare(
        'INSERT INTO expense_items (user_id, month_key, category, name, amount, notes)
         SELECT user_id, ?, category, name, amount, notes
         FROM expense_items WHERE user_id = ? AND month_key = ?'
    );
    $copy->execute([$month, $userId, $prevMonth]);
}

// GET ?month=YYYY-MM[&category=slug] -> line items for that month.
if ($method === 'GET') {
    $month = require_month_key($_GET['month'] ?? '');
    $category = str_or_null($_GET['category'] ?? null);

    carry_forward_if_new($pdo, $userId, $month);

    $sql = 'SELECT id, category, name, amount, notes FROM expense_items WHERE user_id = ? AND month_key = ?';
    $params = [$userId, $month];
    if ($category !== null) {
        $sql .= ' AND category = ?';
        $params[] = $category;
    }
    $sql .= ' ORDER BY id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $items = array_map(static fn(array $r): array => [
        'id' => (string) $r['id'],
        'category' => $r['category'],
        'name' => $r['name'],
        'amount' => (int) $r['amount'],
        'notes' => $r['notes'],
    ], $stmt->fetchAll());

    respond(['ok' => true, 'month' => $month, 'items' => $items]);
}

if ($method === 'POST') {
    $input = json_input();
    $month = require_month_key($input['month'] ?? '');
    $category = trim((string) ($input['category'] ?? ''));
    $name = trim((string) ($input['name'] ?? ''));
    if ($category === '' || $category === 'staff') {
        respond(['ok' => false, 'message' => 'Valid category is required (staff is managed separately).'], 422);
    }
    if ($name === '') {
        respond(['ok' => false, 'message' => 'Name is required.'], 422);
    }
    $amount = whole_rupees($input['amount'] ?? 0);
    $notes = str_or_null($input['notes'] ?? null);

    $stmt = $pdo->prepare(
        'INSERT INTO expense_items (user_id, month_key, category, name, amount, notes)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $month, $category, $name, $amount, $notes]);

    respond(['ok' => true, 'item' => expense_row($pdo, $userId, (int) $pdo->lastInsertId())]);
}

if ($method === 'PUT') {
    $input = json_input();
    $id = require_int_id($input);

    $fields = [];
    $values = [];
    if (array_key_exists('name', $input)) {
        $fields[] = 'name = ?';
        $values[] = trim((string) $input['name']);
    }
    if (array_key_exists('amount', $input)) {
        $fields[] = 'amount = ?';
        $values[] = whole_rupees($input['amount']);
    }
    if (array_key_exists('notes', $input)) {
        $fields[] = 'notes = ?';
        $values[] = str_or_null($input['notes']);
    }
    if (!$fields) {
        respond(['ok' => false, 'message' => 'Nothing to update.'], 422);
    }

    $values[] = $id;
    $values[] = $userId;
    $stmt = $pdo->prepare('UPDATE expense_items SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?');
    $stmt->execute($values);

    respond(['ok' => true, 'item' => expense_row($pdo, $userId, $id)]);
}

if ($method === 'DELETE') {
    $input = json_input();
    $id = require_int_id($input);
    $pdo->prepare('DELETE FROM expense_items WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
