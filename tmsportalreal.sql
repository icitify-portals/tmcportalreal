-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 14, 2026 at 09:30 AM
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
-- Table structure for table `adhkar_centres`
--

CREATE TABLE `adhkar_centres` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `time` varchar(255) NOT NULL,
  `contactNumber` varchar(255) DEFAULT NULL,
  `state` varchar(255) NOT NULL,
  `lga` varchar(255) NOT NULL,
  `organizationId` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `category` enum('FURNITURE','ELECTRONICS','VEHICLE','PROPERTY','EQUIPMENT','OTHER') NOT NULL,
  `condition` enum('NEW','GOOD','FAIR','POOR','DAMAGED','LOST') DEFAULT 'GOOD',
  `status` enum('ACTIVE','IN_MAINTENANCE','DISPOSED','STOLEN','ARCHIVED') DEFAULT 'ACTIVE',
  `purchaseDate` timestamp(3) NULL DEFAULT NULL,
  `purchasePrice` decimal(15,2) DEFAULT 0.00,
  `currentValue` decimal(15,2) DEFAULT 0.00,
  `location` text DEFAULT NULL,
  `custodianId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `asset_maintenance_logs`
--

CREATE TABLE `asset_maintenance_logs` (
  `id` varchar(255) NOT NULL,
  `assetId` varchar(255) NOT NULL,
  `type` enum('REPAIR','SERVICE','INSPECTION','UPGRADE') NOT NULL,
  `description` text NOT NULL,
  `cost` decimal(15,2) DEFAULT 0.00,
  `date` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `performedBy` varchar(255) DEFAULT NULL,
  `nextServiceDate` timestamp(3) NULL DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
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
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `userId`, `action`, `entityType`, `entityId`, `organizationId`, `description`, `ipAddress`, `userAgent`, `metadata`, `createdAt`) VALUES
('a6a45c0c-335a-49b1-ba4e-b5891c092b0b', NULL, 'USER_SIGNUP', 'User', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', NULL, 'New user signup: aa.adelopo2@gmail.com', NULL, NULL, '{}', '2026-02-12 15:23:36.011');

-- --------------------------------------------------------

--
-- Table structure for table `broadcasts`
--

CREATE TABLE `broadcasts` (
  `id` varchar(255) NOT NULL,
  `senderId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `media` longtext DEFAULT NULL CHECK (json_valid(`media`)),
  `level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
  `targetId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `burial_certificates`
--

CREATE TABLE `burial_certificates` (
  `id` varchar(191) NOT NULL,
  `burialRequestId` varchar(191) NOT NULL,
  `certificateNumber` varchar(191) NOT NULL,
  `issuedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `issuedBy` varchar(191) DEFAULT NULL,
  `pdfUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `burial_requests`
--

CREATE TABLE `burial_requests` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `deceasedName` varchar(191) NOT NULL,
  `relationship` varchar(191) NOT NULL,
  `causeOfDeath` varchar(191) NOT NULL,
  `dateOfDeath` datetime(3) NOT NULL,
  `placeOfDeath` varchar(191) NOT NULL,
  `contactPhone` varchar(191) NOT NULL,
  `contactEmail` varchar(191) NOT NULL,
  `status` enum('PENDING','APPROVED_UNPAID','PAID','BURIAL_DONE','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejectionReason` text DEFAULT NULL,
  `paymentId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `isGroup` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_participants`
--

CREATE TABLE `chat_participants` (
  `id` varchar(191) NOT NULL,
  `chatId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` varchar(191) NOT NULL,
  `from` varchar(191) DEFAULT NULL,
  `to` varchar(191) NOT NULL,
  `subject` varchar(191) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `template` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','SENT','FAILED','BOUNCED') NOT NULL,
  `provider` varchar(191) DEFAULT NULL,
  `providerId` varchar(191) DEFAULT NULL,
  `error` text DEFAULT NULL,
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `sentAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`id`, `from`, `to`, `subject`, `body`, `template`, `status`, `provider`, `providerId`, `error`, `metadata`, `sentAt`, `createdAt`) VALUES
('288b7d16-dc5a-46c7-87df-9d305d781e98', 'TMC Connect <info@messages.tmcng.net>', 'aa.adelopo2@gmail.com', 'Membership Approved - Muslim Congress', NULL, NULL, 'SENT', 'resend', '61ee914e-653c-4bd2-a4f1-790a53dc438d', NULL, '{}', '2026-02-13 09:02:14.776', '2026-02-13 10:02:14.780'),
('7962e253-0834-44b3-a885-a64578c80d53', 'TMC Connect <info@messages.tmcng.net>', 'aa.adelopo2@gmail.com', 'Verify Your Email - TMC Connect', NULL, NULL, 'SENT', 'resend', '183e2730-2607-4ffd-9510-89a42120abce', NULL, '{}', '2026-02-12 14:23:35.965', '2026-02-12 15:23:35.975'),
('e3fd7cdd-e5d6-4960-a1e2-662f1fd2c989', 'TMC Connect <info@messages.tmcng.net>', 'aa.adelopo2@gmail.com', 'Verify Your Email - TMC Connect', NULL, NULL, 'SENT', 'resend', '81dfaf65-c723-4758-823b-fed8b666c553', NULL, '{}', '2026-02-12 14:36:36.345', '2026-02-12 15:36:36.351');

-- --------------------------------------------------------

--
-- Table structure for table `email_templates`
--

CREATE TABLE `email_templates` (
  `id` varchar(255) NOT NULL,
  `templateKey` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `htmlBody` text NOT NULL,
  `textBody` text DEFAULT NULL,
  `variables` longtext DEFAULT NULL CHECK (json_valid(`variables`)),
  `description` varchar(500) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fees`
--

CREATE TABLE `fees` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `feeTarget` enum('ALL_MEMBERS','OFFICIALS') NOT NULL,
  `dueDate` timestamp(3) NULL DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fee_assignments`
--

CREATE TABLE `fee_assignments` (
  `id` varchar(255) NOT NULL,
  `feeId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `status` enum('PENDING','PAID') DEFAULT 'PENDING',
  `amountPaid` decimal(10,2) DEFAULT 0.00,
  `paidAt` timestamp(3) NULL DEFAULT NULL,
  `paymentId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_budgets`
--

CREATE TABLE `finance_budgets` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `year` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `totalAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT',
  `createdBy` varchar(255) NOT NULL,
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedAt` timestamp(3) NULL DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_budget_items`
--

CREATE TABLE `finance_budget_items` (
  `id` varchar(255) NOT NULL,
  `budgetId` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` varchar(500) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_fund_requests`
--

CREATE TABLE `finance_fund_requests` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `requesterId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','RECOMMENDED','APPROVED','DISBURSED','REJECTED') DEFAULT 'PENDING',
  `recommendedBy` varchar(255) DEFAULT NULL,
  `recommendedAt` timestamp(3) NULL DEFAULT NULL,
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedAt` timestamp(3) NULL DEFAULT NULL,
  `disbursedBy` varchar(255) DEFAULT NULL,
  `disbursedAt` timestamp(3) NULL DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `evidenceUrl` varchar(500) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_transactions`
--

CREATE TABLE `finance_transactions` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `type` enum('INFLOW','OUTFLOW') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` varchar(500) NOT NULL,
  `performedBy` varchar(255) NOT NULL,
  `date` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `relatedRequestId` varchar(255) DEFAULT NULL,
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fundraising_campaigns`
--

CREATE TABLE `fundraising_campaigns` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `targetAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `raisedAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `startDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `endDate` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','PAUSED','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `coverImage` varchar(191) DEFAULT NULL,
  `allowCustomAmount` tinyint(1) NOT NULL DEFAULT 1,
  `suggestedAmounts` longtext DEFAULT NULL CHECK (json_valid(`suggestedAmounts`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `galleries`
--

CREATE TABLE `galleries` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gallery_images`
--

CREATE TABLE `gallery_images` (
  `id` varchar(191) NOT NULL,
  `galleryId` varchar(191) NOT NULL,
  `imageUrl` varchar(191) NOT NULL,
  `caption` varchar(191) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meetings`
--

CREATE TABLE `meetings` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `organizationId` varchar(255) NOT NULL,
  `scheduledAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `endAt` timestamp(3) NULL DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT 0,
  `meetingLink` varchar(500) DEFAULT NULL,
  `status` enum('SCHEDULED','ONGOING','ENDED','CANCELLED') DEFAULT 'SCHEDULED',
  `createdBy` varchar(255) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meeting_attendances`
--

CREATE TABLE `meeting_attendances` (
  `id` varchar(255) NOT NULL,
  `meetingId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `status` enum('INVITED','ACCEPTED','DECLINED','PRESENT','ABSENT') DEFAULT 'INVITED',
  `joinedAt` timestamp(3) NULL DEFAULT NULL,
  `leftAt` timestamp(3) NULL DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meeting_docs`
--

CREATE TABLE `meeting_docs` (
  `id` varchar(255) NOT NULL,
  `meetingId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `type` enum('AGENDA','MINUTES','MEMBER_REPORT','OTHER') DEFAULT 'OTHER',
  `submissionStatus` enum('ON_TIME','LATE') DEFAULT 'ON_TIME',
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `memberId` varchar(191) NOT NULL,
  `status` enum('PENDING','RECOMMENDED','ACTIVE','SUSPENDED','EXPIRED','INACTIVE','REJECTED') NOT NULL DEFAULT 'PENDING',
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
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `recommendationStatus` enum('NONE','RECOMMENDED','REJECTED') NOT NULL DEFAULT 'NONE',
  `recommendedBy` varchar(191) DEFAULT NULL,
  `recommendedAt` datetime(3) DEFAULT NULL,
  `approvedBy` varchar(191) DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `userId`, `organizationId`, `memberId`, `status`, `membershipType`, `dateJoined`, `dateExpired`, `isActive`, `dateOfBirth`, `gender`, `occupation`, `address`, `emergencyContact`, `emergencyPhone`, `metadata`, `createdAt`, `updatedAt`, `recommendationStatus`, `recommendedBy`, `recommendedAt`, `approvedBy`, `approvedAt`, `rejectionReason`) VALUES
('de10819f-0034-4ff6-9516-3ac5df4691ed', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', '00341048-c0c4-4fc1-b2bd-271dcc6bdf57', 'TMC/01/01/0001', 'ACTIVE', 'REGULAR', '2026-02-13 09:02:11.351', NULL, 1, '1973-12-09 00:00:00.000', 'MALE', 'Self-Employed / Business Owner', 'Felele Branch, Ibadan South-East, Oyo, NG', 'Adelopo Abdul Azeez', '08028511129', '{\"fullName\":\"Adelopo abdulazeez Oriyomi\",\"country\":\"NG\",\"state\":\"Oyo\",\"lga\":\"Ibadan South-East\",\"branch\":\"Felele Branch\",\"whatsapp_number\":\"08028511129\",\"state_of_origin\":\"Ogun\",\"lga_of_origin\":\"Ijebu Ode\",\"qualification\":\"Diploma / Certificate\",\"specialization\":\"software\",\"years_of_experience\":10,\"membership_duration\":12,\"educationHistory\":[{\"institution\":\"university of lagos\",\"course\":\"electrical/electronics engineering\",\"degreeClass\":\"Third Class\",\"yearAdmitted\":1991,\"yearGraduated\":2001}],\"blood_group\":\"A+\",\"genotype\":\"AA\",\"specific_ailment\":\"nil\",\"hospital\":\"Al-hayyu hospital\",\"phone\":\"08028511129\",\"maritalStatus\":\"MARRIED\",\"dateOfMarriage\":\"1973-12-09\",\"numChildrenMale\":7,\"numChildrenFemale\":0}', '2026-02-12 17:14:12.835', '0000-00-00 00:00:00.000', 'NONE', NULL, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-13 09:02:11.351', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(191) NOT NULL,
  `chatId` varchar(191) NOT NULL,
  `senderId` varchar(191) NOT NULL,
  `content` text DEFAULT NULL,
  `mediaUrl` varchar(191) DEFAULT NULL,
  `readBy` longtext DEFAULT NULL CHECK (json_valid(`readBy`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `navigation_items`
--

CREATE TABLE `navigation_items` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `path` varchar(191) DEFAULT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `type` varchar(191) NOT NULL DEFAULT 'link',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `navigation_items`
--

INSERT INTO `navigation_items` (`id`, `organizationId`, `label`, `path`, `parentId`, `order`, `type`, `isActive`, `createdAt`, `updatedAt`) VALUES
('091b7b59-7a7b-4bf2-8275-e4a7b1530cbb', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Media Library', '/media', NULL, 7, 'link', 1, '2026-02-09 18:17:06.712', '0000-00-00 00:00:00.000'),
('697cea1e-d75f-41ce-be4d-c0e9c6963de9', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Constitution', '/constitution', NULL, 2, 'link', 1, '2026-02-09 18:17:06.690', '0000-00-00 00:00:00.000'),
('8be879a8-ce54-4b67-9e8b-505362cc6ae9', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Adhkar Centres', '/adhkar', NULL, 3, 'link', 1, '2026-02-09 18:17:06.694', '0000-00-00 00:00:00.000'),
('8e7a922a-d731-4def-8570-45829f0f8961', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Teskiyah Centres', '/teskiyah', NULL, 4, 'link', 1, '2026-02-09 18:17:06.698', '0000-00-00 00:00:00.000'),
('9074c1a4-4e2e-4f76-8d0b-fc8c8820d2cf', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Dashboard', '/dashboard', NULL, 1, 'link', 1, '2026-02-09 18:17:06.686', '0000-00-00 00:00:00.000'),
('aaff04a4-9ee5-43fa-8f01-bffb654747eb', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Donate', '/donate', NULL, 6, 'link', 1, '2026-02-09 18:17:06.709', '0000-00-00 00:00:00.000'),
('ba3bb186-6b35-497f-b241-343029e0c7f6', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Home', '/', NULL, 0, 'link', 1, '2026-02-09 18:17:06.680', '0000-00-00 00:00:00.000'),
('bb59600f-a8c6-4ba1-bc2c-e7ab91c8e78e', 'c02137d0-c3c1-445d-9d1a-92c7be200332', 'Events', '/programmes', NULL, 5, 'link', 1, '2026-02-09 18:17:06.705', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ERROR') NOT NULL DEFAULT 'INFO',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `actionUrl` varchar(191) DEFAULT NULL,
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `userId`, `title`, `message`, `type`, `isRead`, `actionUrl`, `metadata`, `createdAt`, `updatedAt`) VALUES
('32af1385-5b49-4556-98d4-ca554e6d6293', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Membership Approved', 'Congratulations! Your membership has been approved. Your Member ID is TMC/01/01/0001.', 'SUCCESS', 0, NULL, NULL, '2026-02-13 10:02:11.409', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `occasion_requests`
--

CREATE TABLE `occasion_requests` (
  `id` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `typeId` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `date` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `time` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `role` enum('COORDINATING','WITNESS') NOT NULL,
  `certificateNeeded` tinyint(1) DEFAULT 0,
  `status` enum('PENDING','APPROVED','COMPLETED','REJECTED') DEFAULT 'PENDING',
  `paymentStatus` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
  `amount` decimal(10,2) DEFAULT 0.00,
  `details` longtext DEFAULT NULL CHECK (json_valid(`details`)),
  `certificateNo` varchar(255) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `occasion_types`
--

CREATE TABLE `occasion_types` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `certificateFee` decimal(10,2) DEFAULT 0.00,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `offices`
--

CREATE TABLE `offices` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
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
  `bio` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `image` varchar(500) DEFAULT NULL
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
  `welcomeMessage` text DEFAULT NULL,
  `welcomeImageUrl` varchar(191) DEFAULT NULL,
  `googleMapUrl` text DEFAULT NULL,
  `socialLinks` longtext DEFAULT NULL CHECK (json_valid(`socialLinks`)),
  `missionText` text DEFAULT NULL,
  `visionText` text DEFAULT NULL,
  `whatsapp` varchar(191) DEFAULT NULL,
  `officeHours` varchar(191) DEFAULT NULL,
  `sliderImages` longtext DEFAULT NULL CHECK (json_valid(`sliderImages`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `accountNumber` varchar(191) DEFAULT NULL,
  `bankCode` varchar(191) DEFAULT NULL,
  `bankName` varchar(191) DEFAULT NULL,
  `paystackSubaccountCode` varchar(191) DEFAULT NULL,
  `planningDeadlineDay` int(11) DEFAULT 12,
  `planningDeadlineMonth` int(11) DEFAULT 12
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `name`, `level`, `code`, `parentId`, `description`, `address`, `city`, `state`, `country`, `phone`, `email`, `website`, `welcomeMessage`, `welcomeImageUrl`, `googleMapUrl`, `socialLinks`, `missionText`, `visionText`, `whatsapp`, `officeHours`, `sliderImages`, `isActive`, `createdAt`, `updatedAt`, `accountNumber`, `bankCode`, `bankName`, `paystackSubaccountCode`, `planningDeadlineDay`, `planningDeadlineMonth`) VALUES
('00341048-c0c4-4fc1-b2bd-271dcc6bdf57', 'Ona Ara', 'LOCAL_GOVERNMENT', 'OYO-ONAARA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.429', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('00923e94-d94a-4de2-ad7e-62a84f096b81', 'Shagari Branch', 'BRANCH', 'OYO-OLUYOLE-SHAGARIBRA', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.374', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0159b9cd-41a3-4b40-8575-8558ea803507', 'Alimosho', 'BRANCH', 'LAG-ALIMOSHO-ALIMOSHO', '4c085f63-5d97-4169-9c37-ebcb5d79efdd', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.549', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('017b682d-7d25-4220-a388-ca59236446dd', 'Dutse', 'BRANCH', 'FCT-KUJE-DUTSE', '0f08eb92-69dd-43f1-9246-383b26dbdba2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.561', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('01a234e4-ff24-423f-8e0b-5d601504900d', 'Meiran', 'BRANCH', 'LAG-AGBADOOKEO-MEIRAN', 'd6cfd230-e2d2-4b68-80a4-948c208dd771', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.369', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('033bf3d2-0abc-4e02-8f2d-b2676a4f14f9', 'Owode Ede', 'BRANCH', 'OSU-OSOGBO-OWODEEDE', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.788', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('03669b3f-413c-4e2e-94d7-2f7062767450', 'Gauraka Branch', 'BRANCH', 'NIG-SULEJA-GAURAKABRA', '4583783c-c4a4-44df-909e-4793cffa3aaa', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.837', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0476b57f-ed57-4d77-a97e-34e4f9d889ef', 'Etsako Central', 'LOCAL_GOVERNMENT', 'EDO-ETSAKOCENT', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.054', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('04b255b4-c2c9-4044-afec-49a0c9358ac4', 'Phoenix', 'BRANCH', 'LAG-IKORODUNOR-PHOENIX', '45adde51-4ddb-4264-a781-9a87e5c6bf4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.287', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('04ddca63-19d1-4119-8f82-75a99c8b4365', 'Oyo East', 'LOCAL_GOVERNMENT', 'OYO-OYOEAST', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.443', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('05fc5103-95c5-4fb6-9db6-a979de577fd9', 'Ilorin South', 'LOCAL_GOVERNMENT', 'KWA-ILORINSOUT', 'c02d443f-3732-4f31-9832-6d9b4513c1ff', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.922', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('06404ede-7429-43d4-8617-5f93026d4b85', 'Ilupeju', 'BRANCH', 'LAG-ODIOLOWO-ILUPEJU', 'bb81e69b-37ce-4aab-931a-2405e2cdf155', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.634', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('06ad035b-a1e5-4eea-9715-66b2de2e2d29', 'Owutu', 'BRANCH', 'LAG-IKORODU-OWUTU', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.266', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('08fc1833-77e3-4034-9b83-5bc1a68c2c24', 'Alakara', 'BRANCH', 'LAG-ODIOLOWO-ALAKARA', 'bb81e69b-37ce-4aab-931a-2405e2cdf155', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.628', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0977c7b7-f5ce-4d30-8643-50702dc503ae', 'Wulemotu', 'BRANCH', 'OGU-IJEBUODE-WULEMOTU', '35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.414', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('09f12b3f-aa26-4bcf-b92c-cefb2e07f9ce', 'Ado-Ekiti Branch', 'BRANCH', 'EKI-ADOEKITI-ADOEKITIBR', 'fd2adc2c-c64b-4c8b-a87c-be284592be5f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.439', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0a6fd1b2-ab1f-43cb-94ff-e3eb57362f05', 'Orilowo', 'BRANCH', 'LAG-EJIGBO-ORILOWO', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.703', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0aa1955a-e848-49d6-a02a-460980c0b566', 'Oshodi / Isolo', 'LOCAL_GOVERNMENT', 'LAG-OSHODIISOL', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.666', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0af70c16-e935-450b-a57b-b5c9747439d6', 'Ojuelegba', 'BRANCH', 'LAG-SURULERE-OJUELEGBA', 'a29e14b5-9958-451b-9b32-3828e3b20083', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.725', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0b4a3bc4-783e-4d2f-8c85-e352051460b5', 'Allahu Lateef Area', 'BRANCH', 'OSU-OSOGBO-ALLAHULATE', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.797', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0b518310-6daa-4870-9971-e688a459b1c8', 'Imepe', 'BRANCH', 'OGU-IJEBUODE-IMEPE', '35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.959', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0bbd7edd-2f02-438e-a717-7abc36a36791', 'Itesiwaju', 'LOCAL_GOVERNMENT', 'OYO-ITESIWAJU', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.297', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0c9348c7-96cf-4575-887f-f03a4b85c95f', 'Imasayi', 'BRANCH', 'OGU-YEWANORTH-IMASAYI', 'e76e3e28-45bf-4d4d-b980-274e90f14090', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.469', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0cd6db9e-2358-4706-8084-04b2c6451edb', 'Lakoto Branch', 'BRANCH', 'OYO-IDO-LAKOTOBRAN', 'fe56a4d0-3075-4dd1-a677-26207d218b0a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.242', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0f08eb92-69dd-43f1-9246-383b26dbdba2', 'Kuje', 'LOCAL_GOVERNMENT', 'FCT-KUJE', '3f10e607-8148-4e25-a885-1a7f85a53c68', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.556', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0f3766a7-d84f-4b47-9cc6-6d017ed4a35c', 'Fate Branch', 'BRANCH', 'KWA-ILORINEAST-FATEBRANCH', 'fb5f2996-9fb0-47ac-b1c8-870f458a0d6f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.886', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('0fda0068-6117-4f1d-bdb7-8969810bdd70', 'Isokun titun Branch', 'BRANCH', 'OYO-OYOWEST-ISOKUNTITU', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.558', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('11136a44-bb8e-45bc-a593-9581a5c988bc', 'Isolo', 'BRANCH', 'LAG-ISOLO-ISOLO', '9ddb5449-3cc5-42d2-984f-bf408d74b141', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.367', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1129b340-592c-4c8f-9894-ebb484f26244', 'Surulere', 'LOCAL_GOVERNMENT', 'OYO-SURULERE', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.614', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('11b605c0-39fe-421d-8b79-5d3c76fc180b', 'Sade', 'BRANCH', 'LAG-EPE-SADE', '2bb29b8f-9f8a-4e51-b748-bb6fbd5a485b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.804', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1365d838-7fb6-4794-a9f4-a20dbec2c4bd', 'Ibarapa Central', 'LOCAL_GOVERNMENT', 'OYO-IBARAPACEN', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.208', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('15939988-312f-4982-8f5c-75b1107b3a06', 'Enuoranoba Branch', 'BRANCH', 'OYO-OYOWEST-ENUORANOBA', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.510', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('15abfa33-13ba-41c8-b2a0-2ec718fbef5e', 'Kajola', 'LOCAL_GOVERNMENT', 'OYO-KAJOLA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.306', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1746b2f4-4b3c-41b5-8e3a-0fd2e0f42328', 'Ayegbami', 'BRANCH', 'OGU-IKENNE-AYEGBAMI', '53cdd1f0-7816-4f5f-97f7-e59183a78abf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.437', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1769a4b3-eff6-4b56-b815-21ae23d5c1a2', 'Edo', 'STATE', 'EDO', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.017', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('17ca4cc6-56bc-4638-afbf-7801d3c379a4', 'Kube Branch', 'BRANCH', 'OYO-IBADANNORT-KUBEBRANCH', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.913', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1811ad16-6769-4741-af3b-fd64f8d38b31', 'Anu Oluwapo', 'BRANCH', 'OSU-IFELODUN-ANUOLUWAPO', 'e60dad2c-31c7-458f-80ff-1ed6d375f93e', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.679', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1998a15e-a8ab-445a-bc8b-1fd967ab1b08', 'Ibadan South-East', 'LOCAL_GOVERNMENT', 'OYO-IBADANSOUT', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.127', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('19b97612-db71-434c-a8cb-f7507beedb9c', 'Makoko', 'BRANCH', 'LAG-LAGOSMAINL-MAKOKO', 'f48a61ab-90ad-4866-9349-1b1e557bfe06', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.491', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1aa76b86-5929-4ac3-9769-1e4e8862ef10', 'Oke Gada Area', 'BRANCH', 'OSU-EDE-OKEGADAARE', 'ae73f1fd-757b-444b-a727-ec97b7fce3f2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.647', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1b8f216e-77d6-437e-95a7-db95bd8b6240', 'Oke - Iro', 'BRANCH', 'OSU-ILESAEAST-OKEIRO', '6186e76f-eece-43be-aa27-08da971372ea', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.698', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1cd29007-2fdf-44c3-999e-6cec8c3765ba', 'Alagutan Branch', 'BRANCH', 'OYO-IBADANNORT-ALAGUTANBR', '96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.094', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1e04110f-5b3c-465b-886e-68c0f866f69e', 'Sarumi', 'BRANCH', 'LAG-AGEGE-SARUMI', '77aa9980-8f3c-429f-a76a-ee0a635577ad', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.476', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1e599796-058c-47b2-839b-1174411e3eae', 'Yewa South', 'LOCAL_GOVERNMENT', 'OGU-YEWASOUTH', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.473', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1ebfc0a7-c450-483a-933c-1dd701007f31', 'Better Life Area', 'BRANCH', 'OSU-OSOGBO-BETTERLIFE', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.777', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1f32459d-ed96-40df-9ed1-38ac22707e03', 'Maje Branch', 'BRANCH', 'NIG-GURARA-MAJEBRANCH', '83fbb35a-a7aa-44fb-825b-0d39e7bfc64f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.853', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('1f8172b9-f313-4ee8-8362-14458b8ffac8', 'Mushin', 'LOCAL_GOVERNMENT', 'LAG-MUSHIN', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.553', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('202b2b16-4f42-43f1-88e6-4c178136fe65', 'Ilaro', 'BRANCH', 'OGU-YEWASOUTH-ILARO', '1e599796-058c-47b2-839b-1174411e3eae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.478', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('20a135ce-8151-47c0-b0ee-2f398ef04405', 'Ile Adu Branch', 'BRANCH', 'OYO-IBADANNORT-ILEADUBRAN', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.905', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('20a345a9-962e-4a12-9b6d-3d0f96356b18', 'Ikole', 'LOCAL_GOVERNMENT', 'EKI-IKOLE', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.472', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('20d794e8-9d88-41d3-afef-4343d2a69043', 'Dopemu', 'BRANCH', 'LAG-AGEGE-DOPEMU', '77aa9980-8f3c-429f-a76a-ee0a635577ad', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.481', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('21e4352f-bb7f-42a2-bf9a-9c17353d5171', 'Amac', 'LOCAL_GOVERNMENT', 'FCT-AMAC', '3f10e607-8148-4e25-a885-1a7f85a53c68', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.508', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('21f168ce-c9dc-4166-b8b5-e0082f1f6d67', 'Lagos Island', 'LOCAL_GOVERNMENT', 'LAG-LAGOSISLAN', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.419', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('21f6d09e-4832-4bb3-8388-d4523f924039', 'Ibadan South-West', 'LOCAL_GOVERNMENT', 'OYO-IBADANSOUT-456', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.202', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('229e3d8b-6762-4069-b2c2-bda52282921d', 'Lambata Branch', 'BRANCH', 'NIG-GURARA-LAMBATABRA', '83fbb35a-a7aa-44fb-825b-0d39e7bfc64f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.863', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('242a72b8-d387-45b6-b37a-90a149756ee8', 'Eredo', 'LOCAL_GOVERNMENT', 'LAG-EREDO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.811', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('246638e3-6316-4400-8aa0-bf43ddbe7c49', 'Ado Odo Ota', 'LOCAL_GOVERNMENT', 'OGU-ADOODOOTA', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.661', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2495ce0d-8f0d-4bbf-b5ca-c9400ec5fa67', 'Owo', 'LOCAL_GOVERNMENT', 'OND-OWO', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.562', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('24fded9a-712e-472f-8224-5c330b17cd10', 'Community Rd', 'BRANCH', 'LAG-IGANDOIKOT-COMMUNITYR', '5a978f2a-5584-470c-a586-4909a53e7dc6', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.090', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('257204a0-a874-4e8b-9151-cbde0247fd64', 'Morogbo', 'BRANCH', 'LAG-OJO-MOROGBO', '7b4674fd-dbaa-44d5-bc69-3f357fbeb872', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.658', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2593585c-dd7f-48a3-8d8d-13bbf75d6577', 'Jakan Branch', 'BRANCH', 'OYO-IBADANNORT-JAKANBRANC', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.850', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('265f67de-3fe5-4b69-8141-f6fa3d780715', 'Pobe', 'BRANCH', 'OGU-BENINREPUB-POBE', '946ac8f5-15bc-4ee3-9792-668748d25a99', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.504', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('26baae3c-89fe-482b-a2b6-b8ed7ed90568', 'Iraye', 'BRANCH', 'LAG-EPE-IRAYE', '2bb29b8f-9f8a-4e51-b748-bb6fbd5a485b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.767', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('27099832-af14-4786-a249-3efa770774e2', 'Papa Branch', 'BRANCH', 'OYO-OLUYOLE-PAPABRANCH', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.425', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('27a64da2-0cbf-4286-911f-4b657bb44d94', 'Enuowa', 'BRANCH', 'LAG-LAGOSISLAN-ENUOWA', '21f168ce-c9dc-4166-b8b5-e0082f1f6d67', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.425', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('27b656d0-ec7d-4a88-834c-e39e92640f66', 'Agbala', 'BRANCH', 'LAG-IKORODU-AGBALA', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.245', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('28045619-9f8e-4d4b-ad4c-69dbbb6ce2b7', 'Bariga', 'LOCAL_GOVERNMENT', 'LAG-BARIGA', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.640', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('28d51592-7d5f-4ff9-8722-f8413fdddcbf', 'Ebute Meta', 'BRANCH', 'LAG-LAGOSMAINL-EBUTEMETA', 'f48a61ab-90ad-4866-9349-1b1e557bfe06', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.499', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2bb29b8f-9f8a-4e51-b748-bb6fbd5a485b', 'Epe', 'LOCAL_GOVERNMENT', 'LAG-EPE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.759', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2c5d0ee4-bfc5-4659-abc0-606509a34081', 'Onipanu', 'BRANCH', 'LAG-SHOMOLU-ONIPANU', '982bd888-3d0f-4059-957a-330db8f812ce', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.703', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2cef4086-0ba8-4fd7-8b65-eb9845d8274c', 'Akoko-Edo', 'LOCAL_GOVERNMENT', 'EDO-AKOKOEDO', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.022', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2d369a9c-6b0f-4d96-af4d-331cf3dedc14', 'Irewolede Branch', 'BRANCH', 'KWA-ILORINSOUT-IREWOLEDEB', '05fc5103-95c5-4fb6-9db6-a979de577fd9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.928', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2dbaba0c-95bc-42e9-a020-f70b103d3024', 'Igbo Ogijo', 'BRANCH', 'LAG-IKORODUNOR-IGBOOGIJO', '45adde51-4ddb-4264-a781-9a87e5c6bf4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.281', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2e2aa1bf-58d9-4d69-a561-355ecd9bc800', 'Akoka', 'BRANCH', 'LAG-SHOMOLU-AKOKA', '982bd888-3d0f-4059-957a-330db8f812ce', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.691', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('2fc62f62-149e-407f-87bd-c66cff67d3e2', 'Auchi Branch', 'BRANCH', 'EDO-BENIN-AUCHIBRANC', '7e1537ec-9ef7-483a-a9b5-066008203931', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.306', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('302eff83-c3fe-4fb9-92fb-e57c1e138f0b', 'Akoronfayo Branch', 'BRANCH', 'OYO-IBADANNORT-AKORONFAYO', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.863', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('306f03ba-7420-45c7-a06e-bd84ec8e254c', 'Ishagatedo', 'BRANCH', 'LAG-ISOLO-ISHAGATEDO', '9ddb5449-3cc5-42d2-984f-bf408d74b141', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.323', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('30e01a67-8d9f-4735-b11b-1e56d20aede6', 'Mulikudeen', 'BRANCH', 'LAG-OSHODIISOL-MULIKUDEEN', '0aa1955a-e848-49d6-a02a-460980c0b566', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.681', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('31fde040-a776-4598-8a68-6f677476a4ba', 'Olohungbebe Branch', 'BRANCH', 'OYO-IBADANNORT-OLOHUNGBEB', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.835', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('32b5d655-5046-42bf-a5be-f36bbb9f2a37', 'Bwari', 'BRANCH', 'FCT-BWARI-BWARI', '7063f95c-e72f-432b-8c83-bf5eb3c4e10f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.537', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('32e22381-65ae-47b6-9a13-fe6a7487af61', 'Sabo', 'BRANCH', 'OGU-ABEOKUTANO-SABO', 'c6f9ae0d-4b5e-424c-83dc-563e6f7b20b9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.640', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('334e9ce6-b1aa-47ba-bcc3-18f2fe91a71d', 'Odo Kekere', 'BRANCH', 'LAG-IKORODUNOR-ODOKEKERE', '45adde51-4ddb-4264-a781-9a87e5c6bf4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.297', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('352da378-837d-4b8c-ac0d-0428bf6211cb', 'Aba-Orioke Branch', 'BRANCH', 'OYO-OLUYOLE-ABAORIOKEB', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.404', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('35d6bff7-e1e3-4589-a945-7927853b38d9', 'Ojokoro', 'BRANCH', 'LAG-IFAKOIJAYE-OJOKORO', '3eb84eba-1b63-427b-bb2a-79b0b260f59d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.036', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', 'Ijebu Ode', 'LOCAL_GOVERNMENT', 'OGU-IJEBUODE', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.934', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('377ddde0-48ef-4005-9a9d-83614131ff07', 'Alagbado', 'BRANCH', 'LAG-AGBADOOKEO-ALAGBADO', 'd6cfd230-e2d2-4b68-80a4-948c208dd771', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.355', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3a2d967f-4a8f-4665-8346-9f19e2c40d00', 'Ipaja', 'BRANCH', 'LAG-AYOBOIPAJA-IPAJA', 'e3c8107c-cb3d-4212-be3d-048810cf2e39', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.605', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3a97e9e9-20be-44e9-8dc5-29cc8eb4e9b5', 'Ibarapa North', 'LOCAL_GOVERNMENT', 'OYO-IBARAPANOR', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.220', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3afc518a-5212-4c10-bd21-b4fafc368090', 'Oye', 'LOCAL_GOVERNMENT', 'EKI-OYE', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.460', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3b3ab797-3967-4591-9e24-007245e8ef89', 'Kubwa', 'BRANCH', 'FCT-KUJE-KUBWA', '0f08eb92-69dd-43f1-9246-383b26dbdba2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.571', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3c4e66a1-eb09-4295-9fa9-7c20e2a9109e', 'Randle', 'BRANCH', 'LAG-SURULERE-RANDLE', 'a29e14b5-9958-451b-9b32-3828e3b20083', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.736', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3c78938f-532e-4acd-bb5d-7d939452ff1d', 'Kuje', 'BRANCH', 'FCT-KUJE-KUJE', '0f08eb92-69dd-43f1-9246-383b26dbdba2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.584', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3ca84f62-e546-4bc2-b09c-837ea4233990', 'Itire', 'BRANCH', 'LAG-ITIREIKATE-ITIRE', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.401', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3da51d2d-be6f-4730-a605-bc67ed33190b', 'Iperu', 'BRANCH', 'OGU-IKENNE-IPERU', '53cdd1f0-7816-4f5f-97f7-e59183a78abf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.429', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3df53b97-8169-4a39-9402-df7a7903b511', 'Idi-Ape Branch', 'BRANCH', 'OYO-LAGELU-IDIAPEBRAN', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.320', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3eb84eba-1b63-427b-bb2a-79b0b260f59d', 'Ifako / Ijaye', 'LOCAL_GOVERNMENT', 'LAG-IFAKOIJAYE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.025', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3ebc0b93-c743-419c-8493-59648ffa2dbf', 'Ikotun', 'BRANCH', 'LAG-IGANDOIKOT-IKOTUN', '5a978f2a-5584-470c-a586-4909a53e7dc6', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.074', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('3f10e607-8148-4e25-a885-1a7f85a53c68', 'FCT', 'STATE', 'FCT', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.502', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4011f883-b6c9-42f9-a6b8-4aac6a5aaf89', 'Onikeke Branch', 'BRANCH', 'OYO-OYOWEST-ONIKEKEBRA', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.572', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4056113a-a0d0-4e9b-a076-0a4d92976868', 'Apapa Road', 'BRANCH', 'LAG-LAGOSMAINL-APAPAROAD', 'f48a61ab-90ad-4866-9349-1b1e557bfe06', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.506', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('407daaec-6f76-4e25-918d-6a67df8e4e3b', 'Alapere', 'BRANCH', 'LAG-IKOSIISHER-ALAPERE', 'c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.192', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('40c8fa91-7831-4c72-8927-d08a9a4c5429', 'Kugba', 'BRANCH', 'OGU-ABEOKUTANO-KUGBA', 'c6f9ae0d-4b5e-424c-83dc-563e6f7b20b9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.645', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('44266a56-29c4-4682-af71-277d0bc7b34e', 'Ojodu', 'BRANCH', 'LAG-IKEJA-OJODU', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.156', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('44e4b7b6-7391-494a-b541-dfba0669279a', 'Ikere', 'LOCAL_GOVERNMENT', 'EKI-IKERE', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.445', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4583783c-c4a4-44df-909e-4793cffa3aaa', 'Suleja', 'LOCAL_GOVERNMENT', 'NIG-SULEJA', 'e28b2695-60e5-43fa-9e27-9de77c5ac766', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.828', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('45adde51-4ddb-4264-a781-9a87e5c6bf4b', 'Ikorodu North', 'LOCAL_GOVERNMENT', 'LAG-IKORODUNOR', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.272', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4694a1c7-2e75-424a-a596-78f0f5d815b9', 'Olomi Branch', 'BRANCH', 'OYO-OLUYOLE-OLOMIBRANC', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.384', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('46c3b46d-1e41-48f2-a996-f83ab54ee4db', 'Mowe', 'BRANCH', 'LAG-IKEJA-MOWE', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.168', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('48ecbc14-baaf-4dc0-a08d-d6bbfad1fb86', 'Atan', 'BRANCH', 'OGU-ADOODOOTA-ATAN', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.691', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('48f47e05-7d8c-49c6-b4b2-dbb87142cae7', 'Topo', 'BRANCH', 'LAG-BADAGRY-TOPO', 'ce933ad5-f4da-4493-9873-8961f220760d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.630', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('494e7460-8ede-465f-a09b-92ef77d2d959', 'Ejigbo', 'LOCAL_GOVERNMENT', 'LAG-EJIGBO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.680', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4a3bc42d-8e83-4c38-9a47-fb37dbe5a928', 'Aba-Ode Branch', 'BRANCH', 'OYO-OLUYOLE-ABAODEBRAN', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.399', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4abca202-bcca-4ad9-98f0-24bf35b79910', 'Olorunishola', 'BRANCH', 'LAG-MUSHIN-OLORUNISHO', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.597', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4b7daf9c-363e-4747-baa1-c4b813a35855', 'Orelope', 'LOCAL_GOVERNMENT', 'OYO-ORELOPE', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.434', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4c085f63-5d97-4169-9c37-ebcb5d79efdd', 'Alimosho', 'LOCAL_GOVERNMENT', 'LAG-ALIMOSHO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.532', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4d2b2c71-8d15-4a5d-a181-5af778038165', 'Vlekete', 'BRANCH', 'LAG-BADAGRY-VLEKETE', 'ce933ad5-f4da-4493-9873-8961f220760d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.635', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('4f61d337-c49f-45d5-bea0-ae4bd5a18723', 'Agiliti', 'BRANCH', 'LAG-IKOSIISHER-AGILITI', 'c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.207', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('511f6253-cc37-482f-a85c-0afacf9281ab', 'Okinni Area', 'BRANCH', 'OSU-OSOGBO-OKINNIAREA', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.782', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('51410935-8233-4b2d-9143-575859bac8d0', 'Fijabi Branch', 'BRANCH', 'OYO-IBADANNORT-FIJABIBRAN', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.884', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('515d710e-1d70-4e2d-9a13-77e0c119cd35', 'Bodija Branch', 'BRANCH', 'OYO-IBADANNORT-BODIJABRAN', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.840', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('51c6c906-0978-434e-b1f9-383541f464f2', 'Irorun Oluwa Branch', 'BRANCH', 'OYO-IBADANNORT-IRORUNOLUW', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.868', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('534c05a8-2e8a-4c32-aae9-f522615482e5', 'Ayetoro', 'BRANCH', 'OGU-YEWANORTH-AYETORO', 'e76e3e28-45bf-4d4d-b980-274e90f14090', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.464', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('538b85ae-7613-4074-a6ab-8cb91a3db50c', 'Arometa Branch', 'BRANCH', 'OYO-IBADANNORT-AROMETABRA', '96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.114', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('53986c22-e902-4ad5-aca7-ab34b921112f', 'Gbagada Lad-Lak', 'BRANCH', 'LAG-BARIGA-GBAGADALAD', '28045619-9f8e-4d4b-ad4c-69dbbb6ce2b7', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.651', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('53cdd1f0-7816-4f5f-97f7-e59183a78abf', 'Ikenne', 'LOCAL_GOVERNMENT', 'OGU-IKENNE', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.418', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5435677d-7a23-47a4-b3aa-9ec44ad5d33a', 'Ikakosunwon Branch', 'BRANCH', 'OYO-OYOWEST-IKAKOSUNWO', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.552', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('549aeb4e-e6cf-4040-b3d5-d1b353b93103', 'Iwaya', 'BRANCH', 'LAG-LAGOSMAINL-IWAYA', 'f48a61ab-90ad-4866-9349-1b1e557bfe06', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.485', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('54f004c3-e33c-4056-bee7-7181595c7ff5', 'Kwamba Branch', 'BRANCH', 'NIG-GURARA-KWAMBABRAN', '83fbb35a-a7aa-44fb-825b-0d39e7bfc64f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.857', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5621b90a-8ef3-4db8-a0a6-b7e5c3d8a0b0', 'Atiba', 'LOCAL_GOVERNMENT', 'OYO-ATIBA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.816', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('57d599ed-8340-48d1-ae00-20e6a518685d', 'Oyo West', 'LOCAL_GOVERNMENT', 'OYO-OYOWEST', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.448', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('58cc41bf-9372-4cd8-84d0-35dd2a72b7bc', 'Jikwoyi', 'BRANCH', 'FCT-AMAC-JIKWOYI', '21e4352f-bb7f-42a2-bf9a-9c17353d5171', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.524', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('591f7876-d85a-4796-b1a8-729092b932df', 'Sale General Area', 'BRANCH', 'OSU-ILESAWEST-SALEGENERA', 'c1e48c38-218a-468b-875f-ff08f367954c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.708', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('59f46715-13b7-43da-bf69-7d57c27ad0e2', 'Oye Branch', 'BRANCH', 'EKI-OYE-OYEBRANCH', '3afc518a-5212-4c10-bd21-b4fafc368090', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.465', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5a807a6e-3f90-492c-a7ea-094a317eea75', 'Saki West', 'LOCAL_GOVERNMENT', 'OYO-SAKIWEST', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.605', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5a978f2a-5584-470c-a586-4909a53e7dc6', 'Igando / Ikotun', 'LOCAL_GOVERNMENT', 'LAG-IGANDOIKOT', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.056', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5b2351d5-811a-42f9-a583-f08848add39a', 'Ogijo Central', 'BRANCH', 'LAG-IKORODUNOR-OGIJOCENTR', '45adde51-4ddb-4264-a781-9a87e5c6bf4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.277', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5bc7bf36-cfdd-46e2-8d9d-8e86214cd3df', 'Ayedire', 'LOCAL_GOVERNMENT', 'OSU-AYEDIRE', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.624', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5d27655c-a167-4a60-98b1-7aaac12307e5', 'Station', 'BRANCH', 'OGU-IKENNE-STATION', '53cdd1f0-7816-4f5f-97f7-e59183a78abf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.443', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5de88362-4a1d-44b1-94ac-d64a75fb6656', 'Abeokuta South', 'LOCAL_GOVERNMENT', 'OGU-ABEOKUTASO', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.655', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5f2a0c1b-00b5-446d-8e9c-115069086bbb', 'Irepo', 'LOCAL_GOVERNMENT', 'OYO-IREPO', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.272', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('5fb7d3bb-b186-4da3-891a-ba6b32277e65', 'Barrack', 'BRANCH', 'LAG-OJO-BARRACK', '7b4674fd-dbaa-44d5-bc69-3f357fbeb872', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.649', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('60b3de9a-e216-4d22-b077-7b436eae119d', 'Pobo', 'BRANCH', 'LAG-EREDO-POBO', '242a72b8-d387-45b6-b37a-90a149756ee8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.935', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6144eaf1-a6a6-4c9d-b408-3ada9cdd3522', 'Ifo', 'LOCAL_GOVERNMENT', 'OGU-IFO', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.877', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6186e76f-eece-43be-aa27-08da971372ea', 'Ilesa East', 'LOCAL_GOVERNMENT', 'OSU-ILESAEAST', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.683', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('62cf1242-d683-4034-8534-73331df2ca70', 'Ikenne', 'BRANCH', 'OGU-IKENNE-IKENNE', '53cdd1f0-7816-4f5f-97f7-e59183a78abf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.423', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('63506ee0-d8a9-49ac-baf7-ccd39612d09d', 'Odo Oba Branch', 'BRANCH', 'OYO-IBADANSOUT-ODOOBABRAN', '1998a15e-a8ab-445a-bc8b-1fd967ab1b08', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.136', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('635b1e64-6bd1-4ca9-a8f7-ce6e739fa1b3', 'Ifako', 'BRANCH', 'LAG-IFAKOIJAYE-IFAKO', '3eb84eba-1b63-427b-bb2a-79b0b260f59d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.031', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('63a61393-9b13-4db1-b523-8c0e1852846b', 'Iwo', 'LOCAL_GOVERNMENT', 'OSU-IWO', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.806', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('64f0aa66-4672-4e18-9869-981f54fba4a5', 'Oganla Branch', 'BRANCH', 'OYO-IBADANNORT-OGANLABRAN', '96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.108', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('650b1034-2f6f-487c-a19a-2fefa3d3dd4b', 'Ogun', 'STATE', 'OGU', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.589', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('654b376d-c1e5-44b4-b966-f3421045408e', 'Felele Branch', 'BRANCH', 'OYO-IBADANSOUT-FELELEBRAN', '1998a15e-a8ab-445a-bc8b-1fd967ab1b08', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.147', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6561ec1a-87c1-4219-9e06-a6e42346e50b', 'Igbe Lara', 'BRANCH', 'LAG-IGBOGBOBAY-IGBELARA', '848411a2-fdf6-408b-b98d-3fc674ac6fbe', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.110', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('65b8bdcb-6459-407b-a0c4-fe9a3fb7c314', 'Okitipupa Branch', 'BRANCH', 'OND-OKITIPUPA-OKITIPUPAB', 'b11422cd-4f3d-40d3-9104-5946c21b1204', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.576', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12);
INSERT INTO `organizations` (`id`, `name`, `level`, `code`, `parentId`, `description`, `address`, `city`, `state`, `country`, `phone`, `email`, `website`, `welcomeMessage`, `welcomeImageUrl`, `googleMapUrl`, `socialLinks`, `missionText`, `visionText`, `whatsapp`, `officeHours`, `sliderImages`, `isActive`, `createdAt`, `updatedAt`, `accountNumber`, `bankCode`, `bankName`, `paystackSubaccountCode`, `planningDeadlineDay`, `planningDeadlineMonth`) VALUES
('65d56817-1cb1-4ab6-9269-3d243f38bd4a', 'Isale Onikanga', 'BRANCH', 'LAG-ISOLO-ISALEONIKA', '9ddb5449-3cc5-42d2-984f-bf408d74b141', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.317', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('667ff8d2-6434-4fdd-8460-94627773f7e9', 'Oyo', 'STATE', 'OYO', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.741', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('669f36a1-8675-4179-8dd3-de9baf9193d9', 'Akinyele', 'LOCAL_GOVERNMENT', 'OYO-AKINYELE', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.747', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('673df4b0-0987-4ac6-b6c7-c281ce1dc7c1', 'Ijoko', 'BRANCH', 'OGU-ADOODOOTA-IJOKO', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.674', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('689c5a85-ace1-4b2c-83bc-d8bcb5e15f4f', 'Sanyo Branch', 'BRANCH', 'OYO-OLUYOLE-SANYOBRANC', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.414', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6a053512-9a13-4a1d-aa18-5e62d8805660', 'Ibadan North-East', 'LOCAL_GOVERNMENT', 'OYO-IBADANNORT-832', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.080', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6a2d3dcf-50e2-4160-93d7-ab43bdbf0fb9', 'Ogba', 'BRANCH', 'LAG-IKEJA-OGBA', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.130', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6ace5fc1-5f7b-48f8-9125-91cf03c338fa', 'Awotan Branch', 'BRANCH', 'OYO-IDO-AWOTANBRAN', 'fe56a4d0-3075-4dd1-a677-26207d218b0a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.248', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('6d21e636-82bf-438c-9356-64907a0a6977', 'Muslim Branch', 'BRANCH', 'OYO-IBADANSOUT-MUSLIMBRAN', '1998a15e-a8ab-445a-bc8b-1fd967ab1b08', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.132', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7063f95c-e72f-432b-8c83-bf5eb3c4e10f', 'Bwari', 'LOCAL_GOVERNMENT', 'FCT-BWARI', '3f10e607-8148-4e25-a885-1a7f85a53c68', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.530', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7086feef-0226-4893-8025-222cacbaefae', 'Ajah', 'BRANCH', 'LAG-ETIOSA-AJAH', 'de109e20-fb77-418b-b300-0030df667a71', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.980', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('71cb5669-f024-4e78-a5d9-2790a5fb9afa', 'Ikere Branch', 'BRANCH', 'EKI-IKERE-IKEREBRANC', '44e4b7b6-7391-494a-b541-dfba0669279a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.452', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('726f7c6d-2eed-443c-a76b-77b3a0c13dcd', 'Iso Osu Area', 'BRANCH', 'OSU-EDE-ISOOSUAREA', 'ae73f1fd-757b-444b-a727-ec97b7fce3f2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.651', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('73ed6f64-c148-48c2-88b9-8af70a09bb1d', 'Ketu', 'BRANCH', 'LAG-IKOSIISHER-KETU', 'c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.218', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('74e8bde3-40eb-444f-9cbb-b833c0daf9b3', 'Akingbola Branch', 'BRANCH', 'OYO-IBADANNORT-AKINGBOLAB', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.067', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7634407e-5c97-445e-ac94-11dfeffbf338', 'Gwagwalada', 'BRANCH', 'FCT-GWAGWALADA-GWAGWALADA', 'dd53925d-a06d-422c-978b-e6cadf533016', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.552', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('76561070-3fdc-4923-9fc6-029db4e7db21', 'Ajeromi / Ifelodun', 'LOCAL_GOVERNMENT', 'LAG-AJEROMIIFE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.497', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7682cc8a-d2a2-48d8-b138-6a1c2cb4a5e3', 'Apalara Branch', 'BRANCH', 'KWA-ILORINSOUT-APALARABRA', '05fc5103-95c5-4fb6-9db6-a979de577fd9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.937', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('77aa9980-8f3c-429f-a76a-ee0a635577ad', 'Agege', 'LOCAL_GOVERNMENT', 'LAG-AGEGE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.378', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('77b017f8-23b9-4fa1-8348-fe7eee26f187', 'Agura', 'BRANCH', 'OGU-SAGAMU-AGURA', 'eb53597e-306c-4310-9ded-0e0408e1b544', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.454', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('77d2d159-8601-4918-8f63-ce8532f2f3b0', 'Oke-Odo', 'BRANCH', 'LAG-AGBADOOKEO-OKEODO', 'd6cfd230-e2d2-4b68-80a4-948c208dd771', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.363', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('781c5ff2-698c-49cb-963a-58a2e4db70b2', 'Oru-Awa-Ilaporu', 'BRANCH', 'OGU-IJEBUNORTH-ORUAWAILAP', 'ac38121e-0025-43d5-b3f9-8f8483d08702', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.909', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('78228cab-67c8-445e-bcd6-f2c4778a5a65', 'Ogbomosho North', 'LOCAL_GOVERNMENT', 'OYO-OGBOMOSHON', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.349', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7964598d-49c8-4bc4-a9e3-e274bef7e79a', 'Aparadija', 'BRANCH', 'OGU-ADOODOOTA-APARADIJA', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.698', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('797a8ae3-31d4-4232-862a-f5cf7edc6587', 'Aguda', 'BRANCH', 'LAG-COKERAGUDA-AGUDA', 'bb86c11a-0ec6-4165-8318-5f338562e6cf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.675', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('79b4bf53-dd0d-473f-94b1-ec02ab80ffa0', 'Oke Are Branch', 'BRANCH', 'OYO-IBADANNORT-OKEAREBRAN', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.922', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('79de675c-1146-4246-a830-434d88ed7f7f', 'Iwajowa', 'LOCAL_GOVERNMENT', 'OYO-IWAJOWA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.301', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7a5c1ced-cc7c-4700-8854-9667272efadb', 'Idi-Oro Branch', 'BRANCH', 'OYO-IBADANNORT-IDIOROBRAN', '96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.103', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7b4674fd-dbaa-44d5-bc69-3f357fbeb872', 'Ojo', 'LOCAL_GOVERNMENT', 'LAG-OJO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.644', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7c39a01a-20b7-43a2-bdde-8994d445501a', 'Oke-Ode Branch', 'BRANCH', 'OYO-OLUYOLE-OKEODEBRAN', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.389', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7c79460c-7d33-45d1-a4b9-ddeb0c4fb6b5', 'Igbeba', 'BRANCH', 'OGU-IJEBUNORTH-IGBEBA', 'b55ecd7a-edc0-48c4-8a84-a650b618c6e2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.926', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7ca17ca9-d483-4056-94f9-bf791f122b13', 'Oke Baale Area', 'BRANCH', 'OSU-OSOGBO-OKEBAALEAR', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.772', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7e1537ec-9ef7-483a-a9b5-066008203931', 'Benin', 'LOCAL_GOVERNMENT', 'EDO-BENIN', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.065', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('7f35ce2f-c232-47ba-9bba-6b9d18023a93', 'Alaro Branch', 'BRANCH', 'OYO-IBADANNORT-ALAROBRANC', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.888', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8156a3d6-1747-4b2f-8251-c9918ad4d081', 'Ijaiye', 'BRANCH', 'OGU-ABEOKUTANO-IJAIYE', 'c6f9ae0d-4b5e-424c-83dc-563e6f7b20b9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.650', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('817bb8f4-cbec-4836-a003-42244ecead5c', 'Magboro', 'BRANCH', 'LAG-IKEJA-MAGBORO', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.175', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('81f77bb0-a22d-441d-a1a1-0d9f59a2d308', 'Oke-Imale / Sangotedo', 'BRANCH', 'LAG-ETIOSA-OKEIMALESA', 'de109e20-fb77-418b-b300-0030df667a71', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.994', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('825348a5-c0d1-4954-9559-a2456add6c4e', 'Cosco Branch', 'BRANCH', 'NIG-SULEJA-COSCOBRANC', '4583783c-c4a4-44df-909e-4793cffa3aaa', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.833', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('82b38e6c-43eb-4625-a3ab-ed490e517895', 'Olorundaba Branch', 'BRANCH', 'OYO-LAGELU-OLORUNDABA', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.330', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('82dd1c5e-c660-4e31-b7ff-b01570b31eaa', 'Ese Odo', 'LOCAL_GOVERNMENT', 'OND-ESEODO', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.557', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('83b964e7-7ebf-43a7-bb64-d63a3fc30412', 'Eleko', 'BRANCH', 'LAG-IBEJULEKKI-ELEKO', 'e8ed9f57-449f-4d49-8b34-a9f4d3cf6b40', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.017', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('83fbb35a-a7aa-44fb-825b-0d39e7bfc64f', 'Gurara', 'LOCAL_GOVERNMENT', 'NIG-GURARA', 'e28b2695-60e5-43fa-9e27-9de77c5ac766', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.848', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('842f79b7-0ee9-440b-b6ab-088d6b1ee57b', 'Ijebu Igbo', 'BRANCH', 'OGU-IJEBUNORTH-IJEBUIGBO', 'ac38121e-0025-43d5-b3f9-8f8483d08702', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.888', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('848411a2-fdf6-408b-b98d-3fc674ac6fbe', 'Igbogbo / Bayeku', 'LOCAL_GOVERNMENT', 'LAG-IGBOGBOBAY', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.095', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('84d75d49-58b6-4ccc-9361-ad8e0bdf2cef', 'Water Branch', 'BRANCH', 'OYO-IBADANNORT-WATERBRANC', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.846', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('85e00b2f-0f47-4200-b0e5-608913c26e91', 'Oke-Balogun', 'BRANCH', 'LAG-EPE-OKEBALOGUN', '2bb29b8f-9f8a-4e51-b748-bb6fbd5a485b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.776', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('863c7d5c-65b0-4422-ac06-e1d2c63ca255', 'Ededimeji Area', 'BRANCH', 'OSU-EDE-EDEDIMEJIA', 'ae73f1fd-757b-444b-a727-ec97b7fce3f2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.641', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8665d16a-a42a-4113-a70a-aa7eae63bb90', 'Jakande', 'BRANCH', 'LAG-EJIGBO-JAKANDE', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.695', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('866e9872-423d-4a15-8a96-d7a00d469c88', 'L & K Oworo', 'BRANCH', 'LAG-KOSOFE-LKOWORO', 'fa999f76-3f93-4547-9609-203503f59107', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.446', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('86ed4ce5-3f81-4c84-b3e1-0462cd3fc173', 'Ota', 'BRANCH', 'OGU-ADOODOOTA-OTA', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.681', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8763e41b-58c8-4912-afcb-db6b36cf7dff', 'Egbeda', 'LOCAL_GOVERNMENT', 'OYO-EGBEDA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.825', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('87a11749-f9d5-4ccb-a286-c28a97db19ff', 'Pako', 'BRANCH', 'LAG-ITIREIKATE-PAKO', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.406', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('87e74f8a-1017-42bc-bca5-33b3b96c7b84', 'Ota-Ona', 'BRANCH', 'LAG-IKORODU-OTAONA', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.260', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8a7ddeda-27ab-43fc-9ced-0dae28a66299', 'Gold and rock Branch', 'BRANCH', 'OYO-OYOWEST-GOLDANDROC', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.582', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8add880a-f020-433d-a6bc-1de7e07722d7', 'Orile', 'BRANCH', 'LAG-AGEGE-ORILE', '77aa9980-8f3c-429f-a76a-ee0a635577ad', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.389', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8ae43764-4771-41fb-8f17-a7d4aca9e4b9', 'Lawyer Atanda Estate', 'BRANCH', 'OSU-IWO-LAWYERATAN', '63a61393-9b13-4db1-b523-8c0e1852846b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.818', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8d2694bf-1b77-466a-9092-83003e58bc92', 'Ikeja', 'LOCAL_GOVERNMENT', 'LAG-IKEJA', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.121', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('8f738258-9fcd-4bea-9aee-a22943719c0b', 'Temidere', 'BRANCH', 'OGU-IJEBUODE-TEMIDERE', '35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.969', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('918730e1-5d62-414b-8498-9ec0e0d59f25', 'Egbeda', 'BRANCH', 'LAG-ALIMOSHO-EGBEDA', '4c085f63-5d97-4169-9c37-ebcb5d79efdd', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.566', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('91ab2647-cd4c-4974-8fd3-d69ad5b57c72', 'Chanchaga Branch', 'BRANCH', 'NIG-CHANCHAGA-CHANCHAGAB', 'ffe12374-ee9a-4986-a9d0-18381765c14a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.872', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9372aeba-b352-4720-a0ac-621e156d4596', 'Akure South', 'LOCAL_GOVERNMENT', 'OND-AKURESOUTH', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.541', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9380ed95-6738-4c36-9d3f-4374b04c4275', 'Ikunna', 'BRANCH', 'LAG-EJIGBO-IKUNNA', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.734', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('93a2e4b5-8fe5-4891-9de2-0aecff62a9df', 'Saki East', 'LOCAL_GOVERNMENT', 'OYO-SAKIEAST', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.593', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('946ac8f5-15bc-4ee3-9792-668748d25a99', 'Benin Republic', 'LOCAL_GOVERNMENT', 'OGU-BENINREPUB', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.499', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9485a831-ad14-46c6-ab2d-4981553c1c89', 'Agbele', 'BRANCH', 'LAG-IKORODU-AGBELE', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.255', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('95f6660e-a3b6-465d-9e47-38f9c7717fe3', 'Oko Baba', 'BRANCH', 'LAG-LAGOSMAINL-OKOBABA', 'f48a61ab-90ad-4866-9349-1b1e557bfe06', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.515', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('96a22598-09fc-4406-9216-0f15327ae699', 'Akingbile Branch', 'BRANCH', 'OYO-AKINYELE-AKINGBILEB', '669f36a1-8675-4179-8dd3-de9baf9193d9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.764', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('96ac2af6-ce5a-47f4-8a2c-0fd71714c0fa', 'Ijora Badia', 'BRANCH', 'LAG-AJEROMIIFE-IJORABADIA', '76561070-3fdc-4923-9fc6-029db4e7db21', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.520', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', 'Ibadan North-West', 'LOCAL_GOVERNMENT', 'OYO-IBADANNORT-46', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.089', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9763da71-21bd-483d-b7c1-2005fd0add4f', 'Akowonjo', 'BRANCH', 'LAG-ALIMOSHO-AKOWONJO', '4c085f63-5d97-4169-9c37-ebcb5d79efdd', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.543', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('982bd888-3d0f-4059-957a-330db8f812ce', 'Shomolu', 'LOCAL_GOVERNMENT', 'LAG-SHOMOLU', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.686', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('983952e3-7cfd-4ee6-9d9c-146fd5e2958e', 'Daleko', 'BRANCH', 'LAG-EJIGBO-DALEKO', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.687', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('98f191d5-f602-4947-a90e-a9accfd6c6e9', 'Idi-Ose Branch', 'BRANCH', 'OYO-AKINYELE-IDIOSEBRAN', '669f36a1-8675-4179-8dd3-de9baf9193d9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.758', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('99338ebc-b0dc-427f-935a-ec9b2ed6abea', 'Egan', 'BRANCH', 'LAG-IGANDOIKOT-EGAN', '5a978f2a-5584-470c-a586-4909a53e7dc6', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.085', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9adeb9ed-3c4c-4550-a3be-1a51bbce41ab', 'Aseeke Branch', 'BRANCH', 'OYO-OYOWEST-ASEEKEBRAN', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.505', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9b22dabb-6440-4b14-8847-90fd747fbf7a', 'Mamu', 'BRANCH', 'OGU-IJEBUNORTH-MAMU', 'ac38121e-0025-43d5-b3f9-8f8483d08702', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.913', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9d2f31c0-bfc1-41f0-8d23-180ed941eba0', 'Ikorodu', 'LOCAL_GOVERNMENT', 'LAG-IKORODU', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.234', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9d5235e9-a568-4530-84c2-a1f279d34eb8', 'Niyi', 'BRANCH', 'LAG-EJIGBO-NIYI', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.750', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9ddb5449-3cc5-42d2-984f-bf408d74b141', 'Isolo', 'LOCAL_GOVERNMENT', 'LAG-ISOLO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.302', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('9fcd29da-51f4-439b-9483-9d061909a68f', 'Monatan Branch', 'BRANCH', 'OYO-LAGELU-MONATANBRA', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.335', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a02ff7b5-ce35-4a40-a3e8-d052a2976371', 'Esan Central', 'LOCAL_GOVERNMENT', 'EDO-ESANCENTRA', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.038', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a09249bc-e408-42bd-bea7-26f90e2ccf70', 'Alhaji Hassan', 'BRANCH', 'LAG-AYOBOIPAJA-ALHAJIHASS', 'e3c8107c-cb3d-4212-be3d-048810cf2e39', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.595', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a0db18f8-5581-48d3-bfde-6796fc168c66', 'Oke Odo', 'BRANCH', 'OSU-IWO-OKEODO', '63a61393-9b13-4db1-b523-8c0e1852846b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.814', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a1882773-2e6d-46ab-9893-f4830228dc8d', 'Itire / Ikate', 'LOCAL_GOVERNMENT', 'LAG-ITIREIKATE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.379', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a18c48a2-01a7-4417-b36b-ac7878964db6', 'Oju-Irin Branch', 'BRANCH', 'OYO-IBADANNORT-OJUIRINBRA', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.879', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a1cc07ef-999e-43ad-ab31-8341bddde59f', 'Ido Branch', 'BRANCH', 'OYO-IDO-IDOBRANCH', 'fe56a4d0-3075-4dd1-a677-26207d218b0a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.255', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a24e17ae-2b13-4f20-a5bd-8166a17249d4', 'Akoko North-West', 'LOCAL_GOVERNMENT', 'OND-AKOKONORTH-315', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.526', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a26cb626-0322-4418-a406-9c18f57d6a2d', 'Owode', 'BRANCH', 'OGU-YEWASOUTH-OWODE', '1e599796-058c-47b2-839b-1174411e3eae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.491', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a29e14b5-9958-451b-9b32-3828e3b20083', 'Surulere', 'LOCAL_GOVERNMENT', 'LAG-SURULERE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.719', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a2acc34e-d8e2-4792-a950-ca5da744ea50', 'Olodo Branch', 'BRANCH', 'OYO-LAGELU-OLODOBRANC', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.344', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a2f83826-3dbb-4f1f-91da-9250a58ff5ef', 'Morocco', 'BRANCH', 'LAG-SHOMOLU-MOROCCO', '982bd888-3d0f-4059-957a-330db8f812ce', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.697', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a4108dae-39cd-4ffd-8ba5-fa4f21fbde95', 'Ago-Iwoye', 'BRANCH', 'OGU-IJEBUNORTH-AGOIWOYE', 'ac38121e-0025-43d5-b3f9-8f8483d08702', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.891', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a45469ca-a463-4a6c-ab0a-b4d7a133c5ed', 'Omilabu Branch', 'BRANCH', 'OYO-AKINYELE-OMILABUBRA', '669f36a1-8675-4179-8dd3-de9baf9193d9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.769', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a6489a12-92e1-4fde-8d33-fac86c218546', 'Wuraola', 'BRANCH', 'LAG-MUSHIN-WURAOLA', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.615', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a6e1ad2e-f76f-46bc-bba5-6b8e25a60082', 'Odo-Ona Branch', 'BRANCH', 'OYO-OLUYOLE-ODOONABRAN', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.408', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a715053b-5357-46db-b15e-798d89faf011', 'Addo', 'BRANCH', 'LAG-ETIOSA-ADDO', 'de109e20-fb77-418b-b300-0030df667a71', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.988', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a7b8fc88-8489-4b64-a230-943f29486627', 'Ibarapa East', 'LOCAL_GOVERNMENT', 'OYO-IBARAPAEAS', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.214', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a7e1c350-a01a-4d5a-ac26-5bc50b8b23a8', 'Odo Baale Branch', 'BRANCH', 'OYO-IBADANNORT-ODOBAALEBR', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.874', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a7e80d46-db7b-49da-b0fe-d08b8ad160c9', 'Akure Main Branch', 'BRANCH', 'OND-AKURESOUTH-AKUREMAINB', '9372aeba-b352-4720-a0ac-621e156d4596', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.547', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a94295d9-153c-4619-bb93-2de4041e6432', 'Ori Ire', 'LOCAL_GOVERNMENT', 'OYO-ORIIRE', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.438', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a9d1f83f-fc9b-4226-948d-d5f9313dd1fc', 'Ologuneru Branch', 'BRANCH', 'OYO-IDO-OLOGUNERUB', 'fe56a4d0-3075-4dd1-a677-26207d218b0a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.265', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('a9fd6b26-090f-4fd4-9f6e-8cdb9aedc5c6', 'Olayinka', 'BRANCH', 'LAG-ITIREIKATE-OLAYINKA', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.397', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('aab0c708-3d8c-4ffd-bd7e-49f223258326', 'Iju', 'BRANCH', 'LAG-IFAKOIJAYE-IJU', '3eb84eba-1b63-427b-bb2a-79b0b260f59d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.047', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ac0e2f28-652e-49dc-8748-a7266d487fcf', 'Isefun Olounda', 'BRANCH', 'LAG-AYOBOIPAJA-ISEFUNOLOU', 'e3c8107c-cb3d-4212-be3d-048810cf2e39', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.610', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ac38121e-0025-43d5-b3f9-8f8483d08702', 'Ijebu North', 'LOCAL_GOVERNMENT', 'OGU-IJEBUNORTH', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.883', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', 'Ibadan North', 'LOCAL_GOVERNMENT', 'OYO-IBADANNORT', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.830', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('acb87c66-3ca2-44f5-96c0-4ab70dc5746b', 'Ijero', 'LOCAL_GOVERNMENT', 'EKI-IJERO', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.480', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('acf0f8b3-b5b3-4e5c-a4ca-a9bf04b194d1', 'Boundary', 'BRANCH', 'LAG-AJEROMIIFE-BOUNDARY', '76561070-3fdc-4923-9fc6-029db4e7db21', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.513', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ada15a94-edf1-4967-9cee-5a0f5129050e', 'Imupa', 'BRANCH', 'OGU-IJEBUODE-IMUPA', '35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.258', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('adaa87ed-a88b-423c-9a0d-ea8111cd926a', 'Ilese', 'BRANCH', 'OGU-IJEBUNORTH-ILESE', 'b55ecd7a-edc0-48c4-8a84-a650b618c6e2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.922', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ae73f1fd-757b-444b-a727-ec97b7fce3f2', 'Ede', 'LOCAL_GOVERNMENT', 'OSU-EDE', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.636', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ae9b38cf-8855-45b2-aae1-7cd2315cd902', 'Iyana Iyesi', 'BRANCH', 'OGU-ADOODOOTA-IYANAIYESI', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.686', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('af841f9c-da78-40c2-a359-db81f8917f16', 'Ode Oga', 'BRANCH', 'OSU-OSOGBO-ODEOGA', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.793', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('afe4f4a3-482d-4000-85fb-ed02f1ea08e8', 'Egor', 'LOCAL_GOVERNMENT', 'EDO-EGOR', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.033', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b0137d1f-463b-4c40-bde1-cf9c226ecf8f', 'Ekiti', 'STATE', 'EKI', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.424', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b10b6cf0-f8cf-44cc-9c46-77d71df0e1d4', 'Ile Osin', 'BRANCH', 'OSU-IWO-ILEOSIN', '63a61393-9b13-4db1-b523-8c0e1852846b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.810', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b11422cd-4f3d-40d3-9104-5946c21b1204', 'Okitipupa', 'LOCAL_GOVERNMENT', 'OND-OKITIPUPA', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.570', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b161da45-59ba-4509-82dd-23fd2a8e256b', 'Kwankwashe Branch', 'BRANCH', 'NIG-SULEJA-KWANKWASHE', '4583783c-c4a4-44df-909e-4793cffa3aaa', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.843', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b1a9bbad-db85-4467-89a8-398936a09d37', 'Sabo', 'BRANCH', 'OGU-IKENNE-SABO', '53cdd1f0-7816-4f5f-97f7-e59183a78abf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.433', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b23fca64-da05-4c43-bd48-f71aa81f0281', 'Oke Aremo Branch', 'BRANCH', 'OYO-IBADANNORT-OKEAREMOBR', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.061', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b2528ec8-66b2-4518-a3fd-fbb133859cda', 'Adamo', 'BRANCH', 'LAG-IKORODU-ADAMO', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.240', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b2d9062b-c992-40ce-aa7c-9a2a75813949', 'Owo Branch', 'BRANCH', 'OND-OWO-OWOBRANCH', '2495ce0d-8f0d-4bbf-b5ca-c9400ec5fa67', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.566', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b3990a19-bad2-4c43-aba1-1e330e6d9ceb', 'Osun', 'STATE', 'OSU', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.619', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b39d9ac6-7673-45e5-814f-b90b5304b88a', 'Rubicon Estate', 'BRANCH', 'OSU-ILESAEAST-RUBICONEST', '6186e76f-eece-43be-aa27-08da971372ea', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.689', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b4026a92-9d6c-4286-88fe-776da98324b3', 'Bariga', 'BRANCH', 'LAG-BARIGA-BARIGA', '28045619-9f8e-4d4b-ad4c-69dbbb6ce2b7', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.646', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b53ab911-e53b-40a7-8252-ca209478f1ba', 'Oke - Iyanu', 'BRANCH', 'OSU-ILESAEAST-OKEIYANU', '6186e76f-eece-43be-aa27-08da971372ea', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.694', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b55ecd7a-edc0-48c4-8a84-a650b618c6e2', 'Ijebu North East', 'LOCAL_GOVERNMENT', 'OGU-IJEBUNORTH-862', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.919', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b59d822f-7a18-4942-94d0-acd069434e67', 'Okepopo', 'BRANCH', 'LAG-LAGOSISLAN-OKEPOPO', '21f168ce-c9dc-4166-b8b5-e0082f1f6d67', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.430', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b5b0f9ff-8431-41eb-80fc-45524226f011', 'Ligali Alaba', 'BRANCH', 'LAG-AJEROMIIFE-LIGALIALAB', '76561070-3fdc-4923-9fc6-029db4e7db21', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.526', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b6fd095b-7f64-4822-b387-7613d806bb39', 'Igbogbo', 'BRANCH', 'LAG-IGBOGBOBAY-IGBOGBO', '848411a2-fdf6-408b-b98d-3fc674ac6fbe', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.101', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b8053b66-243c-4396-8fda-99a6a6dfd423', 'Megbon', 'BRANCH', 'LAG-MUSHIN-MEGBON', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.605', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b80e8f1e-6335-48a9-915e-7853bab430c0', 'Ibafo', 'BRANCH', 'LAG-IKEJA-IBAFO', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.163', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b81fa628-dc16-4deb-92e4-fe777e66caa2', 'Ifako', 'BRANCH', 'LAG-KOSOFE-IFAKO', 'fa999f76-3f93-4547-9609-203503f59107', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.465', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b895f8be-9e90-463a-9518-df7644169a6c', 'Efon', 'LOCAL_GOVERNMENT', 'EKI-EFON', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.493', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('b920a9b9-3122-4451-804d-27cf63767ac8', 'Amac', 'BRANCH', 'FCT-AMAC-AMAC', '21e4352f-bb7f-42a2-bf9a-9c17353d5171', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.514', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ba425a1e-1865-41c8-9236-2b62f6d5bdef', 'Asa-Dam Branch', 'BRANCH', 'KWA-ILORINSOUT-ASADAMBRAN', '05fc5103-95c5-4fb6-9db6-a979de577fd9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.932', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ba71ae4f-a525-44c2-beef-3769e3b917b6', 'Okokomaiko', 'BRANCH', 'LAG-OJO-OKOKOMAIKO', '7b4674fd-dbaa-44d5-bc69-3f357fbeb872', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.653', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('baec7699-9247-496d-a569-f2ac6f1e2199', 'Osere Branch', 'BRANCH', 'KWA-ILORINEAST-OSEREBRANC', 'fb5f2996-9fb0-47ac-b1c8-870f458a0d6f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.896', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bb4f913f-7b11-4ca1-a99f-30e3d08f0934', 'Etsako East', 'LOCAL_GOVERNMENT', 'EDO-ETSAKOEAST', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.058', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bb81e69b-37ce-4aab-931a-2405e2cdf155', 'Odi-Olowo', 'LOCAL_GOVERNMENT', 'LAG-ODIOLOWO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.623', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bb86c11a-0ec6-4165-8318-5f338562e6cf', 'Coker / Aguda', 'LOCAL_GOVERNMENT', 'LAG-COKERAGUDA', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.665', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bbcb2700-8a1f-4bac-b965-d8ebc0c2887f', 'OdiOlowo', 'BRANCH', 'LAG-ODIOLOWO-ODIOLOWO', 'bb81e69b-37ce-4aab-931a-2405e2cdf155', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.640', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bc252baf-f0d9-444c-8772-4b2acf735e21', 'Esan North-East', 'LOCAL_GOVERNMENT', 'EDO-ESANNORTHE', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.043', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bcadd4c4-72b0-4e01-adfd-b9822b9fd279', 'Tose Branch', 'BRANCH', 'OYO-AKINYELE-TOSEBRANCH', '669f36a1-8675-4179-8dd3-de9baf9193d9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.808', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bd2c8c7d-e8d4-427c-9063-9fc812d7121d', 'Lalupon/Ejioku Branch', 'BRANCH', 'OYO-LAGELU-LALUPONEJI', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.339', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('be04b3eb-fc89-4df7-a2c7-ae65f4e7b664', 'Agaka Branch', 'BRANCH', 'KWA-ILORINWEST-AGAKABRANC', 'cfb8c6ff-e272-4182-a7be-cbca144164d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.000', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('be1699e3-ba96-47bd-81ae-a840a5219885', 'Owode', 'BRANCH', 'OGU-ADOODOOTA-OWODE', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.677', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('bfe4dce8-967c-41c1-8cf9-da2a33f24977', 'Alekuwodo', 'BRANCH', 'OSU-OSOGBO-ALEKUWODO', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.764', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c02137d0-c3c1-445d-9d1a-92c7be200332', 'The Muslim Congress (National)', 'NATIONAL', 'TMC-NAT', NULL, 'National Headquarters', NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, '<p>Welcome to The Muslim Congress(TMC)  website </p>', '/images/logo.png', '', NULL, '<p><strong>By providing Islamic forum for education, reformation and collaboration, we set agenda for repositioning of the Ummah.</strong></p><p><br></p>', '<p><strong>To be the foremost organisation guiding, influencing and setting agenda for societal reformation in line with Qur’an and Sunnah.</strong></p><p><br></p>', '', 'Mon-Fri (9am to 4pm)', '[{\"url\":\"/uploads/cmsslider/1770983509052-20231029140002.webp\",\"title\":\"Soul Purification session at the camp\",\"subtitle\":\"\"},{\"url\":\"/uploads/cmsslider/1770983525748-20231029145608.webp\",\"title\":\"Group photograph\",\"subtitle\":\"\"}]', 1, '2026-02-09 18:16:01.038', '2026-02-13 11:57:11.736', NULL, NULL, NULL, NULL, 12, 12),
('c02d443f-3732-4f31-9832-6d9b4513c1ff', 'Kwara', 'STATE', 'KWA', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.877', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12);
INSERT INTO `organizations` (`id`, `name`, `level`, `code`, `parentId`, `description`, `address`, `city`, `state`, `country`, `phone`, `email`, `website`, `welcomeMessage`, `welcomeImageUrl`, `googleMapUrl`, `socialLinks`, `missionText`, `visionText`, `whatsapp`, `officeHours`, `sliderImages`, `isActive`, `createdAt`, `updatedAt`, `accountNumber`, `bankCode`, `bankName`, `paystackSubaccountCode`, `planningDeadlineDay`, `planningDeadlineMonth`) VALUES
('c180cda8-aae4-44dc-a94e-9624c041cd22', 'Ajegunle', 'BRANCH', 'LAG-IKOSIISHER-AJEGUNLE', 'c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.198', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c1a5d15b-7eb2-48b5-b918-613d06af65d3', 'Owode Branch', 'BRANCH', 'OYO-IBADANSOUT-OWODEBRANC', '1998a15e-a8ab-445a-bc8b-1fd967ab1b08', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.141', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c1c2365a-3603-4425-bfc1-34094318d93a', 'Odogunyan', 'BRANCH', 'LAG-IKORODUNOR-ODOGUNYAN', '45adde51-4ddb-4264-a781-9a87e5c6bf4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.292', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c1dad169-a630-4247-98a3-44e4aae0e15d', 'Kekere-Owo', 'BRANCH', 'LAG-MUSHIN-KEKEREOWO', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.591', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c1e48c38-218a-468b-875f-ff08f367954c', 'Ilesa West', 'LOCAL_GOVERNMENT', 'OSU-ILESAWEST', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.704', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c4534ea7-7e7f-4d92-807c-7960714e218c', 'Ifelodun', 'BRANCH', 'LAG-OSHODIISOL-IFELODUN', '0aa1955a-e848-49d6-a02a-460980c0b566', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.676', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c5336ca3-9999-4fbe-8789-86f212e5287a', 'Ajasa', 'BRANCH', 'LAG-AGBADOOKEO-AJASA', 'd6cfd230-e2d2-4b68-80a4-948c208dd771', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.346', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c56fa144-f062-4a61-94c5-7a3552b42d40', 'Adewole Branch', 'BRANCH', 'KWA-ILORINWEST-ADEWOLEBRA', 'cfb8c6ff-e272-4182-a7be-cbca144164d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.955', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c642c6ab-1cdd-410f-b130-3d9ae686f33a', 'Ayegbesin', 'BRANCH', 'LAG-OSHODIISOL-AYEGBESIN', '0aa1955a-e848-49d6-a02a-460980c0b566', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.671', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c683cbfb-b7ec-4b9c-9c2e-344673e2bf22', 'Oke-Magba', 'BRANCH', 'LAG-EREDO-OKEMAGBA', '242a72b8-d387-45b6-b37a-90a149756ee8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.821', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c6f3b4c2-6257-4de7-a7cc-1064f4ffe5fa', 'Agbede', 'BRANCH', 'LAG-IKORODU-AGBEDE', '9d2f31c0-bfc1-41f0-8d23-180ed941eba0', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.250', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c6f9ae0d-4b5e-424c-83dc-563e6f7b20b9', 'Abeokuta North', 'LOCAL_GOVERNMENT', 'OGU-ABEOKUTANO', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.634', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', 'Ikosi / Isheri', 'LOCAL_GOVERNMENT', 'LAG-IKOSIISHER', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.187', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c84a5d15-1078-477f-b07a-0d5e12966576', 'Olorunsogo', 'LOCAL_GOVERNMENT', 'OYO-OLORUNSOGO', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.363', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('c88b0031-1a37-40fe-860e-a4e22cac58cd', 'Basin Branch', 'BRANCH', 'KWA-ILORINEAST-BASINBRANC', 'fb5f2996-9fb0-47ac-b1c8-870f458a0d6f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.891', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ca090713-b8fe-43d1-a28f-6c5079ed9fda', 'Ayetoro Branch', 'BRANCH', 'OYO-OYOWEST-AYETOROBRA', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.588', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('caec28b3-693e-4bc8-a700-37e07305072a', 'Boro Branch', 'BRANCH', 'OYO-IBADANNORT-BOROBRANCH', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.072', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('cbeef02a-b922-42ac-ac34-fcd6086ccd40', 'Ido-Osi', 'LOCAL_GOVERNMENT', 'EKI-IDOOSI', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.487', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('cd026c80-be81-4166-95b2-30339ad91660', 'Esan South-East', 'LOCAL_GOVERNMENT', 'EDO-ESANSOUTHE', '1769a4b3-eff6-4b56-b815-21ae23d5c1a2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.049', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ce933ad5-f4da-4493-9873-8961f220760d', 'Badagry', 'LOCAL_GOVERNMENT', 'LAG-BADAGRY', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.616', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('cea41951-7fd2-42d6-87d4-108ae58a1041', 'Boluwaji Branch', 'BRANCH', 'OYO-IBADANSOUT-BOLUWAJIBR', '1998a15e-a8ab-445a-bc8b-1fd967ab1b08', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.153', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('cfb8c6ff-e272-4182-a7be-cbca144164d4', 'Ilorin West', 'LOCAL_GOVERNMENT', 'KWA-ILORINWEST', 'c02d443f-3732-4f31-9832-6d9b4513c1ff', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.949', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d020a0cb-88f7-441a-be8c-bcbd23e2f4e2', 'Abule Egba', 'BRANCH', 'LAG-IFAKOIJAYE-ABULEEGBA', '3eb84eba-1b63-427b-bb2a-79b0b260f59d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.041', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d116a006-7605-4e99-b13c-9d741b49f951', 'Mokola Branch', 'BRANCH', 'OYO-IBADANNORT-MOKOLABRAN', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.892', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d1529d3f-794c-4c4f-a43e-9b17bc998bd6', 'Ori-Oke', 'BRANCH', 'LAG-EJIGBO-ORIOKE', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.708', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d3ecf6a2-5e08-4ecc-aac8-f57ab064b99a', 'Olohunkemi', 'BRANCH', 'LAG-BARIGA-OLOHUNKEMI', '28045619-9f8e-4d4b-ad4c-69dbbb6ce2b7', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.660', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d3ef5cab-c95d-4113-9ee0-62564d91f441', 'Idi - Omoh, Ilare', 'BRANCH', 'OSU-IFE-IDIOMOHILA', 'e23cc356-1621-485a-83d7-c0d807a74662', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.660', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d48efe5f-2632-42f0-b99b-e882539dbb25', 'Pedro', 'BRANCH', 'LAG-SHOMOLU-PEDRO', '982bd888-3d0f-4059-957a-330db8f812ce', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.710', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d57c00a2-d890-4273-b7c4-6168f1b660e1', 'Ogo Oluwa', 'LOCAL_GOVERNMENT', 'OYO-OGOOLUWA', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.359', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d659125b-2217-4432-bad8-9825301ec489', 'Agbaje Branch', 'BRANCH', 'OYO-IDO-AGBAJEBRAN', 'fe56a4d0-3075-4dd1-a677-26207d218b0a', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.260', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d6cfd230-e2d2-4b68-80a4-948c208dd771', 'Agbado / Oke-Odo', 'LOCAL_GOVERNMENT', 'LAG-AGBADOOKEO', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.338', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d77a4ce3-50d0-47ec-9615-ad57550a49cc', 'Osogbo', 'LOCAL_GOVERNMENT', 'OSU-OSOGBO', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.714', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d77d1521-f2a4-40eb-825e-818501280059', 'Atewolara', 'BRANCH', 'LAG-MUSHIN-ATEWOLARA', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.579', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', 'Oluyole', 'LOCAL_GOVERNMENT', 'OYO-OLUYOLE', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.369', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d7be7504-49a2-42c6-8693-fd9a55216c81', 'Lakowe', 'BRANCH', 'LAG-IBEJULEKKI-LAKOWE', 'e8ed9f57-449f-4d49-8b34-a9f4d3cf6b40', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.009', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('d8685979-6740-4452-93e8-4c8c75848372', 'Ahlusunah Branch', 'BRANCH', 'OYO-OYOWEST-AHLUSUNAHB', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.544', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('da6b5108-7a6b-41f6-bf28-d76162c27dd1', 'Orile', 'BRANCH', 'LAG-COKERAGUDA-ORILE', 'bb86c11a-0ec6-4165-8318-5f338562e6cf', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.670', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('db14a678-edf0-470c-bae2-8eaf3f23c976', 'Isokun Agba Branch', 'BRANCH', 'OYO-OYOWEST-ISOKUNAGBA', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.563', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('db21f503-9b44-48f7-a50e-cf0e1a378496', 'Ogbomosho South', 'LOCAL_GOVERNMENT', 'OYO-OGBOMOSHOS', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.354', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('db8981c5-cedd-4577-8cd0-459b1891ea16', 'Lagos', 'STATE', 'LAG', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.320', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('dc385bcd-b557-4ddf-88cb-45b5151b2a92', 'Akoko South-West', 'LOCAL_GOVERNMENT', 'OND-AKOKOSOUTH', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.530', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('dd53925d-a06d-422c-978b-e6cadf533016', 'Gwagwalada', 'LOCAL_GOVERNMENT', 'FCT-GWAGWALADA', '3f10e607-8148-4e25-a885-1a7f85a53c68', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.542', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('de109e20-fb77-418b-b300-0030df667a71', 'Eti Osa', 'LOCAL_GOVERNMENT', 'LAG-ETIOSA', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.942', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('de43554e-fec2-4f4a-9df4-eb65fde805d4', 'Ondo', 'STATE', 'OND', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.510', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('de50577f-8661-4b27-a78c-c4803c19f414', 'Ijegun', 'BRANCH', 'LAG-IGANDOIKOT-IJEGUN', '5a978f2a-5584-470c-a586-4909a53e7dc6', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.079', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('dec18a54-0760-4aa8-82ee-38982ec28d52', 'Alakija', 'BRANCH', 'LAG-MUSHIN-ALAKIJA', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.571', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('decd776c-89fc-44b4-8504-cdc46567d37d', 'Papa Ajao', 'BRANCH', 'LAG-MUSHIN-PAPAAJAO', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.609', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ded1c5a5-c68d-4bb2-838d-4031d4ce7105', 'Jore Center', 'BRANCH', 'OSU-AYEDIRE-JORECENTER', '5bc7bf36-cfdd-46e2-8d9d-8e86214cd3df', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.632', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ded6ef4c-3a41-4bd1-8ebe-0da51acebad6', 'Ayetoro', 'BRANCH', 'LAG-MUSHIN-AYETORO', '1f8172b9-f313-4ee8-8362-14458b8ffac8', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.586', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('df8fea88-0859-403e-b1ff-decc888edccd', 'Ilaje', 'BRANCH', 'LAG-BARIGA-ILAJE', '28045619-9f8e-4d4b-ad4c-69dbbb6ce2b7', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.655', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e0f4c96c-6565-47d8-9e82-27ed4d42d192', 'Aba-Apata Branch', 'BRANCH', 'OYO-IBADANNORT-ABAAPATABR', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.859', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e1d1106f-5b84-456c-b857-9117fea3c0d2', 'Oluwakemi', 'BRANCH', 'LAG-ITIREIKATE-OLUWAKEMI', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.389', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e23cc356-1621-485a-83d7-c0d807a74662', 'Ife', 'LOCAL_GOVERNMENT', 'OSU-IFE', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.655', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e28b2695-60e5-43fa-9e27-9de77c5ac766', 'Niger', 'STATE', 'NIG', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.824', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e2ad69ff-56d3-4ad0-880f-f7fa49566710', 'Oko-Oba', 'BRANCH', 'LAG-AGEGE-OKOOBA', '77aa9980-8f3c-429f-a76a-ee0a635577ad', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.383', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e2c16bb2-f287-4df0-ab9d-1cea32de25ad', 'Atisbo', 'LOCAL_GOVERNMENT', 'OYO-ATISBO', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.821', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e3c8107c-cb3d-4212-be3d-048810cf2e39', 'Ayobo / Ipaja', 'LOCAL_GOVERNMENT', 'LAG-AYOBOIPAJA', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.587', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e46dffbd-3029-49ca-a7f9-f565c76a702b', 'Ayesan', 'BRANCH', 'OGU-IJEBUODE-AYESAN', '35ef21ab-dc02-43e8-8af4-3afe9d2a4e48', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.220', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e4c4fbae-0873-46d7-b5af-22f6b756da37', 'Akowo Branch', 'BRANCH', 'OYO-IBADANNORT-AKOWOBRANC', 'ac6d0b44-cd88-427e-8cd7-f2e2e5ed2e35', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.909', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e52c0ddf-8e1c-4d7a-ae4e-1044153b719f', 'Akoko North-East', 'LOCAL_GOVERNMENT', 'OND-AKOKONORTH', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.519', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e60dad2c-31c7-458f-80ff-1ed6d375f93e', 'Ifelodun', 'LOCAL_GOVERNMENT', 'OSU-IFELODUN', 'b3990a19-bad2-4c43-aba1-1e330e6d9ceb', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.674', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e7295919-5deb-41a8-a63a-06c4f81366a8', 'Isheri Osun', 'BRANCH', 'LAG-EJIGBO-ISHERIOSUN', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.718', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e7444d10-17de-4985-8e6e-cad2f2c88c57', 'Ekore Oworo', 'BRANCH', 'LAG-KOSOFE-EKOREOWORO', 'fa999f76-3f93-4547-9609-203503f59107', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.442', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e76e3e28-45bf-4d4d-b980-274e90f14090', 'Yewa North', 'LOCAL_GOVERNMENT', 'OGU-YEWANORTH', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.459', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e8ed9f57-449f-4d49-8b34-a9f4d3cf6b40', 'Ibeju / Lekki', 'LOCAL_GOVERNMENT', 'LAG-IBEJULEKKI', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.003', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('e9c3cfe3-fd69-46cb-a545-f58782004336', 'Iseyin', 'LOCAL_GOVERNMENT', 'OYO-ISEYIN', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.276', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ea566652-843e-4031-bff4-8ecbb84985a2', 'Sango', 'BRANCH', 'OGU-ADOODOOTA-SANGO', '246638e3-6316-4400-8aa0-bf43ddbe7c49', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.670', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ea7a7ea8-5933-441c-a3ab-69a3d685bd1d', 'Olorunsola Branch', 'BRANCH', 'OYO-OYOWEST-OLORUNSOLA', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.489', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('eb53597e-306c-4310-9ded-0e0408e1b544', 'Sagamu', 'LOCAL_GOVERNMENT', 'OGU-SAGAMU', '650b1034-2f6f-487c-a19a-2fefa3d3dd4b', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.449', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ee7912aa-ad23-464b-a376-c139b9cd81e7', 'Mile 12', 'BRANCH', 'LAG-IKOSIISHER-MILE12', 'c7b569e3-e5dc-4dd2-b52e-0d183049ee2d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.225', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f1a0536e-74fb-4c36-9280-176c6bc72b95', 'Keke', 'BRANCH', 'LAG-IKEJA-KEKE', '8d2694bf-1b77-466a-9092-83003e58bc92', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.181', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f23f0026-46a6-42a1-8348-af7f830a4a54', 'Aradagun', 'BRANCH', 'LAG-BADAGRY-ARADAGUN', 'ce933ad5-f4da-4493-9873-8961f220760d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.624', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f28994c6-e55d-471d-803a-a58c256aea72', 'Mbape', 'BRANCH', 'FCT-KUJE-MBAPE', '0f08eb92-69dd-43f1-9246-383b26dbdba2', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.578', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f2c75c44-3c41-4c48-9fe2-72527e08a5dd', 'Ijesha', 'BRANCH', 'LAG-ITIREIKATE-IJESHA', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.384', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f2c772cf-a685-4fa5-b69b-c0f88f601bc8', 'Ago-Okota', 'BRANCH', 'LAG-ISOLO-AGOOKOTA', '9ddb5449-3cc5-42d2-984f-bf408d74b141', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.311', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f2d35a86-fcbb-47b2-981e-6b85cfdce9ba', 'Yahyah Branch', 'BRANCH', 'OYO-OYOWEST-YAHYAHBRAN', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.568', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f48a61ab-90ad-4866-9349-1b1e557bfe06', 'Lagos Mainland', 'LOCAL_GOVERNMENT', 'LAG-LAGOSMAINL', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.478', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f49596a0-422b-47f0-b285-55fbf9238871', 'Airways', 'BRANCH', 'LAG-ITIREIKATE-AIRWAYS', 'a1882773-2e6d-46ab-9893-f4830228dc8d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.412', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f5c4bf2b-8550-4384-b186-1e580f93df27', 'Akure North', 'LOCAL_GOVERNMENT', 'OND-AKURENORTH', 'de43554e-fec2-4f4a-9df4-eb65fde805d4', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:09.536', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f67bd2a1-6470-4dae-884a-0e064233657f', 'Araromi', 'BRANCH', 'LAG-KOSOFE-ARAROMI', 'fa999f76-3f93-4547-9609-203503f59107', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.455', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f690b4b2-76a1-4f0f-bed4-24f05dead80f', 'Bagadaje Branch', 'BRANCH', 'OYO-AKINYELE-BAGADAJEBR', '669f36a1-8675-4179-8dd3-de9baf9193d9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.753', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f69faf28-e920-4c0a-80df-2df400a8328c', 'Ayegun Branch', 'BRANCH', 'OYO-IBADANNORT-AYEGUNBRAN', '96fa7fb0-ed2f-4d27-a5a7-d83b45edfe2c', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.098', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f7856489-e299-43f3-af21-613af18bc1ae', 'Lagelu', 'LOCAL_GOVERNMENT', 'OYO-LAGELU', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.311', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f7ac9e7f-fb21-4639-9a19-818ef885fabf', 'Mogbafoluwa Branch', 'BRANCH', 'OYO-OYOWEST-MOGBAFOLUW', '57d599ed-8340-48d1-ae00-20e6a518685d', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.540', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f86b8518-c780-4e56-b8e1-1f6eda3ad069', 'Oke Ilasa', 'BRANCH', 'LAG-ISOLO-OKEILASA', '9ddb5449-3cc5-42d2-984f-bf408d74b141', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.372', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f9bf4441-cdc0-469c-bebf-90f5a901ff0a', 'Idimu', 'BRANCH', 'LAG-IGANDOIKOT-IDIMU', '5a978f2a-5584-470c-a586-4909a53e7dc6', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.068', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('f9d3eb99-18d6-4408-9a5d-c03023ed889c', 'Alegongo Branch', 'BRANCH', 'OYO-LAGELU-ALEGONGOBR', 'f7856489-e299-43f3-af21-613af18bc1ae', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.326', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fa40cd5d-d944-430e-9b03-11d9227fc907', 'Ekpoma Branch', 'BRANCH', 'EDO-BENIN-EKPOMABRAN', '7e1537ec-9ef7-483a-a9b5-066008203931', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.358', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fa999f76-3f93-4547-9609-203503f59107', 'Kosofe', 'LOCAL_GOVERNMENT', 'LAG-KOSOFE', 'db8981c5-cedd-4577-8cd0-459b1891ea16', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:06.436', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fb5f2996-9fb0-47ac-b1c8-870f458a0d6f', 'Ilorin East', 'LOCAL_GOVERNMENT', 'KWA-ILORINEAST', 'c02d443f-3732-4f31-9832-6d9b4513c1ff', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.882', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fc1010bf-a4fa-43ac-bba4-1a6e8fd5c49d', 'Agodo', 'BRANCH', 'LAG-EJIGBO-AGODO', '494e7460-8ede-465f-a09b-92ef77d2d959', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:05.723', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fc2f3f9d-8e0e-4d4d-a744-e60e8d02f47d', 'Titilope Branch', 'BRANCH', 'OYO-OLUYOLE-TITILOPEBR', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.379', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fc735c0a-3cd5-40f9-b606-6535f2aeac67', 'Testing Ground Area', 'BRANCH', 'OSU-OSOGBO-TESTINGGRO', 'd77a4ce3-50d0-47ec-9615-ad57550a49cc', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.801', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fca3e256-769c-4b21-b038-9748090d9e84', 'Benin Main Branch', 'BRANCH', 'EDO-BENIN-BENINMAINB', '7e1537ec-9ef7-483a-a9b5-066008203931', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.215', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fd2adc2c-c64b-4c8b-a87c-be284592be5f', 'Ado-Ekiti', 'LOCAL_GOVERNMENT', 'EKI-ADOEKITI', 'b0137d1f-463b-4c40-bde1-cf9c226ecf8f', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:08.434', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fd3662c4-4e5a-413d-9c68-ac00d74117dd', 'Jogbin Branch', 'BRANCH', 'OYO-OLUYOLE-JOGBINBRAN', 'd7b14b3f-2a56-421e-ac86-fb2b87cc0bb1', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.393', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('fe56a4d0-3075-4dd1-a677-26207d218b0a', 'Ido', 'LOCAL_GOVERNMENT', 'OYO-IDO', '667ff8d2-6434-4fdd-8460-94627773f7e9', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.226', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12),
('ffe12374-ee9a-4986-a9d0-18381765c14a', 'Chanchaga', 'LOCAL_GOVERNMENT', 'NIG-CHANCHAGA', 'e28b2695-60e5-43fa-9e27-9de77c5ac766', NULL, NULL, NULL, NULL, 'Nigeria', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-10 08:03:07.867', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, 12, 12);

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
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
  `campaignId` varchar(191) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'NGN',
  `status` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentType` enum('MEMBERSHIP_FEE','RENEWAL','DONATION','EVENT_FEE','BURIAL_FEE','OTHER') NOT NULL,
  `paystackRef` varchar(191) DEFAULT NULL,
  `paystackResponse` longtext DEFAULT NULL CHECK (json_valid(`paystackResponse`)),
  `description` varchar(191) DEFAULT NULL,
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`)),
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
('039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 'payments:create', 'Create Payments', 'Create payment records', 'payments', 1, '2026-02-09 18:17:04.768', '0000-00-00 00:00:00.000'),
('070a78b6-16d4-40b5-81f3-57e426715ea4', 'users:create', 'Create Users', 'Create user accounts', 'users', 1, '2026-02-09 18:17:04.817', '0000-00-00 00:00:00.000'),
('0a044a24-b4cb-488b-b410-40be00b82ef6', 'officials:delete', 'Delete Officials', 'Remove officials', 'officials', 1, '2026-02-09 18:17:04.730', '0000-00-00 00:00:00.000'),
('0ac9f8dc-012c-4559-9c14-60fec56c9147', 'users:delete', 'Delete Users', 'Delete user accounts', 'users', 1, '2026-02-09 18:17:04.832', '0000-00-00 00:00:00.000'),
('1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 'members:update', 'Update Members', 'Update member information', 'members', 1, '2026-02-09 18:17:04.696', '0000-00-00 00:00:00.000'),
('1efdebec-2a34-4c5e-ba99-ee226d760c6b', 'organizations:update', 'Update Organizations', 'Update organization information', 'organizations', 1, '2026-02-09 18:17:04.762', '0000-00-00 00:00:00.000'),
('26142236-404f-4b00-9d83-26da245a9b07', 'users:update', 'Update Users', 'Update user accounts', 'users', 1, '2026-02-09 18:17:04.828', '0000-00-00 00:00:00.000'),
('28866626-1f30-404c-80c5-11600ca9ab79', 'roles:create', 'Create Roles', 'Create new roles', 'roles', 1, '2026-02-09 18:17:04.735', '0000-00-00 00:00:00.000'),
('2d133725-2cbd-4cc7-8d95-815825601223', 'payments:update', 'Update Payments', 'Update payment records', 'payments', 1, '2026-02-09 18:17:04.777', '0000-00-00 00:00:00.000'),
('2e19e081-6d18-43f8-9083-6ba93d1ea8d0', 'users:read', 'View Users', 'View user information', 'users', 1, '2026-02-09 18:17:04.824', '0000-00-00 00:00:00.000'),
('2ef1b933-a0cd-4bef-bb06-17530f691ed7', 'documents:create', 'Upload Documents', 'Upload documents', 'documents', 1, '2026-02-09 18:17:04.784', '0000-00-00 00:00:00.000'),
('3e110ac1-24ba-4d72-a05c-c071d1437f5e', 'members:delete', 'Delete Members', 'Delete member accounts', 'members', 1, '2026-02-09 18:17:04.702', '0000-00-00 00:00:00.000'),
('44b083e7-059a-4c80-89e6-29232736019c', 'documents:delete', 'Delete Documents', 'Delete documents', 'documents', 1, '2026-02-09 18:17:04.795', '0000-00-00 00:00:00.000'),
('4b3b484c-b128-47c7-9e6a-ad380dac81b1', 'permissions:manage', 'Manage Permissions', 'Manage role permissions', 'roles', 1, '2026-02-09 18:17:04.752', '0000-00-00 00:00:00.000'),
('5ce5d00c-eb45-441d-95fb-9404154926e5', 'members:approve', 'Approve Members', 'Approve pending member applications', 'members', 1, '2026-02-09 18:17:04.706', '0000-00-00 00:00:00.000'),
('6de42939-7259-4c33-beeb-b7734f5629a7', 'payments:read', 'View Payments', 'View payment information', 'payments', 1, '2026-02-09 18:17:04.773', '0000-00-00 00:00:00.000'),
('780ec159-8223-4502-9a71-7e792be5ba69', 'documents:read', 'View Documents', 'View documents', 'documents', 1, '2026-02-09 18:17:04.788', '0000-00-00 00:00:00.000'),
('900f5964-dde7-416e-a5de-c3eb61d63da7', 'reports:read', 'View Reports', 'View reports', 'reports', 1, '2026-02-09 18:17:04.807', '0000-00-00 00:00:00.000'),
('904cc8e2-95bb-4d21-b598-6e0f4471978a', 'roles:read', 'View Roles', 'View roles and permissions', 'roles', 1, '2026-02-09 18:17:04.739', '0000-00-00 00:00:00.000'),
('a4a4e515-6be6-427d-8215-129b840ec11b', 'organizations:read', 'View Organizations', 'View organization information', 'organizations', 1, '2026-02-09 18:17:04.759', '0000-00-00 00:00:00.000'),
('a9129657-8d7f-4ce0-ad2b-9a21e109b560', 'members:create', 'Create Members', 'Create new member accounts', 'members', 1, '2026-02-09 18:17:04.675', '0000-00-00 00:00:00.000'),
('b0e4833a-076e-44ed-95a3-aea8ec26da27', 'roles:delete', 'Delete Roles', 'Delete roles', 'roles', 1, '2026-02-09 18:17:04.746', '0000-00-00 00:00:00.000'),
('bc603dc4-cad2-462a-95c6-8939b999738f', 'officials:create', 'Create Officials', 'Create official positions', 'officials', 1, '2026-02-09 18:17:04.712', '0000-00-00 00:00:00.000'),
('bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 'members:read', 'View Members', 'View member information', 'members', 1, '2026-02-09 18:17:04.685', '0000-00-00 00:00:00.000'),
('c5656d64-319a-46cc-a882-85d63b571eee', 'reports:generate', 'Generate Reports', 'Generate new reports', 'reports', 1, '2026-02-09 18:17:04.812', '0000-00-00 00:00:00.000'),
('d10424b6-e6a8-4621-80d3-cffdd5e9b17a', 'documents:update', 'Update Documents', 'Update document information', 'documents', 1, '2026-02-09 18:17:04.791', '0000-00-00 00:00:00.000'),
('db28e9ea-06f1-4091-8b53-f121e471f31b', 'officials:update', 'Update Officials', 'Update official information', 'officials', 1, '2026-02-09 18:17:04.724', '0000-00-00 00:00:00.000'),
('dd5515be-903d-439a-9e3d-953a221ac0c9', 'roles:assign', 'Assign Roles', 'Assign roles to users', 'roles', 1, '2026-02-09 18:17:04.749', '0000-00-00 00:00:00.000'),
('dfb7f367-e429-4842-974c-69d4de0c76b1', 'payments:refund', 'Refund Payments', 'Process refunds', 'payments', 1, '2026-02-09 18:17:04.781', '0000-00-00 00:00:00.000'),
('e8da5a8b-8ee5-42ce-a3a9-51c62c4450d7', 'organizations:delete', 'Delete Organizations', 'Delete organizations', 'organizations', 1, '2026-02-09 18:17:04.765', '0000-00-00 00:00:00.000'),
('e98e462e-8ed9-441b-a67a-e63d482bd95d', 'roles:update', 'Update Roles', 'Update role information', 'roles', 1, '2026-02-09 18:17:04.743', '0000-00-00 00:00:00.000'),
('ea847f61-d7ea-4352-a0d4-4893d2f80beb', 'audit:read', 'View Audit Logs', 'View system audit logs', 'audit', 1, '2026-02-09 18:17:04.799', '0000-00-00 00:00:00.000'),
('ec00366c-f7af-4583-b136-d422f1cd82f9', 'officials:read', 'View Officials', 'View official information', 'officials', 1, '2026-02-09 18:17:04.716', '0000-00-00 00:00:00.000'),
('f0fd8f76-e511-4c69-aae1-9a1c1bc091ad', 'organizations:create', 'Create Organizations', 'Create new organizations', 'organizations', 1, '2026-02-09 18:17:04.756', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `authorId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` text NOT NULL,
  `coverImage` varchar(191) DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `postType` enum('NEWS','EVENT','ANNOUNCEMENT') NOT NULL DEFAULT 'NEWS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programmes`
--

CREATE TABLE `programmes` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `venue` varchar(255) NOT NULL,
  `startDate` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `endDate` timestamp(3) NULL DEFAULT NULL,
  `time` varchar(255) DEFAULT NULL,
  `level` enum('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NOT NULL,
  `targetAudience` enum('PUBLIC','MEMBERS','BROTHERS','SISTERS','CHILDREN','YOUTH','ELDERS') DEFAULT 'PUBLIC',
  `status` enum('DRAFT','PENDING_STATE','PENDING_NATIONAL','APPROVED','REJECTED','CANCELLED','COMPLETED') DEFAULT 'DRAFT',
  `approvedStateBy` varchar(255) DEFAULT NULL,
  `approvedStateAt` timestamp(3) NULL DEFAULT NULL,
  `approvedNationalBy` varchar(255) DEFAULT NULL,
  `approvedNationalAt` timestamp(3) NULL DEFAULT NULL,
  `organizingOfficeId` varchar(255) DEFAULT NULL,
  `isLateSubmission` tinyint(1) DEFAULT 0,
  `paymentRequired` tinyint(1) DEFAULT 0,
  `amount` decimal(10,2) DEFAULT 0.00,
  `hasCertificate` tinyint(1) DEFAULT 0,
  `createdBy` varchar(255) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programme_registrations`
--

CREATE TABLE `programme_registrations` (
  `id` varchar(255) NOT NULL,
  `programmeId` varchar(255) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `memberId` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `status` enum('REGISTERED','PAID','ATTENDED','CANCELLED') DEFAULT 'REGISTERED',
  `paymentReference` varchar(255) DEFAULT NULL,
  `certificateUrl` varchar(500) DEFAULT NULL,
  `certificateIssuedAt` timestamp(3) NULL DEFAULT NULL,
  `registeredAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programme_reports`
--

CREATE TABLE `programme_reports` (
  `id` varchar(255) NOT NULL,
  `programmeId` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `challenges` text DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `attendeesMale` int(11) DEFAULT 0,
  `attendeesFemale` int(11) DEFAULT 0,
  `amountSpent` decimal(15,2) DEFAULT 0.00,
  `images` longtext DEFAULT NULL CHECK (json_valid(`images`)),
  `submittedBy` varchar(255) NOT NULL,
  `submittedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `planId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','ACTIVE','EXPIRED') DEFAULT 'PENDING',
  `paymentStatus` enum('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
  `amount` decimal(15,2) NOT NULL,
  `startDate` timestamp(3) NULL DEFAULT NULL,
  `endDate` timestamp(3) NULL DEFAULT NULL,
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedAt` timestamp(3) NULL DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_plans`
--

CREATE TABLE `promotion_plans` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `durationDays` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `officeId` varchar(255) DEFAULT NULL,
  `reportType` enum('MONTHLY_ACTIVITY','QUARTERLY_STATE','ANNUAL_CONGRESS','FINANCIAL') NOT NULL,
  `reportStatus` enum('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT',
  `title` varchar(255) NOT NULL,
  `period` varchar(255) NOT NULL,
  `content` longtext NOT NULL CHECK (json_valid(`content`)),
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedAt` timestamp(3) NULL DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
('2af770f4-305f-4409-95d8-ede75d36c5ab', 'State Admin', 'STATE_ADMIN', 'State level administrator with full access to state jurisdiction', 'STATE', 1, 1, '2026-02-09 18:17:06.372', '0000-00-00 00:00:00.000'),
('2b618aa0-dffd-4a2b-98f6-74a90c9fbc11', 'Member', 'MEMBER', 'Regular member with limited access', 'BRANCH', 1, 1, '2026-02-09 18:17:06.634', '0000-00-00 00:00:00.000'),
('4a04ac70-5368-4882-a2db-cf8cb23ee70f', 'Official', 'OFFICIAL', 'Organization official with jurisdiction-based access', 'BRANCH', 1, 1, '2026-02-09 18:17:06.599', '0000-00-00 00:00:00.000'),
('5909a885-185f-41c8-88b5-b57c845f973d', 'Branch Admin', 'BRANCH_ADMIN', 'Branch level administrator', 'BRANCH', 1, 1, '2026-02-09 18:17:06.542', '0000-00-00 00:00:00.000'),
('72cc706f-6863-4b69-8fcb-44f9cafd5807', 'National Admin', 'NATIONAL_ADMIN', 'National level administrator with full access to national jurisdiction', 'NATIONAL', 1, 1, '2026-02-09 18:17:06.201', '0000-00-00 00:00:00.000'),
('8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'Super Admin', 'SUPER_ADMIN', 'Full system access with no jurisdiction limits', 'SYSTEM', 1, 1, '2026-02-09 18:17:04.839', '0000-00-00 00:00:00.000'),
('c37ee339-293f-4bf7-94bf-60a4c8b886d2', 'Local Government Admin', 'LOCAL_GOVERNMENT_ADMIN', 'Local Government level administrator', 'LOCAL_GOVERNMENT', 1, 1, '2026-02-09 18:17:06.474', '0000-00-00 00:00:00.000');

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
('02804f5e-dc59-482b-9bc0-dd10324afdae', '2af770f4-305f-4409-95d8-ede75d36c5ab', 'ec00366c-f7af-4583-b136-d422f1cd82f9', 1, '2026-02-09 18:17:06.410', NULL),
('02ad0504-dc88-401f-a5a2-6be77bdd0d66', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '904cc8e2-95bb-4d21-b598-6e0f4471978a', 1, '2026-02-09 18:17:05.970', NULL),
('031a7183-6989-4e75-8ecf-6c6ba20842a9', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'dd5515be-903d-439a-9e3d-953a221ac0c9', 1, '2026-02-09 18:17:06.370', NULL),
('0830b4aa-fe19-4f8f-ac3b-d33257fa382f', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.492', NULL),
('0daf2255-2e4c-4adf-9f6b-9072cfcac627', '2af770f4-305f-4409-95d8-ede75d36c5ab', 'd10424b6-e6a8-4621-80d3-cffdd5e9b17a', 1, '2026-02-09 18:17:06.464', NULL),
('0dc2237a-041f-43c5-9583-7e3366ae81e7', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.120', NULL),
('0f15b3bc-ff1f-4392-ad72-41e6eed55816', '5909a885-185f-41c8-88b5-b57c845f973d', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.596', NULL),
('10279e1a-1ab5-4155-bc37-0e0797e84f3a', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 1, '2026-02-09 18:17:05.901', NULL),
('1169e1df-2ebb-40db-a65a-2cf77d19b145', '4a04ac70-5368-4882-a2db-cf8cb23ee70f', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.609', NULL),
('11a114fc-5f26-4672-9b9a-0dae757fd29a', '2b618aa0-dffd-4a2b-98f6-74a90c9fbc11', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.660', NULL),
('140fec57-6574-4d9a-9e15-ca71be5e68d3', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'bc603dc4-cad2-462a-95c6-8939b999738f', 1, '2026-02-09 18:17:05.928', NULL),
('16eb0ea4-01cb-4f87-964f-e9ea39cce27c', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.288', NULL),
('1b4ee22d-4745-4b86-8653-ea745df786e7', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '0ac9f8dc-012c-4559-9c14-60fec56c9147', 1, '2026-02-09 18:17:06.198', NULL),
('1e647f53-7ce8-4c0b-a7f2-c721ddb94537', '2b618aa0-dffd-4a2b-98f6-74a90c9fbc11', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.653', NULL),
('21cad38b-2636-4035-98f5-4e5572c252a9', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', 'a9129657-8d7f-4ce0-ad2b-9a21e109b560', 1, '2026-02-09 18:17:06.484', NULL),
('240acb43-829e-4aca-99cb-3781da7879d4', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.532', NULL),
('262ec799-fa9e-42e4-ba06-9d85d843ce87', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'ea847f61-d7ea-4352-a0d4-4893d2f80beb', 1, '2026-02-09 18:17:06.338', NULL),
('27be372f-fa92-4b9c-8787-cfdd744eb143', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'db28e9ea-06f1-4091-8b53-f121e471f31b', 1, '2026-02-09 18:17:05.945', NULL),
('27dd2b99-7efe-4ff7-8e1f-1fce26e6b9cd', '4a04ac70-5368-4882-a2db-cf8cb23ee70f', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.623', NULL),
('2888fc9a-b7a3-47fb-ad3b-2707af24e8e5', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'a9129657-8d7f-4ce0-ad2b-9a21e109b560', 1, '2026-02-09 18:17:05.880', NULL),
('2e96c287-82cf-4de7-8f38-32a71602c4e9', '2af770f4-305f-4409-95d8-ede75d36c5ab', '039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 1, '2026-02-09 18:17:06.425', NULL),
('30ddffc1-a200-4665-98da-a3728b4688b5', '4a04ac70-5368-4882-a2db-cf8cb23ee70f', '900f5964-dde7-416e-a5de-c3eb61d63da7', 1, '2026-02-09 18:17:06.631', NULL),
('323429d3-3791-492a-ac2d-d3304f51b95f', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'd10424b6-e6a8-4621-80d3-cffdd5e9b17a', 1, '2026-02-09 18:17:06.129', NULL),
('35cbbd51-3bae-4226-9ea7-5c8f3e5fa706', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.084', NULL),
('36cc28bb-c0c2-493c-a37d-828a2c40cb1b', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'ea847f61-d7ea-4352-a0d4-4893d2f80beb', 1, '2026-02-09 18:17:06.149', NULL),
('3749e476-b866-4c0f-b840-e22ba1df384c', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'c5656d64-319a-46cc-a882-85d63b571eee', 1, '2026-02-09 18:17:06.165', NULL),
('390a76b2-3f27-47b7-94b9-4321515b86ba', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'db28e9ea-06f1-4091-8b53-f121e471f31b', 1, '2026-02-09 18:17:06.256', NULL),
('4190c39a-2a06-4b6c-83c5-08ebe907ab5f', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '26142236-404f-4b00-9d83-26da245a9b07', 1, '2026-02-09 18:17:06.190', NULL),
('419ff0ed-3c65-4283-9f7e-1ec08d044bfa', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '070a78b6-16d4-40b5-81f3-57e426715ea4', 1, '2026-02-09 18:17:06.173', NULL),
('427765c9-1810-434c-8954-faf99079d838', '2b618aa0-dffd-4a2b-98f6-74a90c9fbc11', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.642', NULL),
('44c15d67-d4bf-4041-892c-7b50c7249944', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '900f5964-dde7-416e-a5de-c3eb61d63da7', 1, '2026-02-09 18:17:06.157', NULL),
('4b8fb98f-2ea4-4c7c-ad42-93e96f0d354d', '2af770f4-305f-4409-95d8-ede75d36c5ab', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.387', NULL),
('4d8a52c9-30e8-4c8f-a4e0-5090c94f08a6', '2af770f4-305f-4409-95d8-ede75d36c5ab', '900f5964-dde7-416e-a5de-c3eb61d63da7', 1, '2026-02-09 18:17:06.471', NULL),
('4f2b753d-ba9e-4f09-9080-48955cacdb63', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 1, '2026-02-09 18:17:06.228', NULL),
('51ba49cc-28fd-441e-9ef6-190bde0ef89a', '2af770f4-305f-4409-95d8-ede75d36c5ab', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.432', NULL),
('53855fb9-d829-4c1e-91e3-5944425ba2c4', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'd10424b6-e6a8-4621-80d3-cffdd5e9b17a', 1, '2026-02-09 18:17:06.325', NULL),
('54b11f3c-43f5-4326-8078-b2abd297c8e7', '5909a885-185f-41c8-88b5-b57c845f973d', 'a9129657-8d7f-4ce0-ad2b-9a21e109b560', 1, '2026-02-09 18:17:06.551', NULL),
('55fe3cda-7a4d-4258-a23d-16cf1b05c60e', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'c5656d64-319a-46cc-a882-85d63b571eee', 1, '2026-02-09 18:17:06.354', NULL),
('5e5240aa-8d7d-483c-ab2b-8603492b1738', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', '2ef1b933-a0cd-4bef-bb06-17530f691ed7', 1, '2026-02-09 18:17:06.525', NULL),
('6086abf5-2bd7-48cf-8571-0ce431c00267', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.221', NULL),
('64db6006-851c-4e61-adc7-17f2902300c7', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '5ce5d00c-eb45-441d-95fb-9404154926e5', 1, '2026-02-09 18:17:05.918', NULL),
('6c64ed03-6ffc-411a-90e4-519b86cbbbea', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'e8da5a8b-8ee5-42ce-a3a9-51c62c4450d7', 1, '2026-02-09 18:17:06.064', NULL),
('719a9794-3d99-4b91-a552-e7f9360266f2', '2af770f4-305f-4409-95d8-ede75d36c5ab', 'a4a4e515-6be6-427d-8215-129b840ec11b', 1, '2026-02-09 18:17:06.417', NULL),
('7552c59b-2638-4267-ae44-7e45b1a767ed', '5909a885-185f-41c8-88b5-b57c845f973d', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.583', NULL),
('75b4cdf3-52dc-4cce-8717-2285ef639264', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 1, '2026-02-09 18:17:06.279', NULL),
('76a8be74-68b6-4d62-80a3-7d1aa876948d', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '900f5964-dde7-416e-a5de-c3eb61d63da7', 1, '2026-02-09 18:17:06.346', NULL),
('771697c3-ef48-43b1-af45-6f4f80107aba', '4a04ac70-5368-4882-a2db-cf8cb23ee70f', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.617', NULL),
('784a415e-21ff-4534-977e-9823279b9e24', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '4b3b484c-b128-47c7-9e6a-ad380dac81b1', 1, '2026-02-09 18:17:06.009', NULL),
('7ea7074c-f8df-4e9d-a902-a9f75422c8c7', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'dfb7f367-e429-4842-974c-69d4de0c76b1', 1, '2026-02-09 18:17:06.103', NULL),
('822e129d-6990-4131-ae67-e66d90be89f2', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.311', NULL),
('87cb147d-9b64-4903-9b5d-dd9de9c1c08d', '5909a885-185f-41c8-88b5-b57c845f973d', '2ef1b933-a0cd-4bef-bb06-17530f691ed7', 1, '2026-02-09 18:17:06.590', NULL),
('889deb3d-6d6e-4cb2-9112-107ce8d02243', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'a9129657-8d7f-4ce0-ad2b-9a21e109b560', 1, '2026-02-09 18:17:06.213', NULL),
('90ed2ebf-a366-42f4-b0b4-e0cf2813463e', '5909a885-185f-41c8-88b5-b57c845f973d', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:06.562', NULL),
('96788137-886a-4ab6-a70e-3e000076f6e0', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '1efdebec-2a34-4c5e-ba99-ee226d760c6b', 1, '2026-02-09 18:17:06.052', NULL),
('99bab770-0813-4557-bc65-8eaaf2db7201', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '28866626-1f30-404c-80c5-11600ca9ab79', 1, '2026-02-09 18:17:05.962', NULL),
('a4f31143-7f05-49c3-901a-bb9543095075', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'ec00366c-f7af-4583-b136-d422f1cd82f9', 1, '2026-02-09 18:17:05.937', NULL),
('a6ba5569-c070-4991-b802-2f7456f2d655', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'e98e462e-8ed9-441b-a67a-e63d482bd95d', 1, '2026-02-09 18:17:05.980', NULL),
('a743e7a1-3023-4622-b271-f9e0b58a31ba', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', '1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 1, '2026-02-09 18:17:06.499', NULL),
('a81c0bb4-0b71-4551-9c5f-59bae671bd74', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'dd5515be-903d-439a-9e3d-953a221ac0c9', 1, '2026-02-09 18:17:06.001', NULL),
('adfd542b-e2aa-40f9-bca5-a92960d31883', '5909a885-185f-41c8-88b5-b57c845f973d', '039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 1, '2026-02-09 18:17:06.576', NULL),
('b11fc86e-0d5c-4cc1-a66a-8e2681e260c0', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 1, '2026-02-09 18:17:06.074', NULL),
('b6ddfa29-9b39-4abd-ba76-61181c11474f', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '1efdebec-2a34-4c5e-ba99-ee226d760c6b', 1, '2026-02-09 18:17:06.271', NULL),
('ba06f10e-a57f-4029-88bf-83d558e8ad28', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '3e110ac1-24ba-4d72-a05c-c071d1437f5e', 1, '2026-02-09 18:17:05.910', NULL),
('bb6772c9-007e-4c78-a1e3-6d676f12c7ea', '2af770f4-305f-4409-95d8-ede75d36c5ab', '2d133725-2cbd-4cc7-8d95-815825601223', 1, '2026-02-09 18:17:06.441', NULL),
('bc1a9fcf-724b-4b4e-bc07-f138e4106a29', '5909a885-185f-41c8-88b5-b57c845f973d', '1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 1, '2026-02-09 18:17:06.570', NULL),
('be5ce652-de73-4e6d-bb07-77947aed834a', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'bc603dc4-cad2-462a-95c6-8939b999738f', 1, '2026-02-09 18:17:06.241', NULL),
('bf6d74cb-e98c-4da8-9870-ee64914c60ca', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', '039ac500-7adb-4a3b-86d5-7c16c37f5ae7', 1, '2026-02-09 18:17:06.507', NULL),
('bf9e1faa-ced5-4866-b6d3-81ccfb366f43', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '5ce5d00c-eb45-441d-95fb-9404154926e5', 1, '2026-02-09 18:17:06.235', NULL),
('c09d70d8-bf09-4706-a70b-e3eb85770eb6', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '2ef1b933-a0cd-4bef-bb06-17530f691ed7', 1, '2026-02-09 18:17:06.112', NULL),
('c5bbfc83-3d89-4b5f-bc83-8d815978999d', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '2d133725-2cbd-4cc7-8d95-815825601223', 1, '2026-02-09 18:17:06.094', NULL),
('c8f6cf96-5d13-4c93-a57d-9095c33b9620', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '0a044a24-b4cb-488b-b410-40be00b82ef6', 1, '2026-02-09 18:17:05.953', NULL),
('c9fa3d16-a2cd-4815-a78e-89c0a8df4791', '2af770f4-305f-4409-95d8-ede75d36c5ab', '1eb5da1e-3a74-4ee0-84c6-d5b9de7f536a', 1, '2026-02-09 18:17:06.395', NULL),
('ce515955-8957-44b9-a9b6-a05b3e13bdf7', '2af770f4-305f-4409-95d8-ede75d36c5ab', '5ce5d00c-eb45-441d-95fb-9404154926e5', 1, '2026-02-09 18:17:06.402', NULL),
('cec02703-4026-4f3b-b4f5-0a1692d5a899', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'b0e4833a-076e-44ed-95a3-aea8ec26da27', 1, '2026-02-09 18:17:05.989', NULL),
('d0ecd4f1-8789-4b16-811d-ff8b4b4793de', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'ec00366c-f7af-4583-b136-d422f1cd82f9', 1, '2026-02-09 18:17:06.248', NULL),
('d2108ef9-5591-46cf-ae04-e936ad59899d', '2af770f4-305f-4409-95d8-ede75d36c5ab', 'a9129657-8d7f-4ce0-ad2b-9a21e109b560', 1, '2026-02-09 18:17:06.380', NULL),
('d316dbbe-8cc4-4405-a759-124cd938c34f', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '904cc8e2-95bb-4d21-b598-6e0f4471978a', 1, '2026-02-09 18:17:06.362', NULL),
('d4e5a2fd-0d07-43fd-9a18-7742a322ed99', '2af770f4-305f-4409-95d8-ede75d36c5ab', '2ef1b933-a0cd-4bef-bb06-17530f691ed7', 1, '2026-02-09 18:17:06.449', NULL),
('d72b5791-c6df-49db-8ebf-3022e6e1e400', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', '6de42939-7259-4c33-beeb-b7734f5629a7', 1, '2026-02-09 18:17:06.515', NULL),
('e89bdb7b-1856-43a3-8e9e-5ef62d2d5cb7', '72cc706f-6863-4b69-8fcb-44f9cafd5807', 'a4a4e515-6be6-427d-8215-129b840ec11b', 1, '2026-02-09 18:17:06.264', NULL),
('ebd2be5a-83c8-4345-842a-3c3ff78d0567', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '2e19e081-6d18-43f8-9083-6ba93d1ea8d0', 1, '2026-02-09 18:17:06.181', NULL),
('ee865f7f-bffd-444f-acf2-d66b15daffb5', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', '44b083e7-059a-4c80-89e6-29232736019c', 1, '2026-02-09 18:17:06.141', NULL),
('f027df34-88db-4bfe-82ce-75d5f141aa1a', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'a4a4e515-6be6-427d-8215-129b840ec11b', 1, '2026-02-09 18:17:06.037', NULL),
('f2b97cbd-c242-47ca-9d27-465f0fda34a6', '2af770f4-305f-4409-95d8-ede75d36c5ab', '780ec159-8223-4502-9a71-7e792be5ba69', 1, '2026-02-09 18:17:06.457', NULL),
('f734ef02-945a-498f-bcfc-de76f44432a1', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'bdf1f10c-59c1-4eee-9a81-e3598e8c0ff4', 1, '2026-02-09 18:17:05.893', NULL),
('f86d0c5c-96f6-464f-94f5-ce83aa40e366', 'c37ee339-293f-4bf7-94bf-60a4c8b886d2', 'd10424b6-e6a8-4621-80d3-cffdd5e9b17a', 1, '2026-02-09 18:17:06.539', NULL),
('fa8288a9-339b-440c-b629-9469b0959c1b', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '2d133725-2cbd-4cc7-8d95-815825601223', 1, '2026-02-09 18:17:06.295', NULL),
('fb3039f2-47d6-4287-bd69-f51e0731dfd8', '72cc706f-6863-4b69-8fcb-44f9cafd5807', '2ef1b933-a0cd-4bef-bb06-17530f691ed7', 1, '2026-02-09 18:17:06.303', NULL),
('fc4ba2ad-e6d6-47bd-ae1c-61f7696ef9a4', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'f0fd8f76-e511-4c69-aae1-9a1c1bc091ad', 1, '2026-02-09 18:17:06.024', NULL);

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
-- Table structure for table `site_visits`
--

CREATE TABLE `site_visits` (
  `id` varchar(255) NOT NULL,
  `visitorId` varchar(255) NOT NULL,
  `sessionId` varchar(255) NOT NULL,
  `path` varchar(500) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_visits`
--

INSERT INTO `site_visits` (`id`, `visitorId`, `sessionId`, `path`, `userId`, `userAgent`, `ip`, `createdAt`) VALUES
('0189b86e-94c5-45c0-a9ff-d09f08db36be', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '898aa311-44c3-4f9f-a071-466b3c476d44', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:26:29.995'),
('019c6399-2876-442f-b40f-ac4eddfefa42', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:53:32.832'),
('0567bbd3-42e0-4dde-84fd-df1cd5235140', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 12:05:06.728'),
('05b1ce92-7a8f-453a-a511-16149b01e6a4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/assets', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 13:53:21.130'),
('05f9bfc0-4d3e-4d07-bce3-ef8d8ec9776b', 'aba367f2-7c23-4777-a261-8bd19d682e78', '591f06c8-d411-4ab2-8f09-703331858927', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 10:00:31.630'),
('09b11eac-3513-406c-aa83-8ddd72329ae4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:27:56.176'),
('0a02908f-a08c-4172-a878-107914b73d83', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/galleries', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:48:12.003'),
('0bc785c2-dccc-4808-82fa-da292beeb4ee', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 09:03:07.947'),
('0d62fc35-02ea-40ff-8b1d-e994f9042f8c', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members/de10819f-0034-4ff6-9516-3ac5df4691ed', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:30:38.768'),
('0d7a4364-bf22-4141-ad21-0de5d60d84f6', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:16:12.724'),
('0e08f4e7-d96d-47f2-ab08-eeba75bb2c08', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 10:59:43.016'),
('0e4a5fd6-c3da-412d-b149-947d49ae0254', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cca0b95f-f5d6-4d07-ab44-6e8d7bdd431b', '/dashboard/admin/organizations/c02137d0-c3c1-445d-9d1a-92c7be200332', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 16:24:23.720'),
('0f04384b-77d5-4574-a9ce-ff9269a74f9f', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'dede3470-5fc4-484b-b533-e7e684fdf749', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 08:09:46.996'),
('11279b82-e815-4286-9b37-532fae7e28c8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '65b62226-3747-4fa3-81f2-fe51a45b3058', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:57:33.899'),
('114894c0-5896-4344-8b50-7e403428dc76', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:36:29.072'),
('115e3f51-05d5-4628-b2c7-1bb6984dcf98', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:20.456'),
('11e013e8-f9ae-4962-a3f8-ac5d0246f2a4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:05:01.359'),
('125c572f-db6f-40ff-8968-3b78c026e078', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:46:07.506'),
('12ce885d-704a-4d22-be2b-f076b7da981c', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/documents', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:31:36.632'),
('13ac65fa-f599-4b43-8f4f-c267ddfab136', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'c0c6a559-98ca-4b4e-b610-3e91804e00a4', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:57:24.544'),
('182b7d9c-36d4-4a01-90e0-db86d1056123', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:47:09.038'),
('18a67e2c-4778-4596-8575-8c73d1b93f56', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:44:29.336'),
('1a045139-1a73-4d8a-a93f-4a0e3253b5dc', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:23:34.348'),
('1af2688e-7930-4196-9811-fc5992550855', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/posts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:48:09.295'),
('1af43c46-a85a-4026-88d5-bea2512edbdf', 'aba367f2-7c23-4777-a261-8bd19d682e78', '65b62226-3747-4fa3-81f2-fe51a45b3058', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:32:37.191'),
('1e23e5a0-a374-4896-810d-607c711ae1f8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/posts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:05:32.257'),
('1e72fac8-fc81-4187-b51d-9a3a10709011', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/roles', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:31:50.763'),
('1eb50c0a-8f1f-4a7a-ae6c-07edccb2c25a', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'c5603455-9f70-4669-9854-bf533c3b61a8', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 10:53:39.502'),
('20d27ee7-0ab6-4863-b07c-68f4cef11600', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/reports', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:47:05.997'),
('2184c0b0-1b04-4e6a-aac3-26ed038e3730', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/officials', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:49:19.917'),
('219bf3b7-3fdf-43e3-b1f3-913931d668a8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '76c61a7e-bfb7-489a-847b-66819a1599c5', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 13:30:53.696'),
('22178ff3-025e-49a6-ab3c-e46bc67dbdc3', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/adhkar', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:24.995'),
('23079174-aba5-458d-8495-ef256f1a3d23', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:48.684'),
('2724189a-b97d-4e5a-af88-b7b634079aae', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 15:03:03.008'),
('27335cce-f449-4441-a2af-1fd5f29a793e', 'aba367f2-7c23-4777-a261-8bd19d682e78', '88fa3e85-4300-4c06-becb-fcd17acc8c06', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 07:15:20.824'),
('27db7ada-5175-491d-83b0-e133022b8b88', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'fcf03513-7dd4-445c-8f60-d1eee9cfc3a5', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:57:31.937'),
('294972aa-56a4-4cab-a3ff-e960425322c5', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'f6215dc2-d41b-4f55-86c2-9954192b4097', '/dashboard/admin/users', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 16:16:41.437'),
('295c305d-d306-49eb-a91f-c755b4213db1', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations/c02137d0-c3c1-445d-9d1a-92c7be200332', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 15:13:47.499'),
('299b7218-d093-4188-8830-adb10892afda', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/special-programmes/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:27:30.359'),
('2d1139b6-e12b-4983-aaf1-04810dbcfcd3', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:18:45.325'),
('32da56af-2f70-4a0c-a659-835f55232499', 'aba367f2-7c23-4777-a261-8bd19d682e78', '3e1cd580-965a-46fb-be83-268a6c8e4a9c', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 08:04:26.806'),
('347309f2-c88a-453a-8cb7-fa39e5c86a21', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:32:58.812'),
('34cfd83a-e228-4309-b297-cccebd161105', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '898aa311-44c3-4f9f-a071-466b3c476d44', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:26:11.609'),
('35148cd5-f3c3-4453-9cff-1fac9da26312', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/teskiyah', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:30.653'),
('358ba6fa-4041-4bfa-8511-78f3b02353d4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/auth/signup', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:18:54.193'),
('3619e080-2dc2-48b8-82e7-85740baf44b5', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:23:42.640'),
('3668c7cd-cd5d-4e44-82c8-6ee6e8666fe3', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/meetings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:05:06.516'),
('3758c1fe-8409-4199-82ed-64173ca6610d', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:53:26.595'),
('393af3fa-57ca-4da1-b9e3-f85dda91ca72', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:29:43.688'),
('3aaa3085-a64a-47c7-9b2c-94f0ca0260ae', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '47599a5e-5d95-40de-bb0e-9dee7b33b988', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:34:37.044'),
('3b47fb09-c288-48b0-adaf-44892843b512', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:02:07.932'),
('3d4384d0-8f43-45fa-9ee8-d8cea3ae23a1', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/broadcasts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:43:52.522'),
('3d813a68-e6eb-42e4-861f-26ffdfcd9b38', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/finance/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:05:12.274'),
('4003e0da-09a7-4333-bdbb-8bcedac7997a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/finance/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:35.913'),
('4063ca85-3c9c-4b4e-9d96-e826fd3173f6', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 10:51:26.707'),
('42748ada-bf6c-4e48-bb57-56f1984b9eff', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '36cad9be-78db-4df8-a74d-0f25b906ef8c', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:36:17.188'),
('444ee240-922a-4902-905f-12e2a6c489e2', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:49:23.596'),
('484ce6ad-acb9-40f7-8706-c177a170c515', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:26:39.894'),
('4a9a9e9b-c6fd-4a50-a6a2-44088121bc3c', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 15:00:03.446'),
('4b34f5db-11bc-4a3f-bf0a-75c853ee2985', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/occasions', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:36.526'),
('4babfe2c-a82e-473b-9959-33b11624620a', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '86889e5d-0db7-46e0-9a01-b5e5af93e2c1', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 16:15:43.611'),
('4bb5068d-a36d-4587-9192-dd0dee2e7788', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/galleries', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:20.943'),
('50483866-0d6a-4cea-9ca9-5ec4500ff01b', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/admin/cms/pages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:37:29.644'),
('53b150c0-731f-43d9-9e9c-3fdfe35a316d', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:46:22.766'),
('54c2c503-ed60-4d33-a171-568f68650b09', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:57:00.217'),
('56899934-63bd-47bc-9a09-09d85fe0a040', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 10:52:55.556'),
('57806f2c-7872-46c6-a110-07aad7614a82', 'aba367f2-7c23-4777-a261-8bd19d682e78', '88fa3e85-4300-4c06-becb-fcd17acc8c06', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 07:24:39.079'),
('5de12e5a-c68b-4a95-8fa0-b2ee7a715345', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1dbc8d26-eaed-4f07-8f44-bb3b1bffc2a3', '/dashboard/admin/galleries', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 09:03:58.064'),
('5df58634-eb60-465c-b424-efa39d65e496', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 13:53:10.262'),
('5edb1278-c359-4c7a-a652-466c59373cff', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings/navigation', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:34:36.630'),
('5efb6d24-fceb-4958-a1f1-9867c43eec1a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:51:55.643'),
('604c5de1-6820-4f34-8c1d-fdab4a0dc3f2', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/officials', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:59.048'),
('61267384-4072-4f2b-9e19-939e4cc762e8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '3e1cd580-965a-46fb-be83-268a6c8e4a9c', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 08:07:00.138'),
('620e9491-854c-4be4-b5f7-1db33b446e50', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cca0b95f-f5d6-4d07-ab44-6e8d7bdd431b', '/dashboard/admin/officials/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 16:42:01.409'),
('6227d564-bd47-4358-b85d-61ca3665f478', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:06:44.197'),
('626c72f8-cb2b-44b9-8a5e-5cc8399e048c', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:51:06.219'),
('63938a02-1561-4fb0-80f3-a694f6e26c1a', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:58:38.900'),
('651cdfeb-c638-41e1-a308-d92e6a60b31f', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'dede3470-5fc4-484b-b533-e7e684fdf749', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 08:21:20.328'),
('679409ed-e6ef-4bf3-b04a-bb9069bfa0c6', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'c5603455-9f70-4669-9854-bf533c3b61a8', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 10:54:42.764'),
('68960e02-d0b1-4987-94ac-11bf2128df0c', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1dbc8d26-eaed-4f07-8f44-bb3b1bffc2a3', '/dashboard/admin/burials', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 09:00:19.949'),
('6b4062ca-e12b-4c0d-a50c-dd4e51392047', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member/apply', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:41:04.286'),
('6d3840d0-fb1d-4f7c-b563-ca2381d41d47', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/payments', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:31:15.265'),
('6ebff26b-7e1b-4719-ae75-cd42dcc52c2e', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cca0b95f-f5d6-4d07-ab44-6e8d7bdd431b', '/dashboard/admin/officials/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 16:25:19.289'),
('700b013a-cd2f-48af-b0fc-1b309ba6f157', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/media', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:01.080'),
('72a3b2f9-704d-4724-840d-2c41481a66dd', 'aba367f2-7c23-4777-a261-8bd19d682e78', '63869f4b-8a02-46d0-ab34-1a49122cd69f', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 14:39:59.276'),
('751988ec-6f45-4d68-9e59-6235ef07481a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 12:24:07.216'),
('7833065f-4a37-4f81-aa0c-860cdb7facf1', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:11:29.222'),
('787e330a-c8a7-45b0-8544-c940302bff5c', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:53:01.403'),
('7af3d69b-d657-4291-a902-2677f058b354', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'c0c6a559-98ca-4b4e-b610-3e91804e00a4', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:52:48.056'),
('7b7d794d-1425-444a-a321-339df8e9e04e', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:35:37.966'),
('7b997476-8ed9-49c3-947c-a6c02745b9ca', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:51:59.248'),
('7cde1dc8-773e-4906-a213-ea51e9faf827', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/finance/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:45:08.749'),
('7e2a4eb2-cabf-4a05-a904-03e61fa0e7e8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:48:46.365'),
('7e4e6671-011e-4b5d-a6b3-59af886f47d4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:44:56.276'),
('7fc70bf9-2493-48ea-825d-fb04f325b914', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:51:31.075'),
('7fed512f-3c05-4bc8-8afc-cb4364ce340b', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:45:20.700'),
('81215924-1123-4553-becb-73540c1cf8b8', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:44:54.686'),
('833aa633-8a79-46a9-a0bb-e78cc75eb1bf', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:52:44.014'),
('847184cc-491b-4383-a8b7-eaaa29c4bff2', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:53:39.360'),
('854dd320-23f7-4ead-ab2b-97e9606dd485', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:16:50.476'),
('855c1ca2-ec7c-4e05-9179-0bea0fdc936e', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/broadcasts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:16.007'),
('85c5c71f-fb6d-4dc4-bfdd-1d04b62e30ad', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:12:13.536'),
('87189645-68b3-41b7-9574-eb29a50e5478', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:32:31.351'),
('882a5f72-1f3b-49c6-8d29-1382138ac5bf', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/special-programmes/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:27:05.258'),
('885b005f-58bd-49a3-8902-5cabeec2c695', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:28:57.676'),
('8b3fceca-d6b9-487a-b759-f0ea895ad61f', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member/apply', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:58:42.521'),
('8bad9bc7-1fb6-426e-b283-688db870c51f', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cca0b95f-f5d6-4d07-ab44-6e8d7bdd431b', '/dashboard/admin/organizations/c02137d0-c3c1-445d-9d1a-92c7be200332', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 16:21:58.794'),
('8c74c882-3bb0-40d2-8295-cea57dcb0980', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cefda9f5-5555-4659-82e2-87ad14902110', '/dashboard/broadcasts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 08:54:32.451'),
('8d5ebebf-e1c8-44c2-ad7a-9be476292727', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'dede3470-5fc4-484b-b533-e7e684fdf749', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 08:10:25.265'),
('8db3ae99-499f-4048-876a-41ea703f0c3f', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:26:44.735'),
('8fb27e26-0a59-4b11-bc5f-ac53b0fcb1f9', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/reports', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:57.661'),
('90b570d0-33bd-46a1-b7a7-061487098788', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:44:52.237'),
('90cd956a-7b21-41b7-84d2-78ed38613593', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:39:01.208'),
('91176cb3-3289-4e3f-abc9-95070f3205f2', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 10:51:28.618'),
('917da4be-18a2-4d36-85a0-3dc458c22ce2', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/special-programmes', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:01:27.818'),
('928df00b-4225-4d1f-8cc8-30c7980e6158', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 17:20:02.862'),
('947473bc-71ed-494a-afbc-c89a25d8bb65', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:32:37.504'),
('94d0bb21-8af3-4009-8ec0-c469af45eb61', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/meetings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:47:53.888'),
('9740979c-6f40-4611-bed3-0f94732cd906', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cefda9f5-5555-4659-82e2-87ad14902110', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:04:55.382'),
('9827f97f-4248-4dad-8268-918345c0c234', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/OYO', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:22:40.953'),
('982851fe-846a-4cba-a5a4-edda291c7001', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:57:36.201'),
('9905bb58-b549-4132-9c36-d5c656b43b72', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:39:54.348'),
('9aa2f210-1534-43ca-a253-45a7674fe6c9', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:53:02.719'),
('9b31a959-1680-48c8-9044-8de075af829d', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:11.184'),
('9cdf8add-deb6-4aea-ab06-cfe2045c29b9', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/audit', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:31:41.978'),
('9d8fb271-8d1f-41a3-95c9-8170e7da7599', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 15:03:00.230'),
('9f2e2cdb-a552-4790-af72-868eacc8d771', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/posts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:08.627'),
('a0a493cc-a00f-46a6-bf26-a7b3eefc8498', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:59:55.790'),
('a1ecaccc-0449-4753-abf9-2b8ec13d4a3e', 'aba367f2-7c23-4777-a261-8bd19d682e78', '88fa3e85-4300-4c06-becb-fcd17acc8c06', '/EDO-BENIN-AUCHIBRANC', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 07:24:02.419'),
('a31e8050-c6a7-402b-a89f-78d662fd2be7', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 10:53:15.884'),
('a5b9f435-17c2-4ee7-9acb-9db964743448', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:51:23.842'),
('a7056677-5ece-4f7c-b1da-42710ee9df03', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member/apply', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 15:07:35.878'),
('a7facafa-18b2-4147-8c14-795e7b72351d', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/assets', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:41.633'),
('a8f4520b-9f95-4382-b508-e5df1b2c6375', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:00:56.057'),
('a9e38a4d-207f-4497-a7f6-afbf4410f5a6', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/cms/pages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:45:27.704'),
('a9fd167b-f749-4786-9fb2-7709e53a09a8', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:30:05.834'),
('aa67bba1-a64f-4272-ba8a-17b351220edb', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 12:06:00.417'),
('aa871ea0-69b7-4ebb-bff5-80451156ffe6', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'b735bdc2-01be-4fa8-b269-0c5b2bb37409', '/dashboard/admin/burials', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 10:31:36.490'),
('aae4a665-a3f7-4db9-bbe8-e94d1aedaca4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/finance/campaigns', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 13:56:03.890'),
('acb7bdba-1d34-414e-903d-600a4456abc0', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:17:43.933'),
('ad61f29d-5e90-4ed2-a247-694445e73518', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/users', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:32:02.672'),
('af594dda-c737-4d2d-80f1-79460dda225f', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/teskiyah', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:48:25.102'),
('afaeeecd-a0ef-442b-921d-25d8f57d2691', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:59:38.296'),
('b0098a7e-db08-42b5-99b4-2a6613c65c6a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 15:09:46.121');
INSERT INTO `site_visits` (`id`, `visitorId`, `sessionId`, `path`, `userId`, `userAgent`, `ip`, `createdAt`) VALUES
('b08660af-41f8-4126-8560-6eed27c77acc', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:29:50.218'),
('b12a4655-4e7e-423f-a6b2-c1c113a94be1', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/special-programmes%20text-muted-foreground', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:27:48.222'),
('b1860361-a1dc-4c1e-8f11-8d652e6dd247', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'cefda9f5-5555-4659-82e2-87ad14902110', '/dashboard/broadcasts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:03:03.650'),
('b1f044a6-58f4-4a8b-b6cc-ee3812a30495', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/users', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:29:19.699'),
('b59a2108-e025-4c5a-8c6a-e19d8ebfeb73', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'f6215dc2-d41b-4f55-86c2-9954192b4097', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 16:17:19.207'),
('b691676a-34f4-492e-a41e-447f6391a8d7', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'a632344f-7158-4f2a-8994-01203d8a1e37', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 16:46:24.244'),
('b69e9d78-78d4-4f38-a7da-7fad03988da0', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 13:56:50.505'),
('b6b4541b-25b8-4c57-8ef0-d9cbdea7774a', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member/apply', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 15:00:16.995'),
('b8003d7c-59de-44dc-8e2c-14f9a3670eb9', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:04:26.412'),
('b850d785-faec-4b53-8cb5-a7bbaf586c77', 'aba367f2-7c23-4777-a261-8bd19d682e78', '63869f4b-8a02-46d0-ab34-1a49122cd69f', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 14:52:33.955'),
('ba9de015-ad7b-4e63-948a-a6b3791790b7', 'aba367f2-7c23-4777-a261-8bd19d682e78', '88fa3e85-4300-4c06-becb-fcd17acc8c06', '/OYO', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 07:20:54.566'),
('bb1f00e7-fbed-48b6-a69f-d35186cbc3c2', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/broadcasts', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:34:59.096'),
('bbb55392-f702-4ea7-bcf4-a901ce7c82bb', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/messages', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:51:12.148'),
('bcf62819-78e9-4dc6-a9b1-65f59d818eec', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/users', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:06:03.998'),
('bd567897-02ae-4591-9378-09f4efe52821', 'aba367f2-7c23-4777-a261-8bd19d682e78', '591f06c8-d411-4ab2-8f09-703331858927', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 10:00:19.058'),
('be800993-decc-4603-89df-2c5b2e4e16c5', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:39:26.379'),
('be90cbc9-f423-460a-8f76-ad7d2a4c614d', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/finance/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:01:18.628'),
('bec77648-881f-4aed-a22f-3588d44bb4b2', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 09:08:02.663'),
('c07418fa-83b2-4518-a5a9-57385c255a10', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings/payments', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:36:44.652'),
('c555f336-46b9-4ec3-8d47-39e2bc7dff26', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1c1f325c-b503-404d-9bea-b129a2d93004', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 13:23:43.760'),
('c6bf2a23-ec69-49bf-838c-1b964ccefffd', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:08:36.525'),
('c85f38ec-741b-4151-80da-b6e00da4e619', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:00:49.603'),
('c96e69dc-ac78-4b77-84bc-d4a80fb57ece', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/galleries', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:49:47.571'),
('c984f074-5fb2-4a6c-a715-74843f8a8d19', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members/de10819f-0034-4ff6-9516-3ac5df4691ed', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 09:02:06.493'),
('cc4ffd86-379f-494e-ad92-cf7c1203cdcf', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:32:21.752'),
('cd10be70-b135-4d7f-8551-53cd36555122', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:17:30.300'),
('cd9a80dc-3ec8-48c6-95a4-1f17d967e5f3', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/admin/finance', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:35:45.345'),
('cda7f02c-3840-4118-b0ec-d5177652e8d8', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member/apply', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:58:34.099'),
('d081801b-1ccf-41f2-afb7-8637d4a0b9f9', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:18:35.959'),
('d1052b1c-3741-4560-8011-32d23cea977a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/adhkar', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:48:20.177'),
('d178b08d-650f-4128-9223-2f8879afd2c9', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:30:07.325'),
('d27621d9-a33e-4f3a-99fe-6f641fbb11e4', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/cms/menus', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:48:50.121'),
('d324275e-f2b5-4dc9-8b74-afb6f3f8a7ed', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:15:23.286'),
('d33a2adf-0971-4a2b-9a9b-8b4f72a8dac0', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/meetings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:05:28.226'),
('d3c12db1-82c1-4f1a-950c-8352c2952be8', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/meetings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:30:03.085'),
('d41d1c65-9a6d-40a9-8775-74e8789d98e1', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin/members/de10819f-0034-4ff6-9516-3ac5df4691ed', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:39:09.838'),
('d420b25a-0f6e-4df3-9d85-d95e2a35c784', 'aba367f2-7c23-4777-a261-8bd19d682e78', '63869f4b-8a02-46d0-ab34-1a49122cd69f', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 15:06:54.657'),
('d4f1ad15-9cf3-41e2-8990-257fbfa6ce32', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/dashboard/member', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 15:00:13.210'),
('d4f2395a-861f-47c1-97aa-377b4bc13a38', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'e8384f45-2f12-4834-828a-2a586813d091', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 11:48:18.942'),
('d557ece2-526f-4941-8c72-a26ca74f77ca', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:51:39.394'),
('d565f6a4-620e-43c7-97f1-c8ef5640050b', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', '86889e5d-0db7-46e0-9a01-b5e5af93e2c1', '/dashboard/member', 'c5068b94-ae78-4c39-9ca8-6c43055bde18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 16:14:23.188'),
('d5c1f068-5360-40e1-89e5-026d9e7e47fd', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/OYO', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:28:26.548'),
('d69c92e4-b51e-4109-ae51-cc04084b6d9f', 'aba367f2-7c23-4777-a261-8bd19d682e78', '8e525930-2273-4e05-9cab-9a0882568541', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:17:31.977'),
('d7c80200-7ad1-42e0-8605-a6563314450b', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/members', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:49:13.285'),
('da83119b-b223-4cf2-a50a-366218fec493', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'bebdcce6-2fae-4eb8-a3bd-e47e568fd3de', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:36:53.802'),
('dac3d9be-2c8f-4332-b71c-0e7078ff5929', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/occasions', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:48:33.097'),
('dacb467d-affd-4c42-a787-647de8452eb7', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/reports', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:06:48.755'),
('db26c0ae-5f7f-4cd2-bb41-b59ea5241c46', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:49:25.044'),
('ddb4cd1f-ee86-433c-8905-c1f439aa1fac', 'aba367f2-7c23-4777-a261-8bd19d682e78', '63869f4b-8a02-46d0-ab34-1a49122cd69f', '/dashboard/admin/promotions', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 15:22:36.246'),
('ddba8cb6-1371-49e6-a113-2013122795ca', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:49:16.915'),
('e10a6b5a-9318-407c-9980-9052466c7653', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:53:29.922'),
('e2d50154-4995-4ee0-b9e6-535bcecdfab6', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 16:03:01.696'),
('e566b09a-6123-460c-9aed-8d24f4119b6a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '6bedebe5-6f75-404a-ab0f-2dbc2b176d05', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-13 08:29:04.492'),
('e5c7a29d-7748-4966-a526-991c9fa0f360', 'aba367f2-7c23-4777-a261-8bd19d682e78', '88fa3e85-4300-4c06-becb-fcd17acc8c06', '/OYO-AKINYELE-TOSEBRANCH', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 07:24:28.118'),
('e7e9be1d-09de-4874-ac8c-6d20858a823d', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/dashboard/admin/teskiyah', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:05:52.527'),
('e89ad78e-2777-47c6-b572-5e0689c62c23', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/assets', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:06:39.956'),
('ea80fd5c-3398-4891-90eb-f462aea2d8f5', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:31:05.618'),
('eaacc08e-1ea1-46b2-a7c6-c23ed084a6ff', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1e39a00c-3be2-4b71-8c03-74460dad8c81', '/auth/signin', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 14:24:01.774'),
('ebf06359-a08f-407f-a603-9efa63247410', 'aba367f2-7c23-4777-a261-8bd19d682e78', '35966b3a-90ee-4857-87c7-5c4e8b305791', '/dashboard/admin/settings/payments', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 11:41:05.956'),
('ed056bf6-5c5b-45f9-ad1d-671bd8942194', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'f6215dc2-d41b-4f55-86c2-9954192b4097', '/dashboard/admin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-12 16:16:11.353'),
('f2b99ba1-fa4d-4649-b254-a70e8d81c031', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/auth/signin', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 12:24:04.836'),
('f88a203d-e4b5-4e11-842f-1365acf4f1fa', 'aba367f2-7c23-4777-a261-8bd19d682e78', 'ccabc753-a981-42b5-83e4-2151a95d57fe', '/dashboard/admin/analytics', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 08:27:39.603'),
('f9412272-f980-4186-b001-7b440c85c635', 'aba367f2-7c23-4777-a261-8bd19d682e78', '68027df1-e2e1-4bd8-b75d-b28651daa5a3', '/dashboard/admin/assets', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 09:45:15.150'),
('fa8e116b-0a17-4eab-9070-9c10894b73ac', '0b29b9ff-9b47-49a3-8825-bb74c60ae87c', 'c7b6fb95-20ba-47b2-b474-4ebaa1446960', '/auth/verify-email', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '::1', '2026-02-12 14:39:22.031'),
('fb26ee73-aad8-43b7-b0dc-76006b30b5ea', 'aba367f2-7c23-4777-a261-8bd19d682e78', '2d1d9066-eef4-467a-9145-b572a3b64494', '/dashboard/admin/organizations', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-10 14:52:17.491'),
('fc2c98a3-e6d0-4f09-9353-75f76a581d0e', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:03:43.112'),
('fe560a88-661e-4e6e-8694-477f23102b80', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/assets', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:26:29.509'),
('feef9dd3-91e1-40c5-b42e-d614bbeb1e2a', 'aba367f2-7c23-4777-a261-8bd19d682e78', '1fde6246-e1be-4175-8da7-06777ce0e11b', '/dashboard/admin/cms/pages/new', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 20:45:59.279'),
('ffa16859-811f-4daa-97ca-02abcf0c9c26', 'aba367f2-7c23-4777-a261-8bd19d682e78', '45b2e5d9-ea98-43fe-8b54-cb55aba629e8', '/dashboard/cms', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '::1', '2026-02-11 17:35:16.625');

-- --------------------------------------------------------

--
-- Table structure for table `special_programmes`
--

CREATE TABLE `special_programmes` (
  `id` varchar(255) NOT NULL,
  `organizationId` varchar(255) NOT NULL,
  `specialProgrammeCategory` enum('TESKIYAH_WORKSHOP','FRIDAY_KHUTHBAH','PRESS_RELEASE','STATE_OF_THE_NATION','OTHER') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `year` int(11) NOT NULL,
  `date` timestamp(3) NULL DEFAULT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `isPublished` tinyint(1) DEFAULT 1,
  `createdBy` varchar(255) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `special_programme_files`
--

CREATE TABLE `special_programme_files` (
  `id` varchar(255) NOT NULL,
  `programmeId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `specialProgrammeFileType` enum('AUDIO','VIDEO','DOCUMENT','OTHER') NOT NULL,
  `order` int(11) DEFAULT 0,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(255) NOT NULL,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text DEFAULT NULL,
  `category` enum('EMAIL','NOTIFICATION','GENERAL','AI') NOT NULL,
  `isEncrypted` tinyint(1) DEFAULT 0,
  `description` varchar(500) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `settingKey`, `settingValue`, `category`, `isEncrypted`, `description`, `updatedBy`, `updatedAt`, `createdAt`) VALUES
('0a711858-773b-45f5-9fdb-ba991f7638dd', 'ai_system_prompt', '', 'AI', 0, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-10 14:04:00.855', '2026-02-10 14:04:00.855'),
('2f3d71fc-00f1-41c9-a68c-6a9532fbaafb', 'ai_enabled', 'true', 'AI', 0, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-10 14:04:00.812', '2026-02-10 14:04:00.812'),
('7d10b02e-477b-43bc-875a-fc2a32a3db18', 'membership_registration_enabled', 'true', 'GENERAL', 0, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-10 13:30:34.210', '2026-02-10 13:30:34.210'),
('8ce59172-64a0-416c-85c4-0ced044da8f2', 'ai_provider', 'deepseek', 'AI', 0, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-10 14:04:00.848', '2026-02-10 14:04:00.848'),
('cfb7390a-1702-4ffc-adad-db4c9a10370b', 'membership_recommendation_required', 'true', 'GENERAL', 0, NULL, 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '2026-02-10 13:30:34.282', '2026-02-10 13:30:34.282');

-- --------------------------------------------------------

--
-- Table structure for table `teskiyah_centres`
--

CREATE TABLE `teskiyah_centres` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `time` varchar(255) NOT NULL,
  `contactNumber` varchar(255) DEFAULT NULL,
  `state` varchar(255) NOT NULL,
  `lga` varchar(255) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `organizationId` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
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
  `country` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `publicKey` text DEFAULT NULL,
  `encryptedPrivateKey` text DEFAULT NULL,
  `salt` varchar(255) DEFAULT NULL,
  `encryptedPrivateKeyRecovery` text DEFAULT NULL,
  `recoveryKeyHash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `emailVerified`, `password`, `name`, `phone`, `image`, `country`, `address`, `createdAt`, `updatedAt`, `publicKey`, `encryptedPrivateKey`, `salt`, `encryptedPrivateKeyRecovery`, `recoveryKeyHash`) VALUES
('bea3ace2-2b9b-4868-8798-7a8d5e567a29', 'admin@tmc.org', '2026-02-10 10:12:16.000', '$2b$10$f4d/YUdUEG3M/cO.zs/gv.m/6UnSTisOMGQWnPXOz9yUDxPF8W.OC', 'Super Admin', NULL, NULL, NULL, NULL, '2026-02-10 10:12:16.000', '2026-02-10 10:12:16.000', NULL, NULL, NULL, NULL, NULL),
('c5068b94-ae78-4c39-9ca8-6c43055bde18', 'aa.adelopo2@gmail.com', '2026-02-12 14:39:21.879', '$2b$10$1waUsTo4kfGkusWbCXri/eDoE.mYb91eZjoBWF0Q56aBEmcjxFYni', 'Adelopo abdulazeez', '+2348028511129', NULL, 'NG', '23 okada street oyo', '2026-02-12 15:23:33.957', '0000-00-00 00:00:00.000', NULL, NULL, NULL, NULL, NULL);

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
  `metadata` longtext DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `userId`, `roleId`, `organizationId`, `assignedBy`, `assignedAt`, `expiresAt`, `isActive`, `metadata`) VALUES
('8af9b44d-7cf0-4e2d-a555-6f3aa61085b8', 'bea3ace2-2b9b-4868-8798-7a8d5e567a29', '8a4fc7be-4f1d-4540-a06c-dcfadd3dd1e6', 'c02137d0-c3c1-445d-9d1a-92c7be200332', NULL, '2026-02-10 10:12:16.000', NULL, 1, NULL);

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
-- Indexes for table `adhkar_centres`
--
ALTER TABLE `adhkar_centres`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `asset_maintenance_logs`
--
ALTER TABLE `asset_maintenance_logs`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `broadcasts`
--
ALTER TABLE `broadcasts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `burial_certificates`
--
ALTER TABLE `burial_certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `burial_certificates_burialRequestId_key` (`burialRequestId`),
  ADD UNIQUE KEY `burial_certificates_certificateNumber_key` (`certificateNumber`);

--
-- Indexes for table `burial_requests`
--
ALTER TABLE `burial_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `burial_requests_paymentId_key` (`paymentId`),
  ADD KEY `burial_requests_userId_idx` (`userId`),
  ADD KEY `burial_requests_status_idx` (`status`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_participants`
--
ALTER TABLE `chat_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `chat_participants_chatId_userId_key` (`chatId`,`userId`),
  ADD KEY `chat_participants_userId_fkey` (`userId`);

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
-- Indexes for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `templateKey` (`templateKey`);

--
-- Indexes for table `fees`
--
ALTER TABLE `fees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fee_assignments`
--
ALTER TABLE `fee_assignments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_budgets`
--
ALTER TABLE `finance_budgets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_budget_items`
--
ALTER TABLE `finance_budget_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_fund_requests`
--
ALTER TABLE `finance_fund_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_transactions`
--
ALTER TABLE `finance_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fundraising_campaigns`
--
ALTER TABLE `fundraising_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fundraising_campaigns_organizationId_slug_key` (`organizationId`,`slug`);

--
-- Indexes for table `galleries`
--
ALTER TABLE `galleries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `galleries_organizationId_idx` (`organizationId`);

--
-- Indexes for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gallery_images_galleryId_idx` (`galleryId`);

--
-- Indexes for table `meetings`
--
ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meeting_attendances`
--
ALTER TABLE `meeting_attendances`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meeting_docs`
--
ALTER TABLE `meeting_docs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `members_userId_key` (`userId`),
  ADD UNIQUE KEY `members_memberId_key` (`memberId`),
  ADD KEY `members_organizationId_fkey` (`organizationId`),
  ADD KEY `members_recommendedBy_fkey` (`recommendedBy`),
  ADD KEY `members_approvedBy_fkey` (`approvedBy`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_chatId_idx` (`chatId`),
  ADD KEY `messages_senderId_idx` (`senderId`);

--
-- Indexes for table `navigation_items`
--
ALTER TABLE `navigation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `navigation_items_organizationId_idx` (`organizationId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_userId_idx` (`userId`),
  ADD KEY `notifications_isRead_idx` (`isRead`);

--
-- Indexes for table `occasion_requests`
--
ALTER TABLE `occasion_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `occasion_types`
--
ALTER TABLE `occasion_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `offices`
--
ALTER TABLE `offices`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `organizations_parentId_idx` (`parentId`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pages_organizationId_slug_key` (`organizationId`,`slug`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_paystackRef_key` (`paystackRef`),
  ADD KEY `payments_userId_fkey` (`userId`),
  ADD KEY `payments_organizationId_fkey` (`organizationId`),
  ADD KEY `payments_memberId_fkey` (`memberId`),
  ADD KEY `payments_campaignId_fkey` (`campaignId`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_code_key` (`code`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `posts_slug_key` (`slug`),
  ADD KEY `posts_organizationId_idx` (`organizationId`),
  ADD KEY `posts_authorId_fkey` (`authorId`);

--
-- Indexes for table `programmes`
--
ALTER TABLE `programmes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `programme_registrations`
--
ALTER TABLE `programme_registrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `programme_reports`
--
ALTER TABLE `programme_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `programmeId` (`programmeId`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `promotion_plans`
--
ALTER TABLE `promotion_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `site_visits`
--
ALTER TABLE `site_visits`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `special_programmes`
--
ALTER TABLE `special_programmes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `special_programme_files`
--
ALTER TABLE `special_programme_files`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settingKey` (`settingKey`);

--
-- Indexes for table `teskiyah_centres`
--
ALTER TABLE `teskiyah_centres`
  ADD PRIMARY KEY (`id`);

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
-- Constraints for table `burial_certificates`
--
ALTER TABLE `burial_certificates`
  ADD CONSTRAINT `burial_certificates_burialRequestId_fkey` FOREIGN KEY (`burialRequestId`) REFERENCES `burial_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `burial_requests`
--
ALTER TABLE `burial_requests`
  ADD CONSTRAINT `burial_requests_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `burial_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `chat_participants`
--
ALTER TABLE `chat_participants`
  ADD CONSTRAINT `chat_participants_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chat_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `fundraising_campaigns`
--
ALTER TABLE `fundraising_campaigns`
  ADD CONSTRAINT `fundraising_campaigns_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `galleries`
--
ALTER TABLE `galleries`
  ADD CONSTRAINT `galleries_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD CONSTRAINT `gallery_images_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `galleries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `members_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `members_recommendedBy_fkey` FOREIGN KEY (`recommendedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `navigation_items`
--
ALTER TABLE `navigation_items`
  ADD CONSTRAINT `navigation_items_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Constraints for table `pages`
--
ALTER TABLE `pages`
  ADD CONSTRAINT `pages_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `fundraising_campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `posts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
