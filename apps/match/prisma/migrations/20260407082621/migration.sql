-- CreateTable
CREATE TABLE "import_log" (
    "id" TEXT NOT NULL,
    "imported_by" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_log_file_id_idx" ON "import_log"("file_id");

-- CreateIndex
CREATE INDEX "import_log_imported_by_idx" ON "import_log"("imported_by");

-- CreateIndex
CREATE INDEX "import_log_type_idx" ON "import_log"("type");
