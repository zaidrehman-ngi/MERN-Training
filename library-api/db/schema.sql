CREATE TABLE branches (
    -- Primary-key index serves branch lookup by branch_id.
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
);

CREATE TABLE members (
    -- Primary-key index serves member lookup by member_id.
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    joined_on DATE,
    branch_id UUID NOT NULL REFERENCES branches(branch_id)
        ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Serves active-member lookup by email and enforces unique active emails.
CREATE UNIQUE INDEX members_active_email_unique
    ON members (email)
    WHERE is_active = TRUE;

CREATE TABLE books (
    -- Primary-key index serves book lookup by book_id.
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    -- Unique index serves ISBN lookup and prevents duplicate ISBNs.
    isbn TEXT UNIQUE
);

CREATE TABLE authors (
    -- Primary-key index serves author lookup by author_id.
    author_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE genres (
    -- Primary-key index serves genre lookup by genre_id.
    genre_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE book_copies (
    -- Primary-key index serves physical-copy lookup by copy_id.
    copy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(book_id)
        ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    copy_number INTEGER NOT NULL CHECK (copy_number > 0),
    acquisition_year INTEGER,
    acquisition_method TEXT
        CHECK (acquisition_method IN ('purchase', 'donation', 'transfer')),
    condition_notes TEXT,
    inventory_status TEXT NOT NULL DEFAULT 'in_collection'
        CHECK (inventory_status IN ('in_collection', 'missing', 'withdrawn')),
    -- Composite unique index serves lookup of a book's numbered copy at a branch.
    UNIQUE (book_id, branch_id, copy_number)
);

CREATE TABLE borrow_requests (
    -- Primary-key index serves loan lookup by loan_id.
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id)
        ON DELETE RESTRICT,
    copy_id UUID NOT NULL REFERENCES book_copies(copy_id)
        ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    borrowed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    due_on DATE NOT NULL,
    returned_on DATE,
    fine_rate_per_day NUMERIC(6,2) NOT NULL DEFAULT 20.00
        CHECK (fine_rate_per_day >= 0),
    fine_assessed NUMERIC(8,2) NOT NULL DEFAULT 0
        CHECK (fine_assessed >= 0),
    status TEXT NOT NULL DEFAULT 'out'
        CONSTRAINT borrow_requests_status_check
        CHECK (status IN ('out', 'overdue', 'returned'))
);

-- Serves overdue report: unreturned loans past due, ordered by due_on.
CREATE INDEX borrow_requests_overdue_due_on_idx
    ON borrow_requests (due_on)
    WHERE returned_on IS NULL;

-- Composite index serves status-filtered loan lists ordered by due_on.
CREATE INDEX borrow_requests_status_due_on_idx
    ON borrow_requests (status, due_on);

-- Serves a member's loan history and member-side foreign-key checks.
CREATE INDEX borrow_requests_member_id_idx
    ON borrow_requests (member_id);

-- Serves loan lookup/history for a physical copy and copy-side foreign-key checks.
CREATE INDEX borrow_requests_copy_id_idx
    ON borrow_requests (copy_id);

-- Serves branch loan lists and branch-side foreign-key checks.
CREATE INDEX borrow_requests_branch_id_idx
    ON borrow_requests (branch_id);

CREATE TABLE fine_payments (
    -- Primary-key index serves payment lookup by payment_id.
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES borrow_requests(loan_id),
    amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),
    paid_on DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Serves payment history lookup by loan_id and loan-side foreign-key checks.
CREATE INDEX fine_payments_loan_id_idx
    ON fine_payments (loan_id);

CREATE TABLE book_genres (
    book_id UUID NOT NULL REFERENCES books(book_id)
        ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(genre_id),
    -- Composite primary-key index serves genre list lookup for a book.
    PRIMARY KEY (book_id, genre_id)
);

CREATE TABLE book_authors (
    book_id UUID NOT NULL REFERENCES books(book_id),
    author_id UUID NOT NULL REFERENCES authors(author_id),
    -- Composite primary-key index serves author list lookup for a book.
    PRIMARY KEY (book_id, author_id)
);
