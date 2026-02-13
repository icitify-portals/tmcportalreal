-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 26, 2026 at 10:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tmc_portal`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `providerAccountId` varchar(191) NOT NULL,
  `refresh_token` text DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `expires_at` int(11) DEFAULT NULL,
  `token_type` varchar(191) DEFAULT NULL,
  `scope` varchar(191) DEFAULT NULL,
  `id_token` text DEFAULT NULL,
  `session_state` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `userId`, `action`, `entityType`, `entityId`, `organizationId`, `description`, `ipAddress`, `userAgent`, `metadata`, `createdAt`) VALUES
('e2d8a9f9-05a0-4b26-b789-189d52292694', NULL, 'USER_SIGNUP', 'User', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', NULL, 'New user signup: aa.adelopo@gmail.com', NULL, NULL, '{}', '2026-01-16 16:58:46.477');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `memberId` varchar(191) DEFAULT NULL,
  `fileName` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `fileUrl` varchar(191) NOT NULL,
  `documentType` enum('ID_CARD','CERTIFICATE','PHOTO','CONTRACT','REPORT','MINUTES','OTHER') NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` varchar(191) NOT NULL,
  `to` varchar(191) NOT NULL,
  `from` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `template` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','SENT','FAILED','BOUNCED') NOT NULL DEFAULT 'PENDING',
  `provider` varchar(191) DEFAULT NULL,
  `providerId` varchar(191) DEFAULT NULL,
  `error` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `sentAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`id`, `to`, `from`, `subject`, `template`, `status`, `provider`, `providerId`, `error`, `metadata`, `sentAt`, `createdAt`) VALUES
('0f469435-d787-4932-a38d-176e06e607cc', 'aa.adelopo@gmail.com', 'TMC Connect <info@notifications.tmcng.net>', 'Verify Your Email - TMC Connect', NULL, 'FAILED', 'resend', NULL, '{\"statusCode\":403,\"message\":\"Not authorized to send emails from notifications.tmcng.net\"}', '{}', NULL, '2026-01-16 16:58:46.468');

-- --------------------------------------------------------

--
-- Table structure for table `galleries`
--

CREATE TABLE `galleries` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gallery_images`
--

CREATE TABLE `gallery_images` (
  `id` varchar(255) NOT NULL,
  `galleryId` varchar(255) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `order` int(11) DEFAULT 0,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `memberId` varchar(191) NOT NULL,
  `status` enum('PENDING','ACTIVE','SUSPENDED','EXPIRED','INACTIVE') NOT NULL DEFAULT 'PENDING',
  `membershipType` enum('REGULAR','ASSOCIATE','HONORARY','LIFETIME') NOT NULL DEFAULT 'REGULAR',
  `dateJoined` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `dateExpired` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `gender` enum('MALE','FEMALE') DEFAULT NULL,
  `occupation` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `emergencyContact` varchar(191) DEFAULT NULL,
  `emergencyPhone` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `officials`
--

CREATE TABLE `officials` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `position` varchar(191) NOT NULL,
  `positionLevel` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
  `dateElected` datetime(3) DEFAULT NULL,
  `dateAppointed` datetime(3) DEFAULT NULL,
  `termStart` datetime(3) NOT NULL,
  `termEnd` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `level` enum('NATIONAL','STATE','LOCAL','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
  `code` varchar(191) NOT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) NOT NULL DEFAULT 'Nigeria',
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `welcomeMessage` text DEFAULT NULL,
  `welcomeImageUrl` varchar(500) DEFAULT NULL,
  `googleMapUrl` text DEFAULT NULL,
  `socialLinks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`socialLinks`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `memberId` varchar(191) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'NGN',
  `status` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','OTHER') NOT NULL,
  `paystackRef` varchar(191) DEFAULT NULL,
  `paystackResponse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`paystackResponse`)),
  `description` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `category`, `isActive`, `createdAt`, `updatedAt`) VALUES
('213e6b35-7703-4679-a4dd-f0610970a902', 'members:read', 'Read Members', 'View members list', 'Members', 1, '2026-01-19 08:29:29.083', '0000-00-00 00:00:00.000'),
('321e7f7e-b0b2-4903-92c1-b75d63200023', 'roles:create', 'Create Role', 'Create new roles', 'Roles', 1, '2026-01-19 08:29:29.054', '0000-00-00 00:00:00.000'),
('6d799d30-abda-4114-8366-3a4c4731a8b0', 'roles:update', 'Update Role', 'Update existing roles', 'Roles', 1, '2026-01-19 08:29:29.065', '0000-00-00 00:00:00.000'),
('75a977d0-a13d-414b-af5c-c371f0bfae04', 'roles:delete', 'Delete Role', 'Delete roles', 'Roles', 1, '2026-01-19 08:29:29.071', '0000-00-00 00:00:00.000'),
('9b6da42e-11ec-412f-8762-a2481ae86635', 'roles:read', 'Read Roles', 'View roles and permissions', 'Roles', 1, '2026-01-19 08:29:29.040', '0000-00-00 00:00:00.000'),
('ae69f2a4-ebf8-4533-bdbb-777fbaf87fe8', 'users:read', 'Read Users', 'View users list', 'Users', 1, '2026-01-19 08:29:29.075', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `jurisdictionLevel` enum('SYSTEM','NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `code`, `description`, `jurisdictionLevel`, `isSystem`, `isActive`, `createdAt`, `updatedAt`) VALUES
('1f2869ae-af3b-4203-9fdc-929e2f4b89de', 'Super Administrator', 'SUPER_ADMIN', 'System Root Role with all capabilities', 'SYSTEM', 1, 1, '2026-01-19 08:29:29.092', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `grantedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `grantedBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `granted`, `grantedAt`, `grantedBy`) VALUES
('0dfbac20-3dba-4ce4-966e-cabd327af121', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', '213e6b35-7703-4679-a4dd-f0610970a902', 1, '2026-01-19 08:29:29.106', NULL),
('19abd75b-297c-4d43-87c0-84ecf7d976d4', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', '6d799d30-abda-4114-8366-3a4c4731a8b0', 1, '2026-01-19 08:29:29.113', NULL),
('2452c1e6-8824-4724-83d3-96bd2ae53f97', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', '75a977d0-a13d-414b-af5c-c371f0bfae04', 1, '2026-01-19 08:29:29.116', NULL),
('c3b62b79-07a1-4654-8198-3260dc4ff820', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', '321e7f7e-b0b2-4903-92c1-b75d63200023', 1, '2026-01-19 08:29:29.109', NULL),
('c5c75dfc-28f8-42d8-a7f9-78fa3861117d', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', '9b6da42e-11ec-412f-8762-a2481ae86635', 1, '2026-01-19 08:29:29.118', NULL),
('ffd54eb6-ccf8-446b-97b4-a5a2538d66ba', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', 'ae69f2a4-ebf8-4533-bdbb-777fbaf87fe8', 1, '2026-01-19 08:29:29.120', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `sessionToken` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `emailVerified` datetime(3) DEFAULT NULL,
  `password` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `emailVerified`, `password`, `name`, `phone`, `image`, `createdAt`, `updatedAt`) VALUES
('031c1948-98d4-4bc7-81fe-c95b6c644276', 'aa.adelopo2@gmail.com', '2026-01-16 16:31:59.380', '$2b$10$G/snOOZp4YM/b9lH17zD0.29jqH5GuyDEw/HcNFH7cEz4GNFQqyza', 'Ibrahim oladele', '+23408028511129', NULL, '2026-01-16 16:41:49.104', '0000-00-00 00:00:00.000'),
('bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'aa.adelopo@gmail.com', NULL, '$2b$10$CkJhuBz3b/c1naAjUx0AKeH57iltunXWW0MhoFkkAWMkfV.xNuDXW', 'adeola oladele', '+23408028511129', NULL, '2026-01-16 16:58:45.348', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `assignedBy` varchar(191) DEFAULT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiresAt` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `userId`, `roleId`, `organizationId`, `assignedBy`, `assignedAt`, `expiresAt`, `isActive`, `metadata`) VALUES
('0382af53-d2c7-4120-b471-127526a0ae50', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '1f2869ae-af3b-4203-9fdc-929e2f4b89de', NULL, NULL, '2026-01-19 11:24:40.594', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `verification_tokens`
--

CREATE TABLE `verification_tokens` (
  `identifier` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `verification_tokens`
--

INSERT INTO `verification_tokens` (`identifier`, `token`, `expires`) VALUES
('aa.adelopo@gmail.com', '58eaf0eef629b6fcbc3c0886bbaab18f9a5e52709829d7c1697323488ea97601', '2026-01-17 15:58:45.288'),
('aa.adelopo2@gmail.com', '9385a2d9ac9d9b4070e55238da98ce486d10d6bc8a4145d4457fb396f3ee962d', '2026-01-17 15:41:49.098');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('c9593464-c4a3-4c42-8c23-351134bb4abc', 'c6e0d86665f43b02be020ea6f816b3e986c67c3e969e0a0036fd6738b1d45479', '2025-12-26 03:24:51.180', '20251226032449_init_mysql', NULL, NULL, '2025-12-26 03:24:49.066', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_provider_providerAccountId_key` (`provider`,`providerAccountId`),
  ADD KEY `accounts_userId_fkey` (`userId`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_userId_idx` (`userId`),
  ADD KEY `audit_logs_entityType_entityId_idx` (`entityType`,`entityId`),
  ADD KEY `audit_logs_organizationId_idx` (`organizationId`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_userId_fkey` (`userId`),
  ADD KEY `documents_organizationId_fkey` (`organizationId`),
  ADD KEY `documents_memberId_fkey` (`memberId`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_logs_to_idx` (`to`),
  ADD KEY `email_logs_status_idx` (`status`),
  ADD KEY `email_logs_createdAt_idx` (`createdAt`);

--
-- Indexes for table `galleries`
--
ALTER TABLE `galleries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gallery_images_galleryId_galleries_id_fk` (`galleryId`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `members_userId_key` (`userId`),
  ADD UNIQUE KEY `members_memberId_key` (`memberId`),
  ADD KEY `members_organizationId_fkey` (`organizationId`);

--
-- Indexes for table `officials`
--
ALTER TABLE `officials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `officials_userId_key` (`userId`),
  ADD KEY `officials_organizationId_fkey` (`organizationId`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organizations_code_key` (`code`),
  ADD KEY `organizations_parentId_fkey` (`parentId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_paystackRef_key` (`paystackRef`),
  ADD KEY `payments_userId_fkey` (`userId`),
  ADD KEY `payments_organizationId_fkey` (`organizationId`),
  ADD KEY `payments_memberId_fkey` (`memberId`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_code_key` (`code`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_key` (`name`),
  ADD UNIQUE KEY `roles_code_key` (`code`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  ADD KEY `role_permissions_roleId_idx` (`roleId`),
  ADD KEY `role_permissions_permissionId_idx` (`permissionId`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sessions_sessionToken_key` (`sessionToken`),
  ADD KEY `sessions_userId_fkey` (`userId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_roles_userId_roleId_organizationId_key` (`userId`,`roleId`,`organizationId`),
  ADD KEY `user_roles_userId_idx` (`userId`),
  ADD KEY `user_roles_roleId_idx` (`roleId`),
  ADD KEY `user_roles_organizationId_idx` (`organizationId`);

--
-- Indexes for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  ADD UNIQUE KEY `verification_tokens_token_key` (`token`),
  ADD UNIQUE KEY `verification_tokens_identifier_token_key` (`identifier`,`token`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD CONSTRAINT `gallery_images_galleryId_galleries_id_fk` FOREIGN KEY (`galleryId`) REFERENCES `galleries` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `officials`
--
ALTER TABLE `officials`
  ADD CONSTRAINT `officials_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `officials_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `organizations`
--
ALTER TABLE `organizations`
  ADD CONSTRAINT `organizations_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
