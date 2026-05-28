-- CreateTable
CREATE TABLE "OvertimeShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeShare_token_key" ON "OvertimeShare"("token");

-- CreateIndex
CREATE INDEX "OvertimeShare_userId_createdAt_idx" ON "OvertimeShare"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OvertimeShare_month_idx" ON "OvertimeShare"("month");

-- AddForeignKey
ALTER TABLE "OvertimeShare" ADD CONSTRAINT "OvertimeShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
