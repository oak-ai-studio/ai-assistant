ALTER TABLE "User" ADD COLUMN "phone" TEXT;

WITH numbered_users AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "User"
  WHERE "phone" IS NULL
)
UPDATE "User" AS u
SET "phone" = '900' || LPAD(numbered_users.rn::TEXT, 8, '0')
FROM numbered_users
WHERE u."id" = numbered_users."id";

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "VerificationCode" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationCode_phone_expiresAt_idx" ON "VerificationCode"("phone", "expiresAt");
