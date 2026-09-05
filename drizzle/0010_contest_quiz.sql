-- Contest Quiz (isolated) — Live Sync Race + Async Standard
CREATE TABLE `contest_quizzes` (
	`id` varchar(255) NOT NULL,
	`phaseId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`mode` enum('LIVE_SYNC_RACE','ASYNC_STANDARD') NOT NULL,
	`durationSec` int DEFAULT 60,
	`questionWindowSec` int DEFAULT 30,
	`maxAttempts` int DEFAULT 1,
	`shuffleQuestions` boolean DEFAULT false,
	`startsAt` datetime(3),
	`endsAt` datetime(3),
	`published` boolean DEFAULT false,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_quizzes_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_quizzes_phaseId_contest_phases_id_fk` FOREIGN KEY (`phaseId`) REFERENCES `contest_phases`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_quiz_questions` (
	`id` varchar(255) NOT NULL,
	`quizId` varchar(255) NOT NULL,
	`questionNo` int NOT NULL,
	`prompt` text NOT NULL,
	`imageUrl` varchar(500),
	`points` int DEFAULT 1,
	`correctOptionId` varchar(255),
	`explanation` text,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_quiz_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_quiz_questions_quizId_contest_quizzes_id_fk` FOREIGN KEY (`quizId`) REFERENCES `contest_quizzes`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_quiz_options` (
	`id` varchar(255) NOT NULL,
	`questionId` varchar(255) NOT NULL,
	`label` varchar(500) NOT NULL,
	`optionNo` int NOT NULL,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_quiz_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_quiz_options_questionId_contest_quiz_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `contest_quiz_questions`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_quiz_attempts` (
	`id` varchar(255) NOT NULL,
	`quizId` varchar(255) NOT NULL,
	`participantId` varchar(255) NOT NULL,
	`userId` varchar(255),
	`status` enum('IN_PROGRESS','COMPLETED','DISQUALIFIED') DEFAULT 'IN_PROGRESS',
	`totalScore` int DEFAULT 0,
	`correctCount` int DEFAULT 0,
	`totalTimeMs` int DEFAULT 0,
	`finishedAt` datetime(3),
	`startedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_quiz_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_quiz_attempts_quizId_contest_quizzes_id_fk` FOREIGN KEY (`quizId`) REFERENCES `contest_quizzes`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `contest_quiz_attempts_participantId_contest_representatives_id_fk` FOREIGN KEY (`participantId`) REFERENCES `contest_representatives`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `contest_quiz_answers` (
	`id` varchar(255) NOT NULL,
	`attemptId` varchar(255) NOT NULL,
	`questionId` varchar(255) NOT NULL,
	`selectedOptionId` varchar(255),
	`isCorrect` boolean DEFAULT false,
	`pointsEarned` int DEFAULT 0,
	`timeMs` int DEFAULT 0,
	`submittedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `contest_quiz_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_quiz_answers_attemptId_questionId_unique` UNIQUE(`attemptId`,`questionId`)
);
