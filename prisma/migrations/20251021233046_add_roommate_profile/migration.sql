/*
  Warnings:

  - You are about to drop the `roommate_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "roommate_profiles" DROP CONSTRAINT "roommate_profiles_userId_fkey";

-- DropTable
DROP TABLE "roommate_profiles";

-- CreateTable
CREATE TABLE "RoommateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "occupation" TEXT,
    "bio" TEXT,
    "preferredCities" TEXT[],
    "budgetMin" DOUBLE PRECISION NOT NULL,
    "budgetMax" DOUBLE PRECISION NOT NULL,
    "smokingPreference" "SmokingPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "petPreference" "PetPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "cleanlinessLevel" "CleanlinessLevel" NOT NULL DEFAULT 'NO_PREFERENCE',
    "socialLevel" "SocialLevel" NOT NULL DEFAULT 'NO_PREFERENCE',
    "interests" TEXT[],
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "isSmoke" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoommateProfile_userId_key" ON "RoommateProfile"("userId");

-- CreateIndex
CREATE INDEX "RoommateProfile_userId_idx" ON "RoommateProfile"("userId");

-- CreateIndex
CREATE INDEX "RoommateProfile_age_idx" ON "RoommateProfile"("age");

-- CreateIndex
CREATE INDEX "RoommateProfile_gender_idx" ON "RoommateProfile"("gender");

-- CreateIndex
CREATE INDEX "RoommateProfile_budgetMin_budgetMax_idx" ON "RoommateProfile"("budgetMin", "budgetMax");

-- CreateIndex
CREATE INDEX "RoommateProfile_createdAt_idx" ON "RoommateProfile"("createdAt");

-- AddForeignKey
ALTER TABLE "RoommateProfile" ADD CONSTRAINT "RoommateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
