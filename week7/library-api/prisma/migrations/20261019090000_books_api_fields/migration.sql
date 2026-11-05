-- CreateSequence (added by hand: new books get ids bk-1000, bk-1001, ...
-- so they never clash with the bk-1 ... bk-9 ids from db.json)
CREATE SEQUENCE "books_api_id_seq" START WITH 1000;

-- DropIndex (on my original database this was a UNIQUE constraint, on a
-- fresh database it is an index, so handle both)
ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "books_isbn_key";
DROP INDEX IF EXISTS "books_isbn_key";

-- AlterTable
ALTER TABLE "books" ADD COLUMN     "api_id" TEXT NOT NULL DEFAULT ('bk-'::text || nextval('books_api_id_seq'::regclass)),
ADD COLUMN     "author" TEXT,
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "fine_per_day" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available',
ADD COLUMN     "total_copies" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "books_api_id_key" ON "books"("api_id");

-- CreateIndex (ISBN only has to be unique among books that aren't deleted)
CREATE UNIQUE INDEX "books_active_isbn_unique" ON "books"("isbn") WHERE (is_active = true);
