CREATE TABLE `meeting_action_items` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `meetingId` varchar(255) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NULL,
  `assignedTo` varchar(255) NULL,
  `dueDate` datetime(3) NULL,
  `status` enum('OPEN','IN_PROGRESS','COMPLETED') DEFAULT 'OPEN',
  `createdBy` varchar(255) NOT NULL,
  `completedAt` datetime(3) NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `meeting_action_items_meeting_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_action_items_assignee_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `meeting_action_items_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`),
  INDEX `meeting_action_items_meeting_idx` (`meetingId`),
  INDEX `meeting_action_items_assignee_idx` (`assignedTo`)
);