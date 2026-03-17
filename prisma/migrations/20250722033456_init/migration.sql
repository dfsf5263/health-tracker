-- CreateEnum
CREATE TYPE "Flow" AS ENUM ('Spotting', 'Light', 'Medium', 'Heavy', 'SuperHeavy');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('Red', 'Brown');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('Yes', 'No', 'Upcoming');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT,
    "last_name" TEXT,
    "password_hash" TEXT,
    "two_factor_enabled" BOOLEAN,
    "birth_control_email_notifications" BOOLEAN NOT NULL DEFAULT false,
    "days_without_birth_control_ring" INTEGER,
    "days_with_birth_control_ring" INTEGER,
    "ring_insertion_reminder_time" TIME,
    "ring_removal_reminder_time" TIME,
    "average_cycle_length" DOUBLE PRECISION,
    "average_period_length" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "birth_control_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vaginal_ring_insertion" BOOLEAN NOT NULL DEFAULT false,
    "vaginal_ring_removal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "birth_control_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birth_control_day" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "birth_control_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irregular_physical_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "irregular_physical_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irregular_physical_day" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "irregular_physical_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normal_physical_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "normal_physical_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normal_physical_day" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "normal_physical_day_pkey" PRIMARY KEY ("id")
);

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
    "notes" TEXT,
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
    "dosage_modifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "twoFactor_user_id_key" ON "twoFactor"("user_id");

-- CreateIndex
CREATE INDEX "cycle_user_id_idx" ON "cycle"("user_id");

-- CreateIndex
CREATE INDEX "period_day_user_id_idx" ON "period_day"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "period_day_user_id_date_key" ON "period_day"("user_id", "date");

-- CreateIndex
CREATE INDEX "birth_control_type_user_id_idx" ON "birth_control_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "birth_control_type_user_id_name_key" ON "birth_control_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "birth_control_day_user_id_idx" ON "birth_control_day"("user_id");

-- CreateIndex
CREATE INDEX "birth_control_day_type_id_idx" ON "birth_control_day"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "birth_control_day_user_id_date_type_id_key" ON "birth_control_day"("user_id", "date", "type_id");

-- CreateIndex
CREATE INDEX "irregular_physical_type_user_id_idx" ON "irregular_physical_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "irregular_physical_type_user_id_name_key" ON "irregular_physical_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "irregular_physical_day_user_id_idx" ON "irregular_physical_day"("user_id");

-- CreateIndex
CREATE INDEX "irregular_physical_day_type_id_idx" ON "irregular_physical_day"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "irregular_physical_day_user_id_date_type_id_key" ON "irregular_physical_day"("user_id", "date", "type_id");

-- CreateIndex
CREATE INDEX "normal_physical_type_user_id_idx" ON "normal_physical_type"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "normal_physical_type_user_id_name_key" ON "normal_physical_type"("user_id", "name");

-- CreateIndex
CREATE INDEX "normal_physical_day_user_id_idx" ON "normal_physical_day"("user_id");

-- CreateIndex
CREATE INDEX "normal_physical_day_type_id_idx" ON "normal_physical_day"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "normal_physical_day_user_id_date_type_id_key" ON "normal_physical_day"("user_id", "date", "type_id");

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
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle" ADD CONSTRAINT "cycle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_day" ADD CONSTRAINT "period_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_control_type" ADD CONSTRAINT "birth_control_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_control_day" ADD CONSTRAINT "birth_control_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_control_day" ADD CONSTRAINT "birth_control_day_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "birth_control_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irregular_physical_type" ADD CONSTRAINT "irregular_physical_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irregular_physical_day" ADD CONSTRAINT "irregular_physical_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irregular_physical_day" ADD CONSTRAINT "irregular_physical_day_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "irregular_physical_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normal_physical_type" ADD CONSTRAINT "normal_physical_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normal_physical_day" ADD CONSTRAINT "normal_physical_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normal_physical_day" ADD CONSTRAINT "normal_physical_day_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "normal_physical_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
