-- Meeting Notes OneNote-like + Office rollup already in 0005
CREATE TABLE `meeting_notes` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `meetingId` varchar(255) NULL,
  `programmeId` varchar(255) NULL,
  `title` varchar(255) NOT NULL,
  `section` enum('GENERAL','AGENDA','MINUTES','DECISIONS','ACTIONS','FOLLOW_UP') DEFAULT 'GENERAL',
  `content` json NULL,
  `html` text NULL,
  `plainText` text NULL,
  `createdBy` varchar(255) NOT NULL,
  `updatedBy` varchar(255) NULL,
  `isShared` tinyint(1) DEFAULT 0,
  `version` int DEFAULT 1,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `meeting_notes_meetingId_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_notes_programmeId_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE CASCADE,
  INDEX `meeting_notes_meeting_idx` (`meetingId`),
  INDEX `meeting_notes_programme_idx` (`programmeId`)
);
CREATE TABLE `meeting_note_versions` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `noteId` varchar(255) NOT NULL,
  `content` json NULL,
  `html` text NULL,
  `version` int NOT NULL,
  `createdBy` varchar(255) NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `meeting_note_versions_noteId_fk` FOREIGN KEY (`noteId`) REFERENCES `meeting_notes`(`id`) ON DELETE CASCADE,
  INDEX `meeting_note_versions_note_idx` (`noteId`)
);
