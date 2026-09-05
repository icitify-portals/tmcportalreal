-- Bulk registration support: paymaster registers multiple people at once with per-attendee claim links
ALTER TABLE `programme_registrations`
  ADD COLUMN `bulkGroupId` varchar(255) AFTER `lockedAmount`,
  ADD COLUMN `bulkClaimToken` varchar(100) AFTER `bulkGroupId`,
  ADD COLUMN `bulkClaimedAt` datetime(3) AFTER `bulkClaimToken`;

CREATE TABLE `bulk_registration_groups` (
  `id` varchar(255) NOT NULL,
  `programmeId` varchar(255) NOT NULL,
  `paymasterUserId` varchar(255),
  `paymasterName` varchar(255) NOT NULL,
  `paymasterEmail` varchar(255) NOT NULL,
  `paymasterPhone` varchar(100),
  `attendeeCount` int NOT NULL,
  `amountPerAttendee` decimal(10,2) NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'NGN',
  `status` enum('PENDING','PAID','PARTIALLY_PAID','REFUNDED') DEFAULT 'PENDING',
  `paymentRef` varchar(255),
  `paymentId` varchar(255),
  `notes` text,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `brg_programme_fk` (`programmeId`),
  KEY `brg_paymaster_fk` (`paymasterUserId`),
  KEY `brg_payment_fk` (`paymentId`),
  CONSTRAINT `brg_programme_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `brg_paymaster_fk` FOREIGN KEY (`paymasterUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action,
  CONSTRAINT `brg_payment_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action
);

ALTER TABLE `programme_registrations`
  ADD CONSTRAINT `pr_bulk_fk` FOREIGN KEY (`bulkGroupId`) REFERENCES `bulk_registration_groups`(`id`) ON DELETE set null ON UPDATE no action,
  ADD UNIQUE KEY `pr_bulk_claim_unique` (`bulkClaimToken`);
