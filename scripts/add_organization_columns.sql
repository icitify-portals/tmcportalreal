ALTER TABLE organizations ADD COLUMN IF NOT EXISTS planningDeadlineMonth INT DEFAULT 12;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS planningDeadlineDay INT DEFAULT 12;
