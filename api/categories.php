<?php

require_once __DIR__ . '/_bootstrap.php';

$userId = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function category_row(PDO $pdo, int $userId, string $slug): ?array
{
    $stmt = $pdo->prepare(
        'SELECT slug, name, description, icon, is_default, is_enabled, sort_order
         FROM categories WHERE user_id = ? AND slug = ? LIMIT 1'
    );
    $stmt->execute([$userId, $slug]);
    $c = $stmt->fetch();
    if (!$c) {
        return null;
    }
    return [
        'id' => $c['slug'],
        'name' => $c['name'],
        'description' => $c['description'],
        'icon' => $c['icon'],
        'isDefault' => (bool) $c['is_default'],
        'isEnabled' => (bool) $c['is_enabled'],
        'order' => (int) $c['sort_order'],
    ];
}

if ($method === 'GET') {
    $data = load_bootstrap_data($pdo, $userId);
    respond(['ok' => true, 'categories' => $data['categories']]);
}

if ($method === 'POST') {
    $input = json_input();
    $name = trim((string) ($input['name'] ?? ''));
    if ($name === '') {
        respond(['ok' => false, 'message' => 'Category name is required.'], 422);
    }
    $icon = trim((string) ($input['icon'] ?? 'layers')) ?: 'layers';
    $description = str_or_null($input['description'] ?? null);
    $slug = 'cat_' . bin2hex(random_bytes(5));

    $maxOrder = (int) $pdo->query(
        'SELECT COALESCE(MAX(sort_order), 0) FROM categories WHERE user_id = ' . $userId
    )->fetchColumn();

    $stmt = $pdo->prepare(
        'INSERT INTO categories (user_id, slug, name, description, icon, is_default, is_enabled, sort_order)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?)'
    );
    $stmt->execute([$userId, $slug, $name, $description, $icon, $maxOrder + 1]);

    respond(['ok' => true, 'category' => category_row($pdo, $userId, $slug)]);
}

if ($method === 'PUT') {
    $input = json_input();
    $slug = trim((string) ($input['id'] ?? ''));
    if ($slug === '') {
        respond(['ok' => false, 'message' => 'Category id is required.'], 422);
    }

    $fields = [];
    $values = [];
    if (array_key_exists('name', $input)) {
        $fields[] = 'name = ?';
        $values[] = trim((string) $input['name']);
    }
    if (array_key_exists('description', $input)) {
        $fields[] = 'description = ?';
        $values[] = str_or_null($input['description']);
    }
    if (array_key_exists('icon', $input)) {
        $fields[] = 'icon = ?';
        $values[] = trim((string) $input['icon']) ?: 'layers';
    }
    if (array_key_exists('isEnabled', $input)) {
        $fields[] = 'is_enabled = ?';
        $values[] = $input['isEnabled'] ? 1 : 0;
    }
    if (!$fields) {
        respond(['ok' => false, 'message' => 'Nothing to update.'], 422);
    }

    $values[] = $userId;
    $values[] = $slug;
    $stmt = $pdo->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE user_id = ? AND slug = ?');
    $stmt->execute($values);

    respond(['ok' => true, 'category' => category_row($pdo, $userId, $slug)]);
}

if ($method === 'DELETE') {
    $input = json_input();
    $slug = trim((string) ($input['id'] ?? ''));
    if ($slug === '') {
        respond(['ok' => false, 'message' => 'Category id is required.'], 422);
    }

    $pdo->beginTransaction();
    try {
        // Remove the category's line items for every month, then the category.
        $pdo->prepare('DELETE FROM expense_items WHERE user_id = ? AND category = ?')
            ->execute([$userId, $slug]);
        $pdo->prepare('DELETE FROM categories WHERE user_id = ? AND slug = ?')
            ->execute([$userId, $slug]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
