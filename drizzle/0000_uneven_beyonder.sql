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
CREATE TABLE `members` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(255) NOT NULL,
	`memberId` varchar(255) NOT NULL,
	`status` enum('PENDING','ACTIVE','SUSPENDED','EXPIRED','INACTIVE') DEFAULT 'PENDING',
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
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `members_memberId_unique` UNIQUE(`memberId`)
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
	`level` enum('NATIONAL','STATE','LOCAL','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
	`code` varchar(255) NOT NULL,
	`parentId` varchar(255),
	`description` text,
	`address` varchar(255),
	`city` varchar(255),
	`state` varchar(255),
	`country` varchar(255) DEFAULT 'Nigeria',
	`phone` varchar(255),
	`email` varchar(255),
	`website` varchar(255),
	`welcomeMessage` text,
	`welcomeImageUrl` varchar(500),
	`googleMapUrl` text,
	`socialLinks` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_code_unique` UNIQUE(`code`)
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
	`paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','OTHER') NOT NULL,
	`paystackRef` varchar(255),
	`paystackResponse` json,
	`description` varchar(255),
	`metadata` json,
	`paidAt` timestamp(3),
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
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `galleries` ADD CONSTRAINT `galleries_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gallery_images` ADD CONSTRAINT `gallery_images_galleryId_galleries_id_fk` FOREIGN KEY (`galleryId`) REFERENCES `galleries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `officials` ADD CONSTRAINT `officials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `officials` ADD CONSTRAINT `officials_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;