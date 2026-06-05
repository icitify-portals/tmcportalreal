ALTER TABLE `meetings` MODIFY COLUMN `frequency` enum('ONCE','WEEKLY','BI_WEEKLY','MONTHLY','CUSTOM') DEFAULT 'ONCE';--> statement-breakpoint
ALTER TABLE `programmes` MODIFY COLUMN `frequency` enum('WEEKLY','MONTHLY','QUARTERLY','BI-ANNUALLY','ANNUALLY','ONCE','CUSTOM') DEFAULT 'ONCE';--> statement-breakpoint
ALTER TABLE `meetings` ADD `rruleString` varchar(500);--> statement-breakpoint
ALTER TABLE `offices` ADD `managedSpecialCategories` json;--> statement-breakpoint
ALTER TABLE `officials` ADD `officeId` varchar(255);--> statement-breakpoint
ALTER TABLE `programmes` ADD `rruleString` varchar(500);--> statement-breakpoint
ALTER TABLE `officials` ADD CONSTRAINT `officials_officeId_offices_id_fk` FOREIGN KEY (`officeId`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;