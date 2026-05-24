START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260524120329_AddMentorFieldsToTrainer') THEN
    ALTER TABLE "Trainers" ADD "AvgRating" double precision NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260524120329_AddMentorFieldsToTrainer') THEN
    ALTER TABLE "Trainers" ADD "MentorStatus" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260524120329_AddMentorFieldsToTrainer') THEN
    ALTER TABLE "Trainers" ADD "TotalClassesTaught" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260524120329_AddMentorFieldsToTrainer') THEN
    ALTER TABLE "Trainers" ADD "TotalStudents" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260524120329_AddMentorFieldsToTrainer') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260524120329_AddMentorFieldsToTrainer', '9.0.12');
    END IF;
END $EF$;
COMMIT;

