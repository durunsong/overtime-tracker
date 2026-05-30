ALTER TABLE "WorkRule" ALTER COLUMN "lunchBreakEnabled" SET DEFAULT true;
ALTER TABLE "WorkRule" ALTER COLUMN "lunchBreakMinutes" SET DEFAULT 90;
ALTER TABLE "WorkRule" ALTER COLUMN "weekendEnabled" SET DEFAULT true;

UPDATE "WorkRule"
SET
  "lunchBreakEnabled" = true,
  "lunchBreakMinutes" = 90,
  "weekendEnabled" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "startTime" = '09:30'
  AND "endTime" = '19:00'
  AND "standardWorkMinutes" = 480
  AND "overtimeStartTime" = '19:00'
  AND "beforeStartNotCount" = true
  AND "lunchBreakEnabled" = false
  AND "lunchBreakMinutes" = 0
  AND "weekendEnabled" = false;
