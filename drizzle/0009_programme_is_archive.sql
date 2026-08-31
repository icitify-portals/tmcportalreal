-- Past Activities Archive support
ALTER TABLE `programmes` ADD COLUMN `isArchive` boolean DEFAULT false AFTER `isRecurringAdmin`;
