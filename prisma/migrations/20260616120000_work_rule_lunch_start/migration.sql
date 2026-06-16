ALTER TABLE "WorkRule" ADD COLUMN "lunchBreakStartTime" TEXT NOT NULL DEFAULT '12:00';

UPDATE "WorkRule"
SET "lunchBreakStartTime" = '12:00'
WHERE "lunchBreakStartTime" IS NULL;
