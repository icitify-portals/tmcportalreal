-- Schema-drift fix: drizzle derives MySQL column names from the mysqlEnum() type name,
-- but these tables were created with a plain `status` column. Rename to match code.
ALTER TABLE `bulk_registration_groups` RENAME COLUMN `status` TO `bulk_status`;
ALTER TABLE `programme_sponsorship_pools` RENAME COLUMN `status` TO `sponsorship_status`;
