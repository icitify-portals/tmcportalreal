-- AlterTable
ALTER TABLE `messages` ADD COLUMN `type` VARCHAR(191) NULL DEFAULT 'TEXT',
    ADD COLUMN `encryptedKeys` JSON NULL;
