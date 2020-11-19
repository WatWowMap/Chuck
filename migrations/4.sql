ALTER TABLE assignment
DROP FOREIGN KEY `assignment_fk_device_uuid`,
ADD COLUMN id INT UNSIGNED AUTO_INCREMENT NOT NULL,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
MODIFY COLUMN device_uuid VARCHAR(30) NULL;

ALTER TABLE assignment
ADD CONSTRAINT `assignment_fk_device_uuid` FOREIGN KEY (`device_uuid`) REFERENCES `device`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD COLUMN source_instance_name varchar(30) DEFAULT NULL,
ADD CONSTRAINT `assignment_fk_source_instance_name` FOREIGN KEY (`source_instance_name`) REFERENCES `instance`(`name`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD COLUMN date DATE DEFAULT NULL,
ADD UNIQUE KEY assignment_unique (`device_uuid`,`instance_name`,`time`,`date`);

CREATE VIEW `accounts_dashboard` AS SELECT `username`,`level` FROM account;