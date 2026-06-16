CREATE TYPE "WorkDayOverrideKind" AS ENUM ('FORCE_WORKDAY', 'FORCE_REST', 'FORCE_HOLIDAY');

CREATE TABLE "WorkDayOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "kind" "WorkDayOverrideKind" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkDayOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkDayOverride_userId_workDate_key" ON "WorkDayOverride"("userId", "workDate");
CREATE INDEX "WorkDayOverride_userId_idx" ON "WorkDayOverride"("userId");

ALTER TABLE "WorkDayOverride" ADD CONSTRAINT "WorkDayOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
