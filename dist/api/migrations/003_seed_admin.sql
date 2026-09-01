-- Seed the single admin login (mobile 9628717175 / password "admin") and its
-- four default categories, so a freshly deployed database has a working login.
-- Idempotent: unique keys + INSERT IGNORE prevent duplicates on re-run.

INSERT IGNORE INTO users (name, mobile, password_hash, staff_business_id, cafe_name)
VALUES ('Admin', '9628717175', '$2y$12$ibUSzdT//oR98IIc6.qjYetTRiqWTewY1Y36avrOpUKJ.quqSIt2m', 1, 'My Cafe');

INSERT IGNORE INTO categories (user_id, slug, name, description, icon, is_default, is_enabled, sort_order)
SELECT u.id, x.slug, x.cname, x.descr, x.icon, 1, 1, x.ord
FROM users u
JOIN (
            SELECT 'staff' AS slug, 'Staff Kharch'   AS cname, 'Salaries & Allowances'              AS descr, 'users'    AS icon, 1 AS ord
  UNION ALL SELECT 'emi',          'Bank EMI',              'Loans & Credit Repayments',                    'landmark',        2
  UNION ALL SELECT 'shop',         'Shop Expenses',         'Rent, Light Bill, GST & Operations',           'store',           3
  UNION ALL SELECT 'other',        'Other Expenses',        'Supplies, Packaging & Maintenance',            'receipt',         4
) x
WHERE u.mobile = '9628717175';
