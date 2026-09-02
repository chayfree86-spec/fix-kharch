<?php

declare(strict_types=1);

/**
 * Client for the Staff-app integration.
 * Fetches active staff for a business along with monthly attendance,
 * advance, and deductions.
 */
function staffapp_fetch_staff(int $businessId, string $month = ''): array
{
    $base = rtrim((string) ($_ENV['STAFF_APP_API_URL'] ?? ''), '/');
    $key = (string) ($_ENV['STAFF_APP_API_KEY'] ?? '');

    if ($base === '' || $key === '') {
        throw new RuntimeException('Staff-app integration is not configured (STAFF_APP_API_URL / STAFF_APP_API_KEY).');
    }

    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        $month = date('Y-m');
    }

    $url = $base . '/external/staff.php?business_id=' . rawurlencode((string) $businessId) . '&month=' . rawurlencode($month);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['X-Api-Key: ' . $key, 'Accept: application/json'],
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
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

    // Check if HTTP API already calculated attendance
    $hasAttendance = false;
    foreach ($staff as $s) {
        if (isset($s['presentDays']) && $s['presentDays'] > 0) {
            $hasAttendance = true;
            break;
        }
    }

    // Fallback: If HTTP endpoint returned basic staff without attendance, try direct DB query
    if (!$hasAttendance) {
        $pdo = get_staff_app_pdo();
        if ($pdo instanceof PDO) {
            $staff = augment_staff_with_db_attendance($pdo, $businessId, $month, $staff);
        }
    }

    return array_map(static fn(array $s): array => [
        'id' => (int) ($s['id'] ?? 0),
        'name' => (string) ($s['name'] ?? ''),
        'monthlySalary' => (int) ($s['monthlySalary'] ?? 0),
        'perDaySalary' => (int) ($s['perDaySalary'] ?? 0),
        'salaryType' => (string) ($s['salaryType'] ?? 'monthly'),
        'presentDays' => (float) ($s['presentDays'] ?? 0.0),
        'absentDays' => (int) ($s['absentDays'] ?? 0),
        'advance' => (int) ($s['advance'] ?? 0),
        'deduction' => (int) ($s['deduction'] ?? 0),
        'earnedSalary' => (int) ($s['earnedSalary'] ?? 0),
        'netPayable' => (int) ($s['netPayable'] ?? 0),
    ], $staff);
}

/**
 * Attempts to connect directly to the Staff-app database if colocated on the server.
 */
function get_staff_app_pdo(): ?PDO
{
    static $staffPdo = null;
    if ($staffPdo !== null) {
        return $staffPdo;
    }

    $candidates = [
        __DIR__ . '/../../staff/api/.env',
        __DIR__ . '/../../staff/dist/api/.env',
        __DIR__ . '/../../../Staff-app/api/.env',
        'c:/web-project/htdocs/Staff-app/api/.env',
    ];

    foreach ($candidates as $envFile) {
        if (!is_file($envFile)) {
            continue;
        }
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $env = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $k = trim($parts[0]);
                $v = trim(trim($parts[1]), '"\'');
                $env[$k] = $v;
            }
        }

        $dbName = $env['DB_NAME'] ?? '';
        if ($dbName !== '') {
            try {
                $host = $env['DB_HOST'] ?? 'localhost';
                $charset = $env['DB_CHARSET'] ?? 'utf8mb4';
                $user = $env['DB_USER'] ?? 'root';
                $pass = $env['DB_PASS'] ?? '';
                $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $dbName, $charset);
                $pdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                $pdo->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
                $pdo->exec("SET time_zone = '+05:30'");
                $staffPdo = $pdo;
                return $staffPdo;
            } catch (Throwable $e) {
                // ignore and try next
            }
        }
    }

    return null;
}

/**
 * Directly queries attendance_records, business_settings and transactions from staff DB.
 */
function augment_staff_with_db_attendance(PDO $pdo, int $businessId, string $month, array $staffList): array
{
    try {
        // 1. Business settings
        $stmtSet = $pdo->prepare('SELECT weekly_holiday_paid FROM business_settings WHERE business_id = ? LIMIT 1');
        $stmtSet->execute([$businessId]);
        $bSettings = $stmtSet->fetch() ?: [];
        $isHolidayPaid = ($bSettings['weekly_holiday_paid'] ?? 'paid') !== 'unpaid';

        // 2. Attendance records
        $stmtAtt = $pdo->prepare(
            'SELECT staff_id,
                    SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) AS p_cnt,
                    SUM(CASE WHEN status = "half_day" THEN 1 ELSE 0 END) AS h_cnt,
                    SUM(CASE WHEN status = "holiday" THEN 1 ELSE 0 END) AS hol_cnt,
                    SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) AS a_cnt
             FROM attendance_records
             WHERE business_id = ? AND attendance_date LIKE CONCAT(?, "%")
             GROUP BY staff_id'
        );
        $stmtAtt->execute([$businessId, $month]);
        $attMap = [];
        foreach ($stmtAtt->fetchAll() as $r) {
            $credited = (int)$r['p_cnt'] + ((int)$r['h_cnt'] * 0.5) + ($isHolidayPaid ? (int)$r['hol_cnt'] : 0);
            $attMap[(int)$r['staff_id']] = [
                'presentDays' => (float)$credited,
                'absentDays' => (int)$r['a_cnt'],
            ];
        }

        // 3. Transactions
        $stmtTx = $pdo->prepare(
            'SELECT staff_id,
                    SUM(CASE WHEN kind = "advance" OR kind = "advance_returned" THEN amount ELSE 0 END) AS adv,
                    SUM(CASE WHEN kind = "deduction" THEN amount ELSE 0 END) AS ded
             FROM staff_transactions
             WHERE business_id = ? AND transaction_date LIKE CONCAT(?, "%")
             GROUP BY staff_id'
        );
        $stmtTx->execute([$businessId, $month]);
        $txMap = [];
        foreach ($stmtTx->fetchAll() as $r) {
            $txMap[(int)$r['staff_id']] = [
                'advance' => (int)$r['adv'],
                'deduction' => (int)$r['ded'],
            ];
        }

        return array_map(static function (array $s) use ($attMap, $txMap): array {
            $id = (int)($s['id'] ?? 0);
            $att = $attMap[$id] ?? null;
            $tx = $txMap[$id] ?? null;

            $monthlySalary = (int)($s['monthlySalary'] ?? 0);
            $perDaySalary = (int)($s['perDaySalary'] ?? 0);
            $presentDays = (float)($att['presentDays'] ?? ($s['presentDays'] ?? 0.0));
            $absentDays = (int)($att['absentDays'] ?? ($s['absentDays'] ?? 0));
            $advance = (int)($tx['advance'] ?? ($s['advance'] ?? 0));
            $deduction = (int)($tx['deduction'] ?? ($s['deduction'] ?? 0));

            $earnedSalary = (int)round($presentDays * $perDaySalary);
            $netPayable = max(0, $earnedSalary - $advance - $deduction);

            return array_merge($s, [
                'presentDays' => $presentDays,
                'absentDays' => $absentDays,
                'advance' => $advance,
                'deduction' => $deduction,
                'earnedSalary' => $earnedSalary,
                'netPayable' => $netPayable,
            ]);
        }, $staffList);
    } catch (Throwable $e) {
        error_log('augment_staff_with_db_attendance error: ' . $e->getMessage());
        return $staffList;
    }
}
