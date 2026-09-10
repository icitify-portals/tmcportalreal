-- Add recurrenceType / weekDay / weekOrdinal for proper weekday-based monthly recurrence
ALTER TABLE `programmes`
  ADD COLUMN `recurrence_type` enum('BY_DATE','BY_DAY_OF_WEEK') DEFAULT 'BY_DATE' AFTER `isArchive`,
  ADD COLUMN `weekDay` int AFTER `recurrence_type`,
  ADD COLUMN `weekOrdinal` int AFTER `weekDay`;