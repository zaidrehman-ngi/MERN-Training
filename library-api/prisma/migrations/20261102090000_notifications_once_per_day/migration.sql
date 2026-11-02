-- DropIndex
DROP INDEX "notifications_request_id_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "for_date" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notifications_request_id_kind_for_date_key" ON "notifications"("request_id", "kind", "for_date");

