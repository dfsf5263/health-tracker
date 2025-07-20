-- CreateTable
CREATE TABLE "birth_control_type" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
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

-- AddForeignKey
ALTER TABLE "birth_control_type" ADD CONSTRAINT "birth_control_type_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_control_day" ADD CONSTRAINT "birth_control_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_control_day" ADD CONSTRAINT "birth_control_day_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "birth_control_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
