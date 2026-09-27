-- Phased early bird windows per programme (multiple tiers with own dates + amounts)
CREATE TABLE `programme_early_bird_tiers` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `programmeId` varchar(255) NOT NULL,
  `label` varchar(100) NULL,
  `startAt` datetime(3) NULL,
  `endAt` datetime(3) NULL,
  `amount` decimal(10,2) NOT NULL,
  `sortOrder` int DEFAULT 0,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `programme_eb_tiers_programme_fk` FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`) ON DELETE CASCADE,
  INDEX `programme_eb_tiers_programme_idx` (`programmeId`)
);
