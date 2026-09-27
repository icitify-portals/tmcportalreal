-- EB window end that a locked registration price came from (null when locked price is normal/category price).
-- Used to enforce "complete part-payment before the early bird window ends".
ALTER TABLE `programme_registrations` ADD COLUMN `lockedEarlyBirdDeadline` datetime(3) NULL;
