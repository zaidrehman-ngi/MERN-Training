-- AddColumns: when the book came back and the fine charged for it
ALTER TABLE "book_requests" ADD COLUMN "returned_at" TIMESTAMPTZ(6);
ALTER TABLE "book_requests" ADD COLUMN "fine" INTEGER;

-- AddCheckConstraint (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_fine_check" CHECK (fine IS NULL OR fine >= 0);
