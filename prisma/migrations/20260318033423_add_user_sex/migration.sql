-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('Unknown', 'Male', 'Female', 'NotApplicable');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "sex" "Sex" NOT NULL DEFAULT 'Unknown';
