-- Broadcasts had TWO schema fields (targetLevel, targetOfficialLevel) both mapped to the
-- single `level` column, causing "Column 'level' specified twice" on insert. Split into
-- distinct columns. Existing `level` data becomes target_level; target_official_level is new.
ALTER TABLE `broadcasts` RENAME COLUMN `level` TO `target_level`;
ALTER TABLE `broadcasts` ADD COLUMN `target_official_level` ENUM('NATIONAL','STATE','LOCAL_GOVERNMENT','BRANCH') NULL;
