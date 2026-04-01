CREATE TABLE `accounts` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `adhkar_centres` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`venue` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`time` varchar(255) NOT NULL,
	`contactNumber` varchar(255),
	`state` varchar(255) NOT NULL,
	`lga` varchar(255) NOT NULL,
	`organizationId` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adhkar_centres_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`category` enum('FURNITURE','ELECTRONICS','VEHICLE','PROPERTY','EQUIPMENT','OTHER') NOT NULL,
	`condition` enum('NEW','GOOD','FAIR','POOR','DAMAGED','LOST') DEFAULT 'GOOD',
	`status` enum('ACTIVE','IN_MAINTENANCE','DISPOSED','STOLEN','ARCHIVED') DEFAULT 'ACTIVE',
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
CREATE TABLE `audit_logs` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255),
	`action` varchar(255) NOT NULL,
	`entityType` varchar(255) NOT NULL,
	`entityId` varchar(255),
	`organizationId` varchar(255),
	`description` varchar(500),
	`ipAddress` varchar(255),
	`userAgent` varchar(255),
	`metadata` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('MANUAL','AUTOMATED') DEFAULT 'MANUAL',
	`databaseUrl` varchar(500),
	`filesUrl` varchar(500),
	`size` bigint,
	`status` enum('PENDING','COMPLETED','FAILED') DEFAULT 'PENDING',
	`error` text,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`createdBy` varchar(255),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_recipients` (
	`id` varchar(255) NOT NULL,
	`broadcastId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`status` enum('DELIVERED','READ') DEFAULT 'DELIVERED',
	`deliveredAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`readAt` timestamp(3),
	CONSTRAINT `broadcast_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcasts` (
	`id` varchar(255) NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`media` json,
	`target_type` enum('ALL','OFFICIALS_ONLY','INDIVIDUALS','JURISDICTION_MEMBERS') DEFAULT 'JURISDICTION_MEMBERS',
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`targetId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
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
CREATE TABLE `chat_participants` (
	`id` varchar(255) NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`isAdmin` boolean DEFAULT false,
	`joinedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `chat_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_participants_unique_idx` UNIQUE(`chatId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`isGroup` boolean DEFAULT false,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_submissions` (
	`id` varchar(255) NOT NULL,
	`competitionId` varchar(255) NOT NULL,
	`userId` varchar(255),
	`data` json NOT NULL,
	`status` varchar(50) DEFAULT 'SUBMITTED',
	`submittedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competition_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`year` int NOT NULL,
	`startDate` timestamp(3) NOT NULL,
	`endDate` timestamp(3) NOT NULL,
	`status` enum('DRAFT','ACTIVE','CLOSED','COMPLETED') DEFAULT 'ACTIVE',
	`fields` json NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255),
	`organizationId` varchar(255),
	`memberId` varchar(255),
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`documentType` enum('ID_CARD','CERTIFICATE','PHOTO','CONTRACT','REPORT','MINUTES','OTHER') NOT NULL,
	`description` varchar(255),
	`isPublic` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` varchar(255) NOT NULL,
	`to` varchar(255) NOT NULL,
	`from` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(255),
	`status` enum('PENDING','SENT','FAILED','BOUNCED') DEFAULT 'PENDING',
	`provider` varchar(255),
	`providerId` varchar(255),
	`error` text,
	`metadata` json,
	`sentAt` timestamp(3),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` varchar(255) NOT NULL,
	`templateKey` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` text NOT NULL,
	`textBody` text,
	`variables` json,
	`description` varchar(500),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_templates_templateKey_unique` UNIQUE(`templateKey`)
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
CREATE TABLE `fundraising_campaigns` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`targetAmount` decimal(15,2) DEFAULT '0.00',
	`raisedAmount` decimal(15,2) DEFAULT '0.00',
	`startDate` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`endDate` timestamp(3),
	`status` enum('PENDING','ACTIVE','PAUSED','COMPLETED','ARCHIVED') DEFAULT 'ACTIVE',
	`coverImage` varchar(500),
	`allowCustomAmount` boolean DEFAULT true,
	`suggestedAmounts` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fundraising_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_org_slug_idx` UNIQUE(`organizationId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `galleries` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` varchar(255) NOT NULL,
	`galleryId` varchar(255) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`caption` varchar(255),
	`order` int DEFAULT 0,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `gallery_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jurisdiction_codes` (
	`id` varchar(255) NOT NULL,
	`type` enum('COUNTRY','STATE') NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`parentId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jurisdiction_codes_id` PRIMARY KEY(`id`)
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
CREATE TABLE `meeting_group_members` (
	`id` varchar(255) NOT NULL,
	`groupId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `meeting_group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `meeting_group_member_unique` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `meeting_groups` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_groups_id` PRIMARY KEY(`id`)
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
	`virtualRoomId` varchar(500),
	`recordingUrl` varchar(500),
	`groupId` varchar(255),
	`status` enum('SCHEDULED','ONGOING','ENDED','CANCELLED') DEFAULT 'SCHEDULED',
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_id_sequences` (
	`key` varchar(255) NOT NULL,
	`lastSerial` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `member_id_sequences_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`memberId` varchar(255),
	`status` enum('PENDING','RECOMMENDED','ACTIVE','SUSPENDED','EXPIRED','INACTIVE','REJECTED') DEFAULT 'PENDING',
	`membershipType` enum('REGULAR','ASSOCIATE','HONORARY','LIFETIME') DEFAULT 'REGULAR',
	`dateJoined` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`dateExpired` timestamp(3),
	`isActive` boolean DEFAULT true,
	`dateOfBirth` timestamp(3),
	`gender` enum('MALE','FEMALE'),
	`occupation` varchar(255),
	`address` varchar(255),
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(255),
	`metadata` json,
	`recommendedBy` varchar(255),
	`recommendedAt` timestamp(3),
	`approvedBy` varchar(255),
	`approvedAt` timestamp(3),
	`rejectionReason` text,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `members_memberId_unique` UNIQUE(`memberId`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`content` text,
	`mediaUrl` varchar(500),
	`readBy` json,
	`type` enum('TEXT','IMAGE','E2AE') DEFAULT 'TEXT',
	`encryptedKeys` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
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
CREATE TABLE `notifications` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('INFO','SUCCESS','WARNING','ERROR') DEFAULT 'INFO',
	`isRead` boolean DEFAULT false,
	`actionUrl` varchar(500),
	`metadata` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
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
CREATE TABLE `offices` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `officials` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`position` varchar(255) NOT NULL,
	`positionLevel` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`dateElected` timestamp(3),
	`dateAppointed` timestamp(3),
	`termStart` timestamp(3) NOT NULL,
	`termEnd` timestamp(3),
	`image` varchar(500),
	`bio` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `officials_id` PRIMARY KEY(`id`),
	CONSTRAINT `officials_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`code` varchar(255) NOT NULL,
	`parentId` varchar(255),
	`description` text,
	`address` varchar(255),
	`city` varchar(255),
	`state` varchar(255),
	`country` varchar(255) DEFAULT 'Nigeria',
	`phone` varchar(255),
	`email` varchar(255),
	`planningDeadlineMonth` int DEFAULT 12,
	`planningDeadlineDay` int DEFAULT 12,
	`website` varchar(255),
	`welcomeMessage` text,
	`welcomeImageUrl` varchar(500),
	`googleMapUrl` text,
	`socialLinks` json,
	`missionText` text,
	`visionText` text,
	`whatsapp` varchar(255),
	`officeHours` varchar(255),
	`sliderImages` json,
	`paystackSubaccountCode` varchar(255),
	`bankName` varchar(255),
	`accountNumber` varchar(255),
	`bankCode` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `organs` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`websiteUrl` varchar(500),
	`logoUrl` varchar(500),
	`category` varchar(100),
	`order` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organs_id` PRIMARY KEY(`id`)
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
CREATE TABLE `payments` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255),
	`organizationId` varchar(255),
	`memberId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(255) DEFAULT 'NGN',
	`status` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
	`paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','LEVY','OTHER') NOT NULL,
	`paystackRef` varchar(255),
	`paystackResponse` json,
	`description` varchar(255),
	`metadata` json,
	`paidAt` timestamp(3),
	`campaignId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paystackRef_unique` UNIQUE(`paystackRef`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(255) NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`authorId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`coverImage` varchar(500),
	`postType` enum('NEWS','EVENT','ANNOUNCEMENT') DEFAULT 'NEWS',
	`isPublished` boolean DEFAULT false,
	`publishedAt` timestamp(3),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
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
	`level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`targetAudience` enum('PUBLIC','MEMBERS','BROTHERS','SISTERS','CHILDREN','YOUTH','ELDERS') DEFAULT 'PUBLIC',
	`status` enum('DRAFT','PENDING_STATE','PENDING_NATIONAL','APPROVED','REJECTED','CANCELLED','COMPLETED') DEFAULT 'DRAFT',
	`approvedStateBy` varchar(255),
	`approvedStateAt` timestamp(3),
	`approvedNationalBy` varchar(255),
	`approvedNationalAt` timestamp(3),
	`organizingOfficeId` varchar(255),
	`format` enum('PHYSICAL','VIRTUAL','HYBRID') DEFAULT 'PHYSICAL',
	`frequency` enum('WEEKLY','MONTHLY','QUARTERLY','BI-ANNUALLY','ANNUALLY','ONCE') DEFAULT 'ONCE',
	`objectives` text,
	`budget` decimal(15,2) DEFAULT '0.00',
	`committee` varchar(255),
	`additionalInfo` text,
	`isLateSubmission` boolean DEFAULT false,
	`paymentRequired` boolean DEFAULT false,
	`amount` decimal(10,2) DEFAULT '0.00',
	`hasCertificate` boolean DEFAULT false,
	`rejectionReason` text,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programmes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotion_plans` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`durationDays` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotion_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`planId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`link` varchar(500),
	`status` enum('PENDING','APPROVED','REJECTED','ACTIVE','EXPIRED') DEFAULT 'PENDING',
	`paymentStatus` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
	`amount` decimal(15,2) NOT NULL,
	`startDate` timestamp(3),
	`endDate` timestamp(3),
	`approvedBy` varchar(255),
	`approvedAt` timestamp(3),
	`rejectionReason` text,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`officeId` varchar(255),
	`reportType` enum('MONTHLY_ACTIVITY','QUARTERLY_STATE','ANNUAL_CONGRESS','FINANCIAL') NOT NULL,
	`status` enum('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT',
	`title` varchar(255) NOT NULL,
	`period` varchar(255) NOT NULL,
	`content` json NOT NULL,
	`approvedBy` varchar(255),
	`approvedAt` timestamp(3),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`granted` boolean DEFAULT true,
	`grantedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`grantedBy` varchar(255),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`description` text,
	`jurisdictionLevel` enum('SYSTEM','NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`isSystem` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`),
	CONSTRAINT `roles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp(3) NOT NULL,
	CONSTRAINT `sessions_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `site_visits` (
	`id` varchar(255) NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`path` varchar(500) NOT NULL,
	`userId` varchar(255),
	`userAgent` text,
	`ip` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `site_visits_id` PRIMARY KEY(`id`)
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
	`category` enum('TESKIYAH_WORKSHOP','FRIDAY_KHUTHBAH','PRESS_RELEASE','STATE_OF_THE_NATION','OTHER') NOT NULL,
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
CREATE TABLE `system_settings` (
	`id` varchar(255) NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`category` enum('EMAIL','NOTIFICATION','GENERAL','AI','INTEGRATION') NOT NULL,
	`isEncrypted` boolean DEFAULT false,
	`description` varchar(500),
	`updatedBy` varchar(255),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_settingKey_unique` UNIQUE(`settingKey`)
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
CREATE TABLE `tmc_programmes` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`iconName` varchar(100),
	`category` varchar(100),
	`order` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tmc_programmes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`organizationId` varchar(255),
	`assignedBy` varchar(255),
	`assignedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`expiresAt` timestamp(3),
	`isActive` boolean DEFAULT true,
	`metadata` json,
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`password` varchar(255),
	`phone` varchar(255),
	`country` varchar(255),
	`address` varchar(255),
	`publicKey` text,
	`encryptedPrivateKey` text,
	`salt` varchar(255),
	`encryptedPrivateKeyRecovery` text,
	`recoveryKeyHash` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp(3) NOT NULL,
	CONSTRAINT `verification_tokens_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_maintenance_logs` ADD CONSTRAINT `asset_maintenance_logs_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_custodianId_users_id_fk` FOREIGN KEY (`custodianId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backups` ADD CONSTRAINT `backups_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcast_recipients` ADD CONSTRAINT `broadcast_recipients_broadcastId_broadcasts_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcast_recipients` ADD CONSTRAINT `broadcast_recipients_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_certificates` ADD CONSTRAINT `burial_certificates_burialRequestId_burial_requests_id_fk` FOREIGN KEY (`burialRequestId`) REFERENCES `burial_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_requests` ADD CONSTRAINT `burial_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `burial_requests` ADD CONSTRAINT `burial_requests_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_chatId_chats_id_fk` FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_submissions` ADD CONSTRAINT `competition_submissions_competitionId_competitions_id_fk` FOREIGN KEY (`competitionId`) REFERENCES `competitions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_submissions` ADD CONSTRAINT `competition_submissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_feeId_fees_id_fk` FOREIGN KEY (`feeId`) REFERENCES `fees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_assignments` ADD CONSTRAINT `fee_assignments_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fees` ADD CONSTRAINT `fees_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE `fundraising_campaigns` ADD CONSTRAINT `fundraising_campaigns_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galleries` ADD CONSTRAINT `galleries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gallery_images` ADD CONSTRAINT `gallery_images_galleryId_galleries_id_fk` FOREIGN KEY (`galleryId`) REFERENCES `galleries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_attendances` ADD CONSTRAINT `meeting_attendances_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_attendances` ADD CONSTRAINT `meeting_attendances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_docs` ADD CONSTRAINT `meeting_docs_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_docs` ADD CONSTRAINT `meeting_docs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_group_members` ADD CONSTRAINT `meeting_group_members_groupId_meeting_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `meeting_groups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_group_members` ADD CONSTRAINT `meeting_group_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_groups` ADD CONSTRAINT `meeting_groups_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_recommendedBy_users_id_fk` FOREIGN KEY (`recommendedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chatId_chats_id_fk` FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `navigation_items` ADD CONSTRAINT `navigation_items_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_typeId_occasion_types_id_fk` FOREIGN KEY (`typeId`) REFERENCES `occasion_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `occasion_requests` ADD CONSTRAINT `occasion_requests_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `officials` ADD CONSTRAINT `officials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `officials` ADD CONSTRAINT `officials_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pages` ADD CONSTRAINT `pages_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_campaignId_fundraising_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `fundraising_campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_programmeId_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_registrations_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_reports` ADD CONSTRAINT `programme_reports_programmeId_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programme_reports` ADD CONSTRAINT `programme_reports_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_approvedStateBy_users_id_fk` FOREIGN KEY (`approvedStateBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_approvedNationalBy_users_id_fk` FOREIGN KEY (`approvedNationalBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_organizingOfficeId_offices_id_fk` FOREIGN KEY (`organizingOfficeId`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_planId_promotion_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `promotion_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_officeId_offices_id_fk` FOREIGN KEY (`officeId`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_visits` ADD CONSTRAINT `site_visits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programme_files` ADD CONSTRAINT `special_programme_files_programmeId_special_programmes_id_fk` FOREIGN KEY (`programmeId`) REFERENCES `special_programmes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programmes` ADD CONSTRAINT `special_programmes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `special_programmes` ADD CONSTRAINT `special_programmes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;