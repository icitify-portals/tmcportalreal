-- Early bird pricing + locked amount
ALTER TABLE `programmes` ADD COLUMN `earlyBirdAmount` DECIMAL(10,2) NULL AFTER `amount`;
ALTER TABLE `programmes` ADD COLUMN `earlyBirdDeadline` DATETIME(3) NULL AFTER `earlyBirdAmount`;
ALTER TABLE `programme_registrations` ADD COLUMN `lockedAmount` DECIMAL(10,2) NULL AFTER `checkInWaiver`;
