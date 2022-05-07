CREATE TABLE IF NOT EXISTS `incident` (
    `id` bigint(20) NOT NULL,
    `pokestop_id` varchar(128) NOT NULL,
    `start_ms` bigint(20) NOT NULL,
    `expiration_ms` bigint(20) NOT NULL,
    `character` int(2) NOT NULL,
    `updated_ms` bigint(20) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `ix_pokestop` (`pokestop_id`, `expiration_ms`),
    CONSTRAINT `fk_incident_pokestop_id` FOREIGN KEY (`pokestop_id`) REFERENCES `pokestop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
