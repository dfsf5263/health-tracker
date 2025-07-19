/*
  Warnings:

  - You are about to drop the column `cycle_length` on the `cycle` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `cycle` table. All the data in the column will be lost.
  - You are about to drop the column `period_length` on the `cycle` table. All the data in the column will be lost.
  - You are about to drop the column `symptoms` on the `cycle` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Flow" AS ENUM ('Spotting', 'Medium', 'Heavy', 'SuperHeavy');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('Red', 'Brown');

-- AlterTable
ALTER TABLE "cycle" DROP COLUMN "cycle_length",
DROP COLUMN "notes",
DROP COLUMN "period_length",
DROP COLUMN "symptoms",
ALTER COLUMN "start_date" SET DATA TYPE DATE,
ALTER COLUMN "end_date" SET DATA TYPE DATE;

-- CreateTable
CREATE TABLE "period_day" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "flow" "Flow" NOT NULL,
    "color" "Color" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_day_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "period_day_user_id_idx" ON "period_day"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "period_day_user_id_date_key" ON "period_day"("user_id", "date");

-- AddForeignKey
ALTER TABLE "period_day" ADD CONSTRAINT "period_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
