-- fix-kharch initial schema.
-- Money values are whole rupees (INT). Month keys are 'YYYY-MM' strings.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  mobile VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  -- Links this user to a Staff-app business so their staff can be fetched.
  staff_business_id INT UNSIGNED NULL,
  cafe_name VARCHAR(150) NOT NULL DEFAULT 'My Café',
  tagline VARCHAR(200) NOT NULL DEFAULT 'Manage Fixed Expenses. Grow Your Café.',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
  default_monthly_budget INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense categories per user (the 4 defaults plus any custom ones).
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  slug VARCHAR(64) NOT NULL,          -- 'staff','emi','shop','other','cat_...'
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  icon VARCHAR(64) NOT NULL DEFAULT 'layers',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_user_slug (user_id, slug),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-user, per-month budget.
CREATE TABLE IF NOT EXISTS month_budgets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  month_key CHAR(7) NOT NULL,
  budget INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_month_budgets_user_month (user_id, month_key),
  CONSTRAINT fk_month_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Non-staff expense line items (emi, shop, other, and custom categories).
CREATE TABLE IF NOT EXISTS expense_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  month_key CHAR(7) NOT NULL,
  category VARCHAR(64) NOT NULL,      -- matches categories.slug
  name VARCHAR(200) NOT NULL,
  amount INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_expense_items_user_month_cat (user_id, month_key, category),
  CONSTRAINT fk_expense_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Manually-entered monthly amount for each Staff-app staff member.
-- Identity (name, monthly salary) comes from Staff-app and is cached here.
CREATE TABLE IF NOT EXISTS staff_amounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  month_key CHAR(7) NOT NULL,
  external_staff_id INT UNSIGNED NOT NULL,
  staff_name VARCHAR(150) NOT NULL,
  fix_amount INT UNSIGNED NOT NULL DEFAULT 0,   -- cached monthly_salary reference
  amount INT UNSIGNED NOT NULL DEFAULT 0,       -- manually filled actual expense
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_amounts_user_month_staff (user_id, month_key, external_staff_id),
  CONSTRAINT fk_staff_amounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
