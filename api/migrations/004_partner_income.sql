-- 004_partner_income.sql: Partner income tracking with automatic & customizable distribution.

CREATE TABLE IF NOT EXISTS partner_incomes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  month_key CHAR(7) NOT NULL,
  partner_group VARCHAR(64) NOT NULL,
  total_amount INT UNSIGNED NOT NULL DEFAULT 0,
  income_date DATE NOT NULL,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
  remarks TEXT NULL,
  partner1_name VARCHAR(150) NOT NULL,
  partner1_amount INT UNSIGNED NOT NULL DEFAULT 0,
  partner2_name VARCHAR(150) NOT NULL,
  partner2_amount INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_partner_incomes_user_month_group (user_id, month_key, partner_group),
  KEY idx_partner_incomes_date (user_id, income_date),
  CONSTRAINT fk_partner_incomes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
