<?php

declare(strict_types=1);

/** Decode the JSON request body into an array (empty array if none/invalid). */
function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Send a JSON response and stop. */
function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Ensure the request is a POST, else 405. */
function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
}

/** Return the logged-in user id, or 401 if there is no active session. */
function require_user(): int
{
    if (empty($_SESSION['user_id'])) {
        respond(['ok' => false, 'message' => 'Not authenticated.'], 401);
    }
    return (int) $_SESSION['user_id'];
}

/** Money is stored as whole rupees; coerce any numeric input to an int >= 0. */
function whole_rupees(mixed $amount): int
{
    return max(0, (int) round((float) $amount));
}

/** Validate a "YYYY-MM" month key, or 422. */
function require_month_key(mixed $value): string
{
    $value = trim((string) $value);
    if (!preg_match('/^\d{4}-\d{2}$/', $value)) {
        respond(['ok' => false, 'message' => 'Valid month (YYYY-MM) is required.'], 422);
    }
    return $value;
}

/** Validate a numeric id the frontend sent back (rejects temp/non-numeric). */
function require_int_id(array $input, string $key = 'id'): int
{
    $raw = $input[$key] ?? null;
    $id = (int) $raw;
    if ($id <= 0 || (string) $id !== trim((string) $raw)) {
        respond(['ok' => false, 'message' => 'Valid numeric id is required.'], 422);
    }
    return $id;
}

/** Trim to string, or null when empty. */
function str_or_null(mixed $value): ?string
{
    $value = trim((string) ($value ?? ''));
    return $value === '' ? null : $value;
}

/**
 * The bootstrap payload returned after login/register/me: the user's profile
 * settings plus their expense categories. Month data is fetched on demand.
 */
function load_bootstrap_data(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT cafe_name, tagline, currency_symbol, default_monthly_budget, staff_business_id
         FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $u = $stmt->fetch() ?: [];

    $stmt = $pdo->prepare(
        'SELECT slug, name, description, icon, is_default, is_enabled, sort_order
         FROM categories WHERE user_id = ? ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([$userId]);
    $categories = array_map(static fn(array $c): array => [
        'id' => $c['slug'],
        'name' => $c['name'],
        'description' => $c['description'],
        'icon' => $c['icon'],
        'isDefault' => (bool) $c['is_default'],
        'isEnabled' => (bool) $c['is_enabled'],
        'order' => (int) $c['sort_order'],
    ], $stmt->fetchAll());

    return [
        'settings' => [
            'cafeName' => $u['cafe_name'] ?? 'My Café',
            'tagline' => $u['tagline'] ?? '',
            'currencySymbol' => $u['currency_symbol'] ?? '₹',
            'defaultMonthlyBudget' => (int) ($u['default_monthly_budget'] ?? 0),
            'staffBusinessId' => $u['staff_business_id'] !== null ? (int) $u['staff_business_id'] : null,
        ],
        'categories' => $categories,
    ];
}

/** The four categories every new user starts with. */
function default_categories(): array
{
    return [
        ['staff', 'Staff Kharch', 'Salaries & Allowances', 'users', 1],
        ['emi', 'Bank EMI', 'Loans & Credit Repayments', 'landmark', 2],
        ['shop', 'Shop Expenses', 'Rent, Light Bill, GST & Operations', 'store', 3],
        ['other', 'Other Expenses', 'Supplies, Packaging & Maintenance', 'receipt', 4],
    ];
}
