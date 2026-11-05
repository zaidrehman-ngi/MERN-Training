-- CreateSequence (added by hand: new members get m-5000, m-5001, ... and new
-- requests br-1000, br-1001, ... so they never clash with ids from db.json)
CREATE SEQUENCE "members_api_id_seq" START WITH 5000;
CREATE SEQUENCE "book_requests_api_id_seq" START WITH 1000;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "api_id" TEXT NOT NULL DEFAULT ('m-'::text || nextval('members_api_id_seq'::regclass)),
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "book_requests" (
    "request_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "api_id" TEXT NOT NULL DEFAULT ('br-'::text || nextval('book_requests_api_id_seq'::regclass)),
    "member_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_on" DATE NOT NULL DEFAULT CURRENT_DATE,
    "due_on" DATE,
    "fine_per_day" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "book_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_requests_api_id_key" ON "book_requests"("api_id");

-- CreateIndex
CREATE INDEX "book_requests_member_id_idx" ON "book_requests"("member_id");

-- CreateIndex
CREATE INDEX "book_requests_book_id_idx" ON "book_requests"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_api_id_key" ON "members"("api_id");

-- AddForeignKey
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- AddCheckConstraints (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "members" ADD CONSTRAINT "members_role_check" CHECK (role IN ('user', 'librarian', 'admin'));
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_status_check" CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_fine_per_day_check" CHECK (fine_per_day >= 0);
