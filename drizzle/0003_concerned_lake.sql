CREATE TABLE `asset_maintenance_logs` (
	`id` varchar(255) NOT NULL,
	`assetId` varchar(255) NOT NULL,
	`maintenanceType` enum('REPAIR','SERVICE','INSPECTION','UPGRADE') NOT NULL,
	`description` text NOT NULL,
	`cost` decimal(15,2) DEFAULT '0.00',
	`date` timestamp(3) NOT NULL,
	`performedBy` varchar(255),
	`nextServiceDate` timestamp(3),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `asset_maintenance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`serialNumber` varchar(255),
	`assetCategory` enum('FURNITURE','ELECTRONICS','VEHICLE','PROPERTY','EQUIPMENT','OTHER') NOT NULL,
	`assetCondition` enum('NEW','GOOD','FAIR','POOR','DAMAGED','LOST') DEFAULT 'GOOD',
	`assetStatus` enum('ACTIVE','IN_MAINTENANCE','DISPOSED','STOLEN','ARCHIVED') DEFAULT 'ACTIVE',
	`purchaseDate` timestamp(3),
	`purchasePrice` decimal(15,2) DEFAULT '0.00',
	`currentValue` decimal(15,2) DEFAULT '0.00',
	`location` text,
	`custodianId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `burial_certificates` (
	`id` varchar(255) NOT NULL,
	`burialRequestId` varchar(255) NOT NULL,
	`certificateNumber` varchar(255) NOT NULL,
	`issuedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`issuedBy` varchar(255),
	`pdfUrl` varchar(500),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `burial_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `burial_certificates_request_unique` UNIQUE(`burialRequestId`),
	CONSTRAINT `burial_certificates_number_unique` UNIQUE(`certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `burial_requests` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`deceasedName` varchar(255) NOT NULL,
	`relationship` varchar(255) NOT NULL,
	`causeOfDeath` varchar(255) NOT NULL,
	`dateOfDeath` timestamp(3) NOT NULL,
	`placeOfDeath` varchar(255) NOT NULL,
	`contactPhone` varchar(255) NOT NULL,
	`contactEmail` varchar(255) NOT NULL,
	`status` enum('PENDING','APPROVED_UNPAID','PAID','BURIAL_DONE','REJECTED') DEFAULT 'PENDING',
	`rejectionReason` text,
	`paymentId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `burial_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `burial_requests_payment_unique` UNIQUE(`paymentId`)
);
--> statement-breakpoint
CREATE TABLE `finance_budget_items` (
	`id` varchar(255) NOT NULL,
	`budgetId` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `finance_budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_budgets` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`totalAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
	`status` enum('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT',
	`createdBy` varchar(255) NOT NULL,
	`approvedBy` varchar(255),
	`approvedAt` timestamp(3),
	`comments` text,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_fund_requests` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`requesterId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`status` enum('PENDING','RECOMMENDED','APPROVED','DISBURSED','REJECTED') DEFAULT 'PENDING',
	`recommendedBy` varchar(255),
	`recommendedAt` timestamp(3),
	`approvedBy` varchar(255),
	`approvedAt` timestamp(3),
	`disbursedBy` varchar(255),
	`disbursedAt` timestamp(3),
	`rejectionReason` text,
	`evidenceUrl` varchar(500),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_fund_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`type` enum('INFLOW','OUTFLOW') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`category` varchar(255) NOT NULL,
	`description` varchar(500) NOT NULL,
	`performedBy` varchar(255) NOT NULL,
	`date` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`relatedRequestId` varchar(255),
	`metadata` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `finance_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_attendances` (
	`id` varchar(255) NOT NULL,
	`meetingId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`status` enum('INVITED','ACCEPTED','DECLINED','PRESENT','ABSENT') DEFAULT 'INVITED',
	`joinedAt` timestamp(3),
	`leftAt` timestamp(3),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `meeting_attendance_unique` UNIQUE(`meetingId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `meeting_docs` (
	`id` varchar(255) NOT NULL,
	`meetingId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`type` enum('AGENDA','MINUTES','MEMBER_REPORT','OTHER') DEFAULT 'OTHER',
	`submissionStatus` enum('ON_TIME','LATE') DEFAULT 'ON_TIME',
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `meeting_docs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`organizationId` varchar(255) NOT NULL,
	`scheduledAt` timestamp(3) NOT NULL,
	`endAt` timestamp(3),
	`venue` varchar(255),
	`isOnline` boolean DEFAULT false,
	`meetingLink` varchar(500),
	`status` enum('SCHEDULED','ONGOING','ENDED','CANCELLED') DEFAULT 'SCHEDULED',
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255),
	`label` varchar(255) NOT NULL,
	`path` varchar(255),
	`parentId` varchar(255),
	`order` int NOT NULL DEFAULT 0,
	`type` enum('link','dropdown','button') DEFAULT 'link',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `navigation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occasion_requests` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`typeId` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`date` timestamp(3) NOT NULL,
	`time` varchar(255) NOT NULL,
	`venue` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`role` enum('COORDINATING','WITNESS') NOT NULL,
	`certificateNeeded` boolean DEFAULT false,
	`status` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
	`amount` decimal(10,2) DEFAULT '0.00',
	`details` json,
	`certificateNo` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occasion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occasion_types` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`certificateFee` decimal(10,2) DEFAULT '0.00',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occasion_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `occasion_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`isPublished` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_slug_idx` UNIQUE(`organizationId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `programme_registrations` (
	`id` varchar(255) NOT NULL,
	`programmeId` varchar(255) NOT NULL,
	`userId` varchar(255),
	`memberId` varchar(255),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`status` enum('REGISTERED','PAID','ATTENDED','CANCELLED') DEFAULT 'REGISTERED',
	`paymentReference` varchar(255),
	`certificateUrl` varchar(500),
	`certificateIssuedAt` timestamp(3),
	`registeredAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `programme_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programme_reports` (
	`id` varchar(255) NOT NULL,
	`programmeId` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`challenges` text,
	`comments` text,
	`attendeesMale` int DEFAULT 0,
	`attendeesFemale` int DEFAULT 0,
	`amountSpent` decimal(15,2) DEFAULT '0.00',
	`images` json,
	`submittedBy` varchar(255) NOT NULL,
	`submittedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `programme_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `programme_reports_programmeId_unique` UNIQUE(`programmeId`)
);
--> statement-breakpoint
CREATE TABLE `programmes` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`venue` varchar(255) NOT NULL,
	`startDate` timestamp(3) NOT NULL,
	`endDate` timestamp(3),
	`time` varchar(255),
	`level` enum('NATIONAL','STATE','LOCAL','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`targetAudience` enum('PUBLIC','MEMBERS','BROTHERS','SISTERS','CHILDREN','YOUTH','ELDERS') DEFAULT 'PUBLIC',
	`status` enum('DRAFT','PENDING_STATE','PENDING_NATIONAL','APPROVED','REJECTED','CANCELLED','COMPLETED') DEFAULT 'DRAFT',
	`approvedStateBy` varchar(255),
	`approvedStateAt` timestamp(3),
	`approvedNationalBy` varchar(255),
	`approvedNationalAt` timestamp(3),
	`paymentRequired` boolean DEFAULT false,
	`amount` decimal(10,2) DEFAULT '0.00',
	`hasCertificate` boolean DEFAULT false,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programmes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teskiyah_centres` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`venue` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`time` varchar(255) NOT NULL,
	`contactNumber` varchar(255),
	`state` varchar(255) NOT NULL,
	`lga` varchar(255) NOT NULL,
	`branch` varchar(255),
	`organizationId` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teskiyah_centres_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','OTHER') NOT NULL;--> statement-breakpoint
ALTER TABLE `asset_maintenance_logs` ADD CONSTRAINT `asset_maintenance_logs_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_custodianId_users_id_fk` FOREIGN KEY (`custodianId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_certificates` ADD CONSTRAINT `burial_certificates_burialRequestId_burial_requests_id_fk` FOREIGN KEY (`burialRequestId`) REFERENCES `burial_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_requests` ADD CONSTRAINT `burial_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_requests` ADD CONSTRAINT `burial_requests_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_items` ADD CONSTRAINT `finance_budget_items_budgetId_finance_budgets_id_fk` FOREIGN KEY (`budgetId`) REFERENCES `finance_budgets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budgets` ADD CONSTRAINT `finance_budgets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budgets` ADD CONSTRAINT `finance_budgets_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budgets` ADD CONSTRAINT `finance_budgets_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_fund_requests` ADD CONSTRAINT `finance_fund_requests_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_fund_requests` ADD CONSTRAINT `finance_fund_requests_requesterId_users_id_fk` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_fund_requests` ADD CONSTRAINT `finance_fund_requests_recommendedBy_users_id_fk` FOREIGN KEY (`recommendedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_fund_requests` ADD CONSTRAINT `finance_fund_requests_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_fund_requests` ADD CONSTRAINT `finance_fund_requests_disbursedBy_users_id_fk` FOREIGN KEY (`disbursedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD CONSTRAINT `finance_transactions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD CONSTRAINT `finance_transactions_performedBy_users_id_fk` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD CONSTRAINT `finance_transactions_relatedRequestId_finance_fund_requests_id_fk` FOREIGN KEY (`relatedRequestId`) REFERENCES `finance_fund_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_attendances` ADD CONSTRAINT `meeting_attendances_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_attendances` ADD CONSTRAINT `meeting_attendances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_docs` ADD CONSTRAINT `meeting_docs_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_docs` ADD CONSTRAINT `meeting_docs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `navigation_items` ADD CONSTRAINT `navigation_items_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_typeId_occasion_types_id_fk` FOREIGN KEY (`typeId`) REFERENCES `occasion_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pages` ADD CONSTRAINT `pages_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_programmeId_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_reports` ADD CONSTRAINT `programme_reports_programmeId_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_reports` ADD CONSTRAINT `programme_reports_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_approvedStateBy_users_id_fk` FOREIGN KEY (`approvedStateBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_approvedNationalBy_users_id_fk` FOREIGN KEY (`approvedNationalBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;