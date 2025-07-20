-- AlterTable
ALTER TABLE "birth_control_type" ADD COLUMN     "vaginal_ring_insertion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaginal_ring_removal" BOOLEAN NOT NULL DEFAULT false;
