<?php

declare(strict_types=1);

/**
 * Client for the Staff-app external API. Fetches the active staff for a
 * business over HTTP, authenticated with the shared API key from .env.
 *
 * @return array<int, array{id:int,name:string,monthlySalary:int,perDaySalary:int,salaryType:string}>
 * @throws RuntimeException when the Staff-app is unreachable or returns an error.
 */
function staffapp_fetch_staff(int $businessId): array
{
    $base = rtrim((string) ($_ENV['STAFF_APP_API_URL'] ?? ''), '/');
    $key = (string) ($_ENV['STAFF_APP_API_KEY'] ?? '');

    if ($base === '' || $key === '') {
        throw new RuntimeException('Staff-app integration is not configured (STAFF_APP_API_URL / STAFF_APP_API_KEY).');
    }

    $url = $base . '/external/staff.php?business_id=' . rawurlencode((string) $businessId);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['X-Api-Key: ' . $key, 'Accept: application/json'],
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 15,
        // Windows/XAMPP cURL often stalls on IPv6 DNS; force IPv4.
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException('Could not reach Staff-app: ' . $error);
    }

    $json = json_decode((string) $body, true);
    if ($status !== 200 || !is_array($json) || empty($json['ok'])) {
        $msg = is_array($json) ? (string) ($json['message'] ?? '') : '';
        throw new RuntimeException('Staff-app returned an error' . ($msg !== '' ? ": {$msg}" : " (HTTP {$status})"));
    }

    $staff = is_array($json['staff'] ?? null) ? $json['staff'] : [];
    return array_map(static fn(array $s): array => [
        'id' => (int) ($s['id'] ?? 0),
        'name' => (string) ($s['name'] ?? ''),
        'monthlySalary' => (int) ($s['monthlySalary'] ?? 0),
        'perDaySalary' => (int) ($s['perDaySalary'] ?? 0),
        'salaryType' => (string) ($s['salaryType'] ?? 'monthly'),
    ], $staff);
}
