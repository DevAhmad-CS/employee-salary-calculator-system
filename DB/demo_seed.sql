-- Safe demo data for public GitHub / live demos (fictional Jordanian-style records).
-- Apply only after DB/schema.sql on an empty database.
-- Demo login (all accounts): username below, password: Demo123!
-- Password hash is freshly generated for this file (not copied from any real dump).

BEGIN;

-- Employees (fake names, example.com emails, fictional 0790xxxxxx-style mobiles)
INSERT INTO public.employees (id, full_name, email, phone, department, "position", hire_date, basic_salary, status) VALUES
(1, 'Ahmad Al-Khatib', 'ahmad.demo@example.com', '0790011001', 'Information Technology', 'Software Engineer', '2022-03-01', 1850.00, 'Active'),
(2, 'Sara Al-Nuaimi', 'sara.hr@example.com', '0790022002', 'Human Resources', 'HR Specialist', '2021-05-15', 1650.00, 'Active'),
(3, 'Khaled Al-Zoubi', 'khaled.finance@example.com', '0790033003', 'Finance', 'Senior Accountant', '2020-11-01', 2100.00, 'Active'),
(4, 'Lina Haddad', 'lina.ops@example.com', '0790044004', 'Operations', 'Operations Officer', '2023-01-20', 1400.00, 'Active'),
(5, 'Omar Al-Sharif', 'omar.sales@example.com', '0790055005', 'Sales', 'Sales Executive', '2022-08-10', 1550.00, 'Active');

-- Users (same password hash for every demo user: Demo123!)
INSERT INTO public.users (id, username, password_hash, role, employee_id) VALUES
(1, 'demo_admin', '$2b$10$T2A8LKAJ3sRGi6e63ycMUuzinronHfrK/zqaQxnal/aIxcW7tLbtK', 'Admin', 1),
(2, 'demo_hr', '$2b$10$T2A8LKAJ3sRGi6e63ycMUuzinronHfrK/zqaQxnal/aIxcW7tLbtK', 'HR', 2),
(3, 'demo_accountant', '$2b$10$T2A8LKAJ3sRGi6e63ycMUuzinronHfrK/zqaQxnal/aIxcW7tLbtK', 'Accountant', 3),
(4, 'demo_management', '$2b$10$T2A8LKAJ3sRGi6e63ycMUuzinronHfrK/zqaQxnal/aIxcW7tLbtK', 'Management', NULL),
(5, 'demo_employee', '$2b$10$T2A8LKAJ3sRGi6e63ycMUuzinronHfrK/zqaQxnal/aIxcW7tLbtK', 'Employee', 5);

INSERT INTO public.allowances (id, employee_id, type, amount, effective_from) VALUES
(1, 1, 'Housing', 250.00, '2025-06-01'),
(2, 1, 'Transportation', 120.00, '2025-06-01'),
(3, 2, 'Transportation', 100.00, '2025-01-01'),
(4, 3, 'Housing', 280.00, '2024-09-01'),
(5, 4, 'Communication', 55.00, '2025-03-01'),
(6, 5, 'Field Allowance', 200.00, '2025-11-01');

INSERT INTO public.deductions (id, employee_id, type, amount, effective_from) VALUES
(1, 1, 'Income Tax', 195.00, '2025-06-01'),
(2, 1, 'Social Security', 95.00, '2025-06-01'),
(3, 2, 'Income Tax', 170.00, '2025-01-01'),
(4, 2, 'Social Security', 85.00, '2025-01-01'),
(5, 3, 'Income Tax', 240.00, '2024-09-01'),
(6, 3, 'Social Security', 115.00, '2024-09-01'),
(7, 4, 'Income Tax', 105.00, '2025-03-01'),
(8, 4, 'Social Security', 52.00, '2025-03-01'),
(9, 5, 'Income Tax', 125.00, '2025-11-01'),
(10, 5, 'Social Security', 62.00, '2025-11-01');

INSERT INTO public.bonuses (id, employee_id, type, amount, awarded_date, description) VALUES
(1, 1, 'Performance', 175.00, '2026-01-15', 'Q4 review — fictional'),
(2, 5, 'Sales Incentive', 220.00, '2025-12-20', 'December targets — fictional');

-- Net = basic + allowances + bonus - deductions (approximate slip totals)
INSERT INTO public.salary_slips (id, employee_id, month, year, basic_salary, total_allowances, total_bonus, total_deductions, net_salary, generated_by) VALUES
(1, 1, 12, 2025, 1850.00, 370.00, 0.00, 290.00, 1930.00, 1),
(2, 2, 12, 2025, 1650.00, 100.00, 0.00, 255.00, 1495.00, 1),
(3, 3, 1, 2026, 2100.00, 280.00, 0.00, 355.00, 2025.00, 1),
(4, 5, 1, 2026, 1550.00, 200.00, 220.00, 187.00, 1783.00, 1);

INSERT INTO public.reports (id, type, period, total_employees, total_salaries, average_salary, generated_by) VALUES
(1, 'monthly', '2026-01', 5, 9050.00, 1810.00, 1);

SELECT pg_catalog.setval('public.employees_id_seq', 5, true);
SELECT pg_catalog.setval('public.users_id_seq', 5, true);
SELECT pg_catalog.setval('public.allowances_id_seq', 6, true);
SELECT pg_catalog.setval('public.deductions_id_seq', 10, true);
SELECT pg_catalog.setval('public.bonuses_id_seq', 2, true);
SELECT pg_catalog.setval('public.salary_slips_id_seq', 4, true);
SELECT pg_catalog.setval('public.reports_id_seq', 1, true);

COMMIT;
