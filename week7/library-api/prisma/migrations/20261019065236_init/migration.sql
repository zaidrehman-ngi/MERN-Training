-- CreateTable
CREATE TABLE "authors" (
    "author_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("author_id")
);

-- CreateTable
CREATE TABLE "book_authors" (
    "book_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "book_authors_pkey" PRIMARY KEY ("book_id","author_id")
);

-- CreateTable
CREATE TABLE "book_copies" (
    "copy_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "copy_number" INTEGER NOT NULL,
    "acquisition_year" INTEGER,
    "acquisition_method" TEXT,
    "condition_notes" TEXT,
    "inventory_status" TEXT NOT NULL DEFAULT 'in_collection',

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("copy_id")
);

-- CreateTable
CREATE TABLE "book_genres" (
    "book_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "book_genres_pkey" PRIMARY KEY ("book_id","genre_id")
);

-- CreateTable
CREATE TABLE "books" (
    "book_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "isbn" TEXT,
    "available_copies" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "books_pkey" PRIMARY KEY ("book_id")
);

-- CreateTable
CREATE TABLE "borrow_requests" (
    "loan_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "borrowed_on" DATE NOT NULL DEFAULT CURRENT_DATE,
    "due_on" DATE NOT NULL,
    "returned_on" DATE,
    "status" TEXT NOT NULL DEFAULT 'out',
    "branch_id" UUID NOT NULL,
    "fine_rate_per_day" DECIMAL(6,2) NOT NULL DEFAULT 20.00,
    "fine_assessed" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "borrow_requests_pkey" PRIMARY KEY ("loan_id")
);

-- CreateTable
CREATE TABLE "branches" (
    "branch_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "fine_payments" (
    "payment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_id" UUID NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "paid_on" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "fine_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "members" (
    "member_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "joined_on" DATE,
    "branch_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "members_pkey" PRIMARY KEY ("member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_book_id_branch_id_copy_number_key" ON "book_copies"("book_id", "branch_id", "copy_number");

-- CreateIndex
CREATE INDEX "book_genres_genre_id_idx" ON "book_genres"("genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "borrow_requests_branch_id_idx" ON "borrow_requests"("branch_id");

-- CreateIndex
CREATE INDEX "borrow_requests_copy_id_idx" ON "borrow_requests"("copy_id");

-- CreateIndex
CREATE INDEX "borrow_requests_member_id_idx" ON "borrow_requests"("member_id");

-- CreateIndex
CREATE INDEX "borrow_requests_overdue_due_on_idx" ON "borrow_requests"("due_on") WHERE (returned_on IS NULL);

-- CreateIndex
CREATE INDEX "borrow_requests_status_due_on_idx" ON "borrow_requests"("status", "due_on");

-- CreateIndex
CREATE INDEX "fine_payments_loan_id_idx" ON "fine_payments"("loan_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_active_email_unique" ON "members"("email") WHERE (is_active = true);

-- AddForeignKey
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("author_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("genre_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copies"("copy_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fine_payments" ADD CONSTRAINT "fine_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "borrow_requests"("loan_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddCheckConstraints (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_acquisition_method_check" CHECK (acquisition_method IN ('purchase', 'donation', 'transfer'));
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_copy_number_check" CHECK (copy_number > 0);
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_inventory_status_check" CHECK (inventory_status IN ('in_collection', 'missing', 'withdrawn'));
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_fine_assessed_check" CHECK (fine_assessed >= 0);
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_fine_rate_per_day_check" CHECK (fine_rate_per_day >= 0);
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_status_check" CHECK (status IN ('out', 'overdue', 'returned'));
ALTER TABLE "fine_payments" ADD CONSTRAINT "fine_payments_amount_check" CHECK (amount > 0);
