ALTER TABLE `meetings` DROP INDEX `meetings_shareCode_unique`;--> statement-breakpoint
ALTER TABLE `meetings` DROP INDEX `meetings_recordingShareCode_unique`;--> statement-breakpoint
ALTER TABLE `meetings` ADD `seriesId` varchar(255);--> statement-breakpoint
ALTER TABLE `meetings` ADD `frequency` enum('ONCE','WEEKLY','BI_WEEKLY','MONTHLY') DEFAULT 'ONCE';