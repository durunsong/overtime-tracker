-- Add account authentication fields and per-user ownership for shared resources.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ImportBatch" ADD COLUMN "userId" TEXT;
ALTER TABLE "WorkRule" ADD COLUMN "userId" TEXT;

INSERT INTO "User" ("id", "name", "email", "createdAt", "updatedAt")
SELECT 'user_durunsongs_default', 'Durun Songs', 'durunsongs@gmail.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "User" WHERE "email" = 'durunsongs@gmail.com'
);

UPDATE "ImportBatch"
SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'durunsongs@gmail.com' LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "WorkRule"
SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'durunsongs@gmail.com' LIMIT 1)
WHERE "userId" IS NULL;

ALTER TABLE "ImportBatch" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "WorkRule" ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE INDEX "ImportBatch_userId_createdAt_idx" ON "ImportBatch"("userId", "createdAt");
CREATE INDEX "WorkRule_userId_isDefault_idx" ON "WorkRule"("userId", "isDefault");

ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkRule" ADD CONSTRAINT "WorkRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
