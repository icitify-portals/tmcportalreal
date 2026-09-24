-- Anonymous guest joins via share link (headcount log, no user account required)
CREATE TABLE `meeting_guest_attendances` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `meetingId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `joinedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `meeting_guest_attendance_meeting_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE,
  INDEX `meeting_guest_attendance_meeting_idx` (`meetingId`)
);
