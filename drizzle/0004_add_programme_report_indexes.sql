-- Indexes for cumulative programme reports rollup
CREATE INDEX `idx_programmes_org_start_status` ON `programmes` (`organizationId`, `startDate`, `status`);
CREATE INDEX `idx_programmes_office` ON `programmes` (`organizingOfficeId`);
CREATE INDEX `idx_programme_reports_submitted` ON `programme_reports` (`submittedAt`);
-- Optional snapshot cache for future materialization
-- CREATE TABLE `report_snapshots` (...)
