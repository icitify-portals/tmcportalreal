CREATE TABLE `broadcasts` (
	`id` varchar(255) NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`media` json,
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`targetId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_assignments` (
	`id` varchar(255) NOT NULL,
	`feeId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`status` enum('PENDING','PAID') DEFAULT 'PENDING',
	`amountPaid` decimal(10,2) DEFAULT '0.00',
	`paidAt` timestamp(3),
	`paymentId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `fee_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fees` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`amount` decimal(10,2) NOT NULL,
	`feeTarget` enum('ALL_MEMBERS','OFFICIALS') NOT NULL,
	`dueDate` timestamp(3),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `special_programme_files` (
	`id` varchar(255) NOT NULL,
	`programmeId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`specialProgrammeFileType` enum('AUDIO','VIDEO','DOCUMENT','OTHER') NOT NULL,
	`order` int DEFAULT 0,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `special_programme_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `special_programmes` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`specialProgrammeCategory` enum('TESKIYAH_WORKSHOP','FRIDAY_KHUTHBAH','PRESS_RELEASE','STATE_OF_THE_NATION','OTHER') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`summary` text,
	`year` int NOT NULL,
	`date` timestamp(3),
	`imageUrl` varchar(500),
	`isPublished` boolean DEFAULT true,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `special_programmes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `members` MODIFY COLUMN `status` enum('PENDING','RECOMMENDED','ACTIVE','SUSPENDED','EXPIRED','INACTIVE','REJECTED') DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','LEVY','OTHER') NOT NULL;--> statement-breakpoint
ALTER TABLE `programmes` MODIFY COLUMN `level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `paystackSubaccountCode` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `bankName` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `accountNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `bankCode` varchar(255);--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_feeId_fees_id_fk` FOREIGN KEY (`feeId`) REFERENCES `fees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fees` ADD CONSTRAINT `fees_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programme_files` ADD CONSTRAINT `special_programme_files_programmeId_special_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `special_programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programmes` ADD CONSTRAINT `special_programmes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programmes` ADD CONSTRAINT `special_programmes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;