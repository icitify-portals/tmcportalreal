-- Create missing Meetings tables

CREATE TABLE IF NOT EXISTS `meetings` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `organizationId` varchar(255) NOT NULL,
  `scheduledAt` timestamp(3) NOT NULL,
  `endAt` timestamp(3) NULL DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT 0,
  `meetingLink` varchar(500) DEFAULT NULL,
  `status` enum('SCHEDULED','ONGOING','ENDED','CANCELLED') DEFAULT 'SCHEDULED',
  `createdBy` varchar(255) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `meetings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meeting_attendances` (
  `id` varchar(255) NOT NULL,
  `meetingId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `status` enum('INVITED','ACCEPTED','DECLINED','PRESENT','ABSENT') DEFAULT 'INVITED',
  `joinedAt` timestamp(3) NULL DEFAULT NULL,
  `leftAt` timestamp(3) NULL DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `meeting_attendance_unique` (`meetingId`,`userId`),
  CONSTRAINT `meeting_attendances_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_attendances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meeting_docs` (
  `id` varchar(255) NOT NULL,
  `meetingId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `type` enum('AGENDA','MINUTES','MEMBER_REPORT','OTHER') DEFAULT 'OTHER',
  `submissionStatus` enum('ON_TIME','LATE') DEFAULT 'ON_TIME',
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `meeting_docs_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_docs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
