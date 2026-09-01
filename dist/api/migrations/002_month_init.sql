-- Tracks which months have already been initialized (carry-forward seeding),
-- so an empty month is seeded from the previous month exactly once and a user
-- who intentionally clears a month does not get it re-populated.

CREATE TABLE IF NOT EXISTS month_init (
  user_id INT UNSIGNED NOT NULL,
  month_key CHAR(7) NOT NULL,
  seeded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, month_key),
  CONSTRAINT fk_month_init_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
