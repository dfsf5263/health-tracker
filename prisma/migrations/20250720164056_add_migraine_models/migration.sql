-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('Yes', 'No', 'Upcoming');

-- CreateTable
CREATE TABLE "migraine_attack_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_attack_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_symptom_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_symptom_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_trigger_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_trigger_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_precognition_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_precognition_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_medication_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_medication_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_relief_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_relief_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_activity_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_activity_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_location_type" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_location_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3),
    "pain_level" INTEGER NOT NULL,
    "geographic_location" TEXT,
    "period_status" "PeriodStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_attack_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_attack_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_attack_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_symptom_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_symptom_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_symptom_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_trigger_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_trigger_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_trigger_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_precognition_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_precognition_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_precognition_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_medication_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_medication_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_medication_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_relief_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_relief_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_relief_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_activity_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_activity_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_activity_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migraine_migraine_location_type" (
    "id" UUID NOT NULL,
    "migraine_id" UUID NOT NULL,
    "migraine_location_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migraine_migraine_location_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "migraine_attack_type_user_id_idx" ON "migraine_attack_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_attack_type_user_id_name_key" ON "migraine_attack_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_symptom_type_user_id_idx" ON "migraine_symptom_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_symptom_type_user_id_name_key" ON "migraine_symptom_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_trigger_type_user_id_idx" ON "migraine_trigger_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_trigger_type_user_id_name_key" ON "migraine_trigger_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_precognition_type_user_id_idx" ON "migraine_precognition_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_precognition_type_user_id_name_key" ON "migraine_precognition_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_medication_type_user_id_idx" ON "migraine_medication_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_medication_type_user_id_name_key" ON "migraine_medication_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_relief_type_user_id_idx" ON "migraine_relief_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_relief_type_user_id_name_key" ON "migraine_relief_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "migraine_activity_type_user_id_idx" ON "migraine_activity_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_activity_type_user_id_name_key" ON "migraine_activity_type"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_location_type_name_key" ON "migraine_location_type"("name");

-- CreateIndex
CREATE INDEX "migraine_user_id_idx" ON "migraine"("user_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_attack_type_migraine_id_idx" ON "migraine_migraine_attack_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_attack_type_migraine_attack_type_id_idx" ON "migraine_migraine_attack_type"("migraine_attack_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_attack_type_migraine_id_migraine_attack_t_key" ON "migraine_migraine_attack_type"("migraine_id", "migraine_attack_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_symptom_type_migraine_id_idx" ON "migraine_migraine_symptom_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_symptom_type_migraine_symptom_type_id_idx" ON "migraine_migraine_symptom_type"("migraine_symptom_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_symptom_type_migraine_id_migraine_symptom_key" ON "migraine_migraine_symptom_type"("migraine_id", "migraine_symptom_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_trigger_type_migraine_id_idx" ON "migraine_migraine_trigger_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_trigger_type_migraine_trigger_type_id_idx" ON "migraine_migraine_trigger_type"("migraine_trigger_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_trigger_type_migraine_id_migraine_trigger_key" ON "migraine_migraine_trigger_type"("migraine_id", "migraine_trigger_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_precognition_type_migraine_id_idx" ON "migraine_migraine_precognition_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_precognition_type_migraine_precognition_t_idx" ON "migraine_migraine_precognition_type"("migraine_precognition_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_precognition_type_migraine_id_migraine_pr_key" ON "migraine_migraine_precognition_type"("migraine_id", "migraine_precognition_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_medication_type_migraine_id_idx" ON "migraine_migraine_medication_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_medication_type_migraine_medication_type__idx" ON "migraine_migraine_medication_type"("migraine_medication_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_medication_type_migraine_id_migraine_medi_key" ON "migraine_migraine_medication_type"("migraine_id", "migraine_medication_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_relief_type_migraine_id_idx" ON "migraine_migraine_relief_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_relief_type_migraine_relief_type_id_idx" ON "migraine_migraine_relief_type"("migraine_relief_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_relief_type_migraine_id_migraine_relief_t_key" ON "migraine_migraine_relief_type"("migraine_id", "migraine_relief_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_activity_type_migraine_id_idx" ON "migraine_migraine_activity_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_activity_type_migraine_activity_type_id_idx" ON "migraine_migraine_activity_type"("migraine_activity_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_activity_type_migraine_id_migraine_activi_key" ON "migraine_migraine_activity_type"("migraine_id", "migraine_activity_type_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_location_type_migraine_id_idx" ON "migraine_migraine_location_type"("migraine_id");

-- CreateIndex
CREATE INDEX "migraine_migraine_location_type_migraine_location_type_id_idx" ON "migraine_migraine_location_type"("migraine_location_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "migraine_migraine_location_type_migraine_id_migraine_locati_key" ON "migraine_migraine_location_type"("migraine_id", "migraine_location_type_id");

-- AddForeignKey
ALTER TABLE "migraine_attack_type" ADD CONSTRAINT "migraine_attack_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_symptom_type" ADD CONSTRAINT "migraine_symptom_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_trigger_type" ADD CONSTRAINT "migraine_trigger_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_precognition_type" ADD CONSTRAINT "migraine_precognition_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_medication_type" ADD CONSTRAINT "migraine_medication_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_relief_type" ADD CONSTRAINT "migraine_relief_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_activity_type" ADD CONSTRAINT "migraine_activity_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine" ADD CONSTRAINT "migraine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_attack_type" ADD CONSTRAINT "migraine_migraine_attack_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_attack_type" ADD CONSTRAINT "migraine_migraine_attack_type_migraine_attack_type_id_fkey" FOREIGN KEY ("migraine_attack_type_id") REFERENCES "migraine_attack_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_symptom_type" ADD CONSTRAINT "migraine_migraine_symptom_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_symptom_type" ADD CONSTRAINT "migraine_migraine_symptom_type_migraine_symptom_type_id_fkey" FOREIGN KEY ("migraine_symptom_type_id") REFERENCES "migraine_symptom_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_trigger_type" ADD CONSTRAINT "migraine_migraine_trigger_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_trigger_type" ADD CONSTRAINT "migraine_migraine_trigger_type_migraine_trigger_type_id_fkey" FOREIGN KEY ("migraine_trigger_type_id") REFERENCES "migraine_trigger_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_precognition_type" ADD CONSTRAINT "migraine_migraine_precognition_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_precognition_type" ADD CONSTRAINT "migraine_migraine_precognition_type_migraine_precognition__fkey" FOREIGN KEY ("migraine_precognition_type_id") REFERENCES "migraine_precognition_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_medication_type" ADD CONSTRAINT "migraine_migraine_medication_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_medication_type" ADD CONSTRAINT "migraine_migraine_medication_type_migraine_medication_type_fkey" FOREIGN KEY ("migraine_medication_type_id") REFERENCES "migraine_medication_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_relief_type" ADD CONSTRAINT "migraine_migraine_relief_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_relief_type" ADD CONSTRAINT "migraine_migraine_relief_type_migraine_relief_type_id_fkey" FOREIGN KEY ("migraine_relief_type_id") REFERENCES "migraine_relief_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_activity_type" ADD CONSTRAINT "migraine_migraine_activity_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_activity_type" ADD CONSTRAINT "migraine_migraine_activity_type_migraine_activity_type_id_fkey" FOREIGN KEY ("migraine_activity_type_id") REFERENCES "migraine_activity_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_location_type" ADD CONSTRAINT "migraine_migraine_location_type_migraine_id_fkey" FOREIGN KEY ("migraine_id") REFERENCES "migraine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migraine_migraine_location_type" ADD CONSTRAINT "migraine_migraine_location_type_migraine_location_type_id_fkey" FOREIGN KEY ("migraine_location_type_id") REFERENCES "migraine_location_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
