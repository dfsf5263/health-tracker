-- AlterTable
ALTER TABLE "user" ADD COLUMN     "days_with_birth_control_ring" INTEGER,
ADD COLUMN     "days_without_birth_control_ring" INTEGER,
ADD COLUMN     "ring_insertion_reminder_time" TIME,
ADD COLUMN     "ring_removal_reminder_time" TIME;
