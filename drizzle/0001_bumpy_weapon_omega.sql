ALTER TABLE `constitution_feedback` ADD `constitutionFeedbackLevel` enum('MEMBER','LGA_COLLATION','STATE_COLLATION','NATIONAL_COLLATION') DEFAULT 'MEMBER';--> statement-breakpoint
ALTER TABLE `constitution_feedback` ADD `memberId` varchar(255);--> statement-breakpoint
ALTER TABLE `constitution_feedback` ADD `jurisdictionBranchId` varchar(255);--> statement-breakpoint
ALTER TABLE `constitution_feedback` ADD `jurisdictionLgaId` varchar(255);--> statement-breakpoint
ALTER TABLE `constitution_feedback` ADD `jurisdictionStateId` varchar(255);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `branchReviewStartDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `branchReviewEndDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `lgaReviewStartDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `lgaReviewEndDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `stateReviewStartDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `stateReviewEndDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `nationalReviewStartDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `constitutions` ADD `nationalReviewEndDate` timestamp(3);--> statement-breakpoint
ALTER TABLE `meeting_groups` ADD `dynamicRules` json;--> statement-breakpoint
ALTER TABLE `meetings` ADD `programmeId` varchar(255);--> statement-breakpoint
ALTER TABLE `meetings` ADD `staticAttendanceToken` varchar(255);--> statement-breakpoint
ALTER TABLE `meetings` ADD `attendanceWindow` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `meetings` ADD `meetingTargetAudience` enum('OFFICIALS_ONLY','ALL_MEMBERS_JURISDICTION','ALL_MEMBERS_GLOBAL') DEFAULT 'ALL_MEMBERS_JURISDICTION';--> statement-breakpoint
ALTER TABLE `meetings` ADD `shareCode` varchar(100);--> statement-breakpoint
ALTER TABLE `meetings` ADD `recordingShareCode` varchar(100);--> statement-breakpoint
ALTER TABLE `meetings` ADD `egressId` varchar(255);--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_shareCode_unique` UNIQUE(`shareCode`);--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_recordingShareCode_unique` UNIQUE(`recordingShareCode`);