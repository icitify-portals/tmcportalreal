-- Blind sponsorship pools: pay for N unnamed seats upfront, members claim via sponsor code
CREATE TABLE `programme_sponsorship_pools` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `programmeId` varchar(255) NOT NULL,
  `sponsorUserId` varchar(255) NULL,
  `sponsorName` varchar(255) NOT NULL,
  `sponsorEmail` varchar(255) NOT NULL,
  `sponsorPhone` varchar(100) NULL,
  `seatCount` int NOT NULL,
  `seatsClaimed` int DEFAULT 0,
  `amountPerSeat` decimal(10,2) NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'NGN',
  `status` enum('PENDING','PAID','CANCELLED') DEFAULT 'PENDING',
  `sponsorCode` varchar(20) NOT NULL,
  `paymentRef` varchar(255) NULL,
  `paymentId` varchar(255) NULL,
  `notes` text NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `programme_sponsor_pool_programme_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `programme_sponsor_pool_sponsor_fk` FOREIGN KEY (`sponsorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `programme_sponsor_pool_payment_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
  INDEX `programme_sponsor_pool_programme_idx` (`programmeId`),
  UNIQUE INDEX `programme_sponsor_pool_code_unique` (`sponsorCode`)
);
ALTER TABLE `programme_registrations` ADD COLUMN `sponsorPoolId` varchar(255) NULL;
ALTER TABLE `programme_registrations` ADD CONSTRAINT `programme_reg_sponsor_pool_fk` FOREIGN KEY (`sponsorPoolId`) REFERENCES `programme_sponsorship_pools`(`id`) ON DELETE SET NULL;
CREATE INDEX `programme_reg_sponsor_pool_idx` ON `programme_registrations` (`sponsorPoolId`);
