/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refreshToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SmokingPreference" AS ENUM ('SMOKER', 'NON_SMOKER', 'OCCASIONAL', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "PetPreference" AS ENUM ('LOVES_PETS', 'NO_PETS', 'SMALL_PETS_ONLY', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "CleanlinessLevel" AS ENUM ('VERY_CLEAN', 'MODERATELY_CLEAN', 'RELAXED', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "SocialLevel" AS ENUM ('VERY_SOCIAL', 'MODERATELY_SOCIAL', 'PREFER_QUIET', 'NO_PREFERENCE');

-- DropIndex
DROP INDEX "users_supabaseId_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "supabaseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "roommate_profiles" (
    "id" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "occupation" TEXT NOT NULL,
    "interests" TEXT[],
    "budgetMin" INTEGER NOT NULL,
    "budgetMax" INTEGER NOT NULL,
    "preferredCities" TEXT[],
    "smokingPreference" "SmokingPreference" NOT NULL,
    "petPreference" "PetPreference" NOT NULL,
    "cleanlinessLevel" "CleanlinessLevel" NOT NULL,
    "socialLevel" "SocialLevel" NOT NULL,
    "hasPets" BOOLEAN,
    "isSmoke" BOOLEAN,
    "preferredMoveInDate" TIMESTAMP(3),
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "roommate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roommate_profiles_userId_key" ON "roommate_profiles"("userId");

-- CreateIndex
CREATE INDEX "roommate_profiles_age_idx" ON "roommate_profiles"("age");

-- CreateIndex
CREATE INDEX "roommate_profiles_budgetMin_budgetMax_idx" ON "roommate_profiles"("budgetMin", "budgetMax");

-- CreateIndex
CREATE INDEX "roommate_profiles_gender_idx" ON "roommate_profiles"("gender");

-- CreateIndex
CREATE INDEX "roommate_profiles_smokingPreference_idx" ON "roommate_profiles"("smokingPreference");

-- CreateIndex
CREATE INDEX "roommate_profiles_petPreference_idx" ON "roommate_profiles"("petPreference");

-- CreateIndex
CREATE INDEX "roommate_profiles_cleanlinessLevel_idx" ON "roommate_profiles"("cleanlinessLevel");

-- CreateIndex
CREATE INDEX "roommate_profiles_socialLevel_idx" ON "roommate_profiles"("socialLevel");

-- CreateIndex
CREATE INDEX "roommate_profiles_createdAt_idx" ON "roommate_profiles"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_refreshToken_key" ON "users"("refreshToken");

-- CreateIndex
CREATE INDEX "users_emailVerificationToken_idx" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_refreshToken_idx" ON "users"("refreshToken");

-- AddForeignKey
ALTER TABLE "roommate_profiles" ADD CONSTRAINT "roommate_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
