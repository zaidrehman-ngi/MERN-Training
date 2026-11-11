-- Written by hand: Prisma would drop book_requests and rebuild it, losing its rows.

-- DropTables: left over from the SQL exercises, the API never used them
DROP TABLE "fine_payments";
DROP TABLE "borrow_requests";
DROP TABLE "book_copies";
DROP TABLE "book_authors";
DROP TABLE "book_genres";
DROP TABLE "authors";
DROP TABLE "genres";

-- RenameTable: book_requests takes the name the API uses
ALTER TABLE "book_requests" RENAME TO "borrow_requests";
ALTER SEQUENCE "book_requests_api_id_seq" RENAME TO "borrow_requests_api_id_seq";
ALTER TABLE "borrow_requests" ALTER COLUMN "api_id" SET DEFAULT ('br-'::text || nextval('borrow_requests_api_id_seq'::regclass));

-- RenameConstraints: primary key, foreign keys, checks (and named NOT NULLs on newer Postgres)
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'borrow_requests'::regclass AND conname LIKE 'book\_requests\_%'
  LOOP
    EXECUTE format('ALTER TABLE "borrow_requests" RENAME CONSTRAINT %I TO %I',
      c.conname, 'borrow_requests_' || substr(c.conname, 15));
  END LOOP;
END $$;

-- RenameIndexes
ALTER INDEX "book_requests_api_id_key" RENAME TO "borrow_requests_api_id_key";
ALTER INDEX "book_requests_member_id_idx" RENAME TO "borrow_requests_member_id_idx";
ALTER INDEX "book_requests_book_id_idx" RENAME TO "borrow_requests_book_id_idx";
ALTER INDEX "book_requests_queue_idx" RENAME TO "borrow_requests_queue_idx";
