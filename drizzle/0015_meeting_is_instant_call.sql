-- Instant call flag: ephemeral ad-hoc meetings that auto-expire at endAt
ALTER TABLE `meetings` ADD COLUMN `isInstantCall` TINYINT(1) DEFAULT 0;
