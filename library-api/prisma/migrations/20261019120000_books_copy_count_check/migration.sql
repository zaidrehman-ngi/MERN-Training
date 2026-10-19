-- AddCheckConstraints (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "books" ADD CONSTRAINT "books_available_copies_check" CHECK (available_copies >= 0);
ALTER TABLE "books" ADD CONSTRAINT "books_total_copies_check" CHECK (total_copies >= 0);
