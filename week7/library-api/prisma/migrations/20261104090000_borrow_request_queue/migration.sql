-- AlterTable
ALTER TABLE "book_requests" ADD COLUMN "queued_at" TIMESTAMPTZ(6),
ADD COLUMN "hold_until" DATE;

-- AlterCheckConstraint (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "book_requests" DROP CONSTRAINT "book_requests_status_check";
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_status_check" CHECK (status IN ('pending', 'queued', 'held', 'approved', 'rejected', 'cancelled', 'expired', 'returned'));

-- CreateIndex
CREATE INDEX "book_requests_queue_idx" ON "book_requests"("book_id", "queued_at") WHERE status = 'queued';
