-- Isolated Contest Module (Quran/Debate/Written) with Payment + Real-time
ALTER TABLE `payments` MODIFY COLUMN `paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','LEVY','CONTEST_FEE','OTHER') NOT NULL;
--> statement-breakpoint
CREATE TABLE `contest_events` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('QURAN','DEBATE','WRITTEN','OTHER') NOT NULL,
	`format` enum('PHYSICAL','VIRTUAL','HYBRID') DEFAULT 'PHYSICAL',
	`year` int NOT NULL,
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`status` enum('DRAFT','OPEN','ONGOING','CLOSED','COMPLETED') DEFAULT 'DRAFT',
	`rruleString` varchar(500),
	`seriesId` varchar(255),
	`targetAudience` enum('PUBLIC','MEMBERS','BROTHERS','SISTERS','CHILDREN','YOUTH','ELDERS') DEFAULT 'PUBLIC',
	`paymentRequired` boolean DEFAULT false,
	`amount` decimal(10,2) DEFAULT '0.00',
	`earlyBirdAmount` decimal(10,2),
	`earlyBirdDeadline` datetime(3),
	`allowInstallments` boolean DEFAULT false,
	`minInstallmentAmount` decimal(10,2) DEFAULT '0.00',
	`hasCertificate` boolean DEFAULT false,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_events_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `contest_events_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_phases` (
	`id` varchar(255) NOT NULL,
	`contestId` varchar(255) NOT NULL,
	`phaseNo` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('PRELIM','SEMI','FINAL') NOT NULL,
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`organizationId` varchar(255),
	`venue` varchar(255),
	`startAt` datetime(3),
	`endAt` datetime(3),
	`status` enum('SCHEDULED','ONGOING','COMPLETED') DEFAULT 'SCHEDULED',
	`meetingId` varchar(255),
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_phases_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_phases_contestId_contest_events_id_fk` FOREIGN KEY (`contestId`) REFERENCES `contest_events`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_representatives` (
	`id` varchar(255) NOT NULL,
	`contestId` varchar(255) NOT NULL,
	`phaseId` varchar(255),
	`organizationId` varchar(255) NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`participantUserId` varchar(255),
	`category` varchar(100),
	`status` enum('REGISTERED','CALLED','DISQUALIFIED','PROMOTED','PAID') DEFAULT 'REGISTERED',
	`lockedAmount` decimal(10,2),
	`paymentStatus` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
	`paymentRef` varchar(255),
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_representatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contest_timetable` (
	`id` varchar(255) NOT NULL,
	`phaseId` varchar(255) NOT NULL,
	`participantId` varchar(255) NOT NULL,
	`slotOrder` int NOT NULL,
	`scheduledAt` datetime(3),
	`durationMin` int DEFAULT 5,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_timetable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contest_calls` (
	`id` varchar(255) NOT NULL,
	`phaseId` varchar(255) NOT NULL,
	`participantId` varchar(255) NOT NULL,
	`queueOrder` int NOT NULL,
	`status` enum('QUEUED','CALLED','GRADING','COMPLETED') DEFAULT 'QUEUED',
	`liveRoomId` varchar(255),
	`calledAt` datetime(3),
	`completedAt` datetime(3),
	`calledBy` varchar(255),
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contest_scores` (
	`id` varchar(255) NOT NULL,
	`callId` varchar(255) NOT NULL,
	`judgeId` varchar(255) NOT NULL,
	`criteria` json NOT NULL,
	`total` int NOT NULL,
	`comment` text,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_scores_call_judge_unique` UNIQUE(`callId`,`judgeId`)
);
--> statement-breakpoint
CREATE TABLE `contest_results` (
	`id` varchar(255) NOT NULL,
	`phaseId` varchar(255) NOT NULL,
	`participantId` varchar(255) NOT NULL,
	`totalScore` int NOT NULL,
	`avgScore` decimal(5,2) NOT NULL,
	`rank` int NOT NULL,
	`promoted` boolean DEFAULT false,
	`decidedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contest_written` (
	`id` varchar(255) NOT NULL,
	`phaseId` varchar(255) NOT NULL,
	`participantId` varchar(255) NOT NULL,
	`prompt` text,
	`answer` json,
	`html` text,
	`plainText` text,
	`submittedAt` datetime(3),
	`timeSpentSec` int DEFAULT 0,
	`status` enum('DRAFT','SUBMITTED') DEFAULT 'DRAFT',
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_written_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contest_payments` (
	`id` varchar(255) NOT NULL,
	`representativeId` varchar(255) NOT NULL,
	`paymentId` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_payments_id` PRIMARY KEY(`id`)
);
