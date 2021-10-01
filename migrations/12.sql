ALTER TABLE `pokestop`
    ADD COLUMN `lure_first_seen_timestamp` int(11) unsigned NOT NULL DEFAULT 0,
    MODIFY COLUMN `lure_expire_timestamp` int(11) unsigned DEFAULT 0;
UPDATE `pokestop` SET `lure_expire_timestamp` = 0 WHERE `lure_expire_timestamp` IS NULL OR `lure_expire_timestamp` < UNIX_TIMESTAMP();
