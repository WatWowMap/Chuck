ALTER TABLE pokemon
    ADD COLUMN `atk_inactive` tinyint(3) unsigned DEFAULT NULL,
    ADD COLUMN `def_inactive` tinyint(3) unsigned DEFAULT NULL,
    ADD COLUMN `sta_inactive` tinyint(3) unsigned DEFAULT NULL;
