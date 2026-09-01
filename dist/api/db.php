<?php

declare(strict_types=1);

/**
 * Returns a shared PDO connection to the fix_spend database.
 *
 * Works in both environments:
 *  - Production/shared hosting: connects straight to the pre-created database
 *    (where the DB user has no CREATE DATABASE privilege).
 *  - Local/dev: if the database does not exist yet, it is created on the fly.
 *
 * Pending migrations in api/migrations are applied on first use in either case,
 * so schema changes roll out automatically on the server too.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $dbName = $config['db_name'];
    $charset = $config['db_charset'];

    try {
        // Preferred path — connect directly to the named database. This is the
        // only path that works on shared hosting where the DB already exists.
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $config['db_host'], $dbName, $charset);
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], $options);
    } catch (PDOException $e) {
        // Only fall back to creating the database when it genuinely does not
        // exist (MySQL error 1049). Any other failure — wrong credentials, host
        // unreachable — is re-thrown so it is not silently masked.
        $isUnknownDb = $e->getCode() === '1049'
            || stripos($e->getMessage(), 'Unknown database') !== false;
        if (!$isUnknownDb) {
            throw $e;
        }

        $serverDsn = sprintf('mysql:host=%s;charset=%s', $config['db_host'], $charset);
        $pdo = new PDO($serverDsn, $config['db_user'], $config['db_pass'], $options);
        $pdo->exec(
            "CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
        $pdo->exec("USE `{$dbName}`");
    }

    $pdo->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    $pdo->exec("SET time_zone = '+05:30'");

    run_auto_migrations($pdo);

    return $pdo;
}

/**
 * Applies any *.sql files in api/migrations that have not run yet, tracked in
 * a schema_migrations table. Files are ordered by the leading digits in their
 * name (001_, 002_, ...).
 */
function run_auto_migrations(PDO $pdo): void
{
    static $migrationsRun = false;
    if ($migrationsRun) {
        return;
    }
    $migrationsRun = true;

    $migrationsDir = __DIR__ . '/migrations';
    if (!is_dir($migrationsDir)) {
        return;
    }

    $files = glob($migrationsDir . '/*.sql') ?: [];
    if (!$files) {
        return;
    }
    sort($files);

    // Serialize migrations across concurrent requests so two processes never
    // apply the same file at once on a busy server. Wait up to 15s for another
    // process to finish; if the lock can't be acquired, bail rather than risk a
    // half-applied schema — the next request will complete it.
    $locked = (int) $pdo->query("SELECT GET_LOCK('fix_spend_migrations', 15)")->fetchColumn();
    if ($locked !== 1) {
        return;
    }

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(50) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Read applied versions *while holding the lock* so migrations another
        // process just finished are seen and skipped.
        $applied = $pdo->query("SELECT version FROM schema_migrations")->fetchAll(PDO::FETCH_COLUMN);

        foreach ($files as $file) {
            $filename = basename($file);
            if (!preg_match('/^(\d+)/', $filename, $m)) {
                continue;
            }
            $version = $m[1];
            if (in_array($version, $applied, true)) {
                continue;
            }

            $sql = file_get_contents($file);
            if ($sql === false) {
                continue;
            }
            // Strip any `USE db;` lines so the migration runs on the selected DB.
            $sql = preg_replace('/^\s*USE\s+\w+;\s*$/im', '', $sql);

            try {
                $pdo->exec($sql);
                $name = preg_replace('/^\d+_(.+)\.sql$/', '$1', $filename);
                $stmt = $pdo->prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)");
                $stmt->execute([$version, $name]);
            } catch (PDOException $e) {
                error_log("fix-kharch migration failed on {$version}: " . $e->getMessage());
                throw new RuntimeException("Database migration failed on {$version}: " . $e->getMessage());
            }
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('fix_spend_migrations')");
    }
}
