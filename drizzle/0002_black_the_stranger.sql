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
ALTER TABLE `members` ADD `recommendedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `recommendedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `members` ADD `approvedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `approvedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `members` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `officials` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `site_visits` ADD CONSTRAINT `site_visits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_recommendedBy_users_id_fk` FOREIGN KEY (`recommendedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;