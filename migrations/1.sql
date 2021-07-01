/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table "account"
--

CREATE TABLE IF NOT EXISTS "account" (
  "username" varchar(32) NOT NULL,
  "password" varchar(32) NOT NULL,
  "first_warning_timestamp" int DEFAULT NULL,
  "failed_timestamp" int DEFAULT NULL,
  "failed" varchar(32) DEFAULT NULL,
  "level" smallint NOT NULL DEFAULT 0,
  "last_encounter_lat" double precision DEFAULT NULL,
  "last_encounter_lon" double precision DEFAULT NULL,
  "last_encounter_time" int DEFAULT NULL,
  "spins" smallint NOT NULL DEFAULT 0,
  "tutorial" smallint NOT NULL DEFAULT 0,
  "creation_timestamp_ms" int DEFAULT NULL,
  "warn" smallint DEFAULT NULL,
  "warn_expire_ms" int DEFAULT NULL,
  "warn_message_acknowledged" smallint DEFAULT NULL,
  "suspended_message_acknowledged" smallint DEFAULT NULL,
  "was_suspended" smallint DEFAULT NULL,
  "banned" smallint DEFAULT NULL,
  PRIMARY KEY ("username")
);

--
-- Table structure for table "instance"
--

CREATE TYPE "instance_type" AS ENUM ('circle_pokemon','circle_raid','circle_smart_raid','auto_quest','pokemon_iv');

CREATE TABLE IF NOT EXISTS "instance" (
  "name" varchar(30) NOT NULL,
  "type" instance_type NOT NULL,
  "data" text NOT NULL,
  PRIMARY KEY ("name")
);

--
-- Table structure for table "device"
--

CREATE TABLE IF NOT EXISTS "device" (
  "uuid" varchar(40) NOT NULL,
  "instance_name" varchar(30) DEFAULT NULL,
  "last_host" varchar(30) DEFAULT NULL,
  "last_seen" int NOT NULL DEFAULT 0,
  "account_username" varchar(32) DEFAULT NULL,
  "last_lat" double precision DEFAULT 0,
  "last_lon" double precision DEFAULT 0,
  PRIMARY KEY ("uuid"),
  UNIQUE("account_username"),
  CONSTRAINT "fk_account_username" FOREIGN KEY ("account_username") REFERENCES "account" ("username") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "fk_instance_name" FOREIGN KEY ("instance_name") REFERENCES "instance" ("name") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "fk_instance_name" ON "device" ("instance_name");

--
-- Table structure for table "s2cell"
--

CREATE TABLE IF NOT EXISTS "s2cell" (
  "id" bigint NOT NULL,
  "level" smallint DEFAULT NULL,
  "center_lat" double precision NOT NULL DEFAULT 0.00000000000000,
  "center_lon" double precision NOT NULL DEFAULT 0.00000000000000,
  "updated" int NOT NULL,
  PRIMARY KEY ("id")
);
CREATE INDEX "ix_coords" ON "s2cell" ("center_lat","center_lon");
CREATE INDEX "ix_updated" ON "s2cell" ("updated");

--
-- Table structure for table "spawnpoint"
--

CREATE TABLE IF NOT EXISTS "spawnpoint" (
  "id" bigint NOT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "updated" int NOT NULL DEFAULT 0,
  "despawn_sec" smallint DEFAULT NULL,
  PRIMARY KEY ("id")
);
CREATE INDEX "ix_coords" ON "spawnpoint" ("lat","lon");
CREATE INDEX "ix_updated" ON "spawnpoint" ("updated");

--
-- Table structure for table "gym"
--

CREATE TABLE IF NOT EXISTS "gym" (
  "id" varchar(35) NOT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "name" varchar(128) DEFAULT NULL,
  "url" varchar(200) DEFAULT NULL,
  "last_modified_timestamp" int DEFAULT NULL,
  "raid_end_timestamp" int DEFAULT NULL,
  "raid_spawn_timestamp" int DEFAULT NULL,
  "raid_battle_timestamp" int DEFAULT NULL,
  "updated" int NOT NULL,
  "raid_pokemon_id" smallint DEFAULT NULL,
  "guarding_pokemon_id" smallint DEFAULT NULL,
  "availble_slots" smallint DEFAULT NULL,
  "team_id" smallint DEFAULT NULL,
  "raid_level" smallint DEFAULT NULL,
  "enabled" smallint DEFAULT NULL,
  "ex_raid_eligible" smallint DEFAULT NULL,
  "in_battle" smallint DEFAULT NULL,
  "raid_pokemon_move_1" smallint DEFAULT NULL,
  "raid_pokemon_move_2" smallint DEFAULT NULL,
  "raid_pokemon_form" int DEFAULT NULL,
  "raid_pokemon_cp" int DEFAULT NULL,
  "raid_is_exclusive" smallint DEFAULT NULL,
  "cell_id" bigint DEFAULT NULL,
  "deleted" smallint NOT NULL DEFAULT 0,
  "total_cp" int DEFAULT NULL,
  "first_seen_timestamp" int NOT NULL,
  "raid_pokemon_gender" smallint DEFAULT NULL,
  "sponsor_id" smallint DEFAULT NULL,
  "raid_pokemon_costume" smallint DEFAULT NULL,
  "raid_pokemon_evolution" smallint DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_gym_cell_id" FOREIGN KEY ("cell_id") REFERENCES "s2cell" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ix_coords" ON "gym" ("lat","lon");
CREATE INDEX "ix_raid_end_timestamp" ON "gym" ("raid_end_timestamp");
CREATE INDEX "ix_updated" ON "gym" ("updated");
CREATE INDEX "ix_raid_pokemon_id" ON "gym" ("raid_pokemon_id");
CREATE INDEX "fk_gym_cell_id" ON "gym" ("cell_id");
CREATE INDEX "ix_gym_deleted" ON "gym" ("deleted");

--
-- Table structure for table "pokestop"
--

CREATE TABLE IF NOT EXISTS "pokestop" (
  "id" varchar(35) NOT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "name" varchar(128) DEFAULT NULL,
  "url" varchar(200) DEFAULT NULL,
  "lure_expire_timestamp" int DEFAULT NULL,
  "last_modified_timestamp" int DEFAULT NULL,
  "updated" int NOT NULL,
  "enabled" smallint DEFAULT NULL,
  "quest_type" int DEFAULT NULL,
  "quest_timestamp" int DEFAULT NULL,
  "quest_target" smallint DEFAULT NULL,
  "quest_conditions" text DEFAULT NULL,
  "quest_rewards" text DEFAULT NULL,
  "quest_template" varchar(100) DEFAULT NULL,
  "quest_pokemon_id" smallint GENERATED ALWAYS AS "quest_rewards"::json->'info'->'{info,pokemon_id}',
  "quest_reward_type" smallint GENERATED ALWAYS AS (json_extract(json_extract("quest_rewards",_utf8mb4'$[*].type'),_utf8mb4'$[0]')) VIRTUAL,
  "quest_item_id" smallint GENERATED ALWAYS AS (json_extract(json_extract("quest_rewards",_utf8mb4'$[*].info.item_id'),_utf8mb4'$[0]')) VIRTUAL,
  "cell_id" bigint DEFAULT NULL,
  "deleted" smallint NOT NULL DEFAULT 0,
  "lure_id" smallint DEFAULT 0,
  "pokestop_display" smallint DEFAULT 0,
  "incident_expire_timestamp" int DEFAULT NULL,
  "first_seen_timestamp" int NOT NULL,
  "grunt_type" smallint DEFAULT 0,
  "sponsor_id" smallint DEFAULT NULL,
  PRIMARY KEY ("id"),
  CREATE INDEX "ix_coords" ON "" ("lat","lon");
  CREATE INDEX "ix_lure_expire_timestamp" ON "" ("lure_expire_timestamp");
  CREATE INDEX "ix_updated" ON "" ("updated");
  CREATE INDEX "fk_pokestop_cell_id" ON "" ("cell_id");
  CREATE INDEX "ix_pokestop_deleted" ON "" ("deleted");
  CREATE INDEX "ix_quest_pokemon_id" ON "" ("quest_pokemon_id");
  CREATE INDEX "ix_quest_reward_type" ON "" ("quest_reward_type");
  CREATE INDEX "ix_quest_item_id" ON "" ("quest_item_id");
  CREATE INDEX "ix_incident_expire_timestamp" ON "" ("incident_expire_timestamp");
  CONSTRAINT "fk_pokestop_cell_id" FOREIGN KEY ("cell_id") REFERENCES "s2cell" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

--
-- Table structure for table "pokemon"
--

CREATE TABLE IF NOT EXISTS "pokemon" (
  "id" varchar(25) NOT NULL,
  "pokestop_id" varchar(35) DEFAULT NULL,
  "spawn_id" bigint DEFAULT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "weight" double precision DEFAULT NULL,
  "size" double precision DEFAULT NULL,
  "expire_timestamp" int DEFAULT NULL,
  "updated" int DEFAULT NULL,
  "pokemon_id" smallint NOT NULL,
  "move_1" smallint DEFAULT NULL,
  "move_2" smallint DEFAULT NULL,
  "gender" smallint DEFAULT NULL,
  "cp" smallint DEFAULT NULL,
  "atk_iv" smallint DEFAULT NULL,
  "def_iv" smallint DEFAULT NULL,
  "sta_iv" smallint DEFAULT NULL,
  "form" smallint DEFAULT NULL,
  "level" smallint DEFAULT NULL,
  "weather" smallint DEFAULT NULL,
  "costume" smallint DEFAULT NULL,
  "first_seen_timestamp" int NOT NULL,
  "changed" int NOT NULL DEFAULT 0,
  "iv" float(5,2) GENERATED ALWAYS AS (("atk_iv" + "def_iv" + "sta_iv") * 100 / 45) VIRTUAL,
  "cell_id" bigint DEFAULT NULL,
  "expire_timestamp_verified" smallint NOT NULL,
  "shiny" smallint DEFAULT 0,
  "username" varchar(15) DEFAULT NULL,
  "is_ditto" smallint DEFAULT 0,
  "display_pokemon_id" smallint DEFAULT NULL,
  "capture_1" double precision DEFAULT NULL,
  "capture_2" double precision DEFAULT NULL,
  "capture_3" double precision DEFAULT NULL,
  "pvp_rankings_great_league" text DEFAULT NULL,
  "pvp_rankings_ultra_league" text DEFAULT NULL,
  PRIMARY KEY ("id"),
  CREATE INDEX "ix_coords" ON "" ("lat","lon");
  CREATE INDEX "ix_pokemon_id" ON "" ("pokemon_id");
  CREATE INDEX "ix_updated" ON "" ("updated");
  CREATE INDEX "fk_spawn_id" ON "" ("spawn_id");
  CREATE INDEX "fk_pokestop_id" ON "" ("pokestop_id");
  CREATE INDEX "ix_atk_iv" ON "" ("atk_iv");
  CREATE INDEX "ix_def_iv" ON "" ("def_iv");
  CREATE INDEX "ix_sta_iv" ON "" ("sta_iv");
  CREATE INDEX "ix_changed" ON "" ("changed");
  CREATE INDEX "ix_level" ON "" ("level");
  CREATE INDEX "fk_pokemon_cell_id" ON "" ("cell_id");
  CREATE INDEX "ix_expire_timestamp" ON "" ("expire_timestamp");
  CREATE INDEX "ix_iv" ON "" ("iv");
  CONSTRAINT "fk_pokemon_cell_id" FOREIGN KEY ("cell_id") REFERENCES "s2cell" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fk_pokestop_id" FOREIGN KEY ("pokestop_id") REFERENCES "pokestop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "fk_spawn_id" FOREIGN KEY ("spawn_id") REFERENCES "spawnpoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

--
-- Table structure for table "weather"
--

CREATE TABLE IF NOT EXISTS "weather" (
  "id" bigint NOT NULL,
  "level" smallint DEFAULT NULL,
  "latitude" double precision NOT NULL DEFAULT 0.00000000000000,
  "longitude" double precision NOT NULL DEFAULT 0.00000000000000,
  "gameplay_condition" smallint DEFAULT NULL,
  "wind_direction" int DEFAULT NULL,
  "cloud_level" smallint DEFAULT NULL,
  "rain_level" smallint DEFAULT NULL,
  "wind_level" smallint DEFAULT NULL,
  "snow_level" smallint DEFAULT NULL,
  "fog_level" smallint DEFAULT NULL,
  "special_effect_level" smallint DEFAULT NULL,
  "severity" smallint DEFAULT NULL,
  "warn_weather" smallint DEFAULT NULL,
  "updated" int NOT NULL,
  PRIMARY KEY ("id")
);
