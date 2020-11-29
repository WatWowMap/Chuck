ALTER TABLE pokestop
ADD COLUMN `ar_scan_eligible` tinyint(1) unsigned;

ALTER TABLE gym
ADD COLUMN `ar_scan_eligible` tinyint(1) unsigned;
