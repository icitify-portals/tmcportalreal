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
CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`content` text,
	`mediaUrl` varchar(500),
	`readBy` json,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
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
ALTER TABLE `organizations` ADD `missionText` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `visionText` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `whatsapp` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `officeHours` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `sliderImages` json;--> statement-breakpoint
ALTER TABLE `users` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_chatId_chats_id_fk` FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chatId_chats_id_fk` FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;