-- DropColumns: the UUID primary key is now the id the API shows
ALTER TABLE "books" DROP COLUMN "api_id";
ALTER TABLE "members" DROP COLUMN "api_id";
ALTER TABLE "borrow_requests" DROP COLUMN "api_id";

-- DropSequences (added by hand: Prisma doesn't track sequences)
DROP SEQUENCE "books_api_id_seq";
DROP SEQUENCE "members_api_id_seq";
DROP SEQUENCE "borrow_requests_api_id_seq";
