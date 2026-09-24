-- Lock Meeting feature: schema defines meetings.isLocked but no migration ever created it (prod drift fix)
ALTER TABLE `meetings` ADD COLUMN `isLocked` TINYINT(1) DEFAULT 0;
