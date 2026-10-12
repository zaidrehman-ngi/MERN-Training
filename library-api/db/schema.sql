CREATE TABLE branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
);

CREATE TABLE members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    joined_on DATE,
    branch_id UUID NOT NULL REFERENCES branches(branch_id)
);

CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    isbn TEXT UNIQUE
);

CREATE TABLE authors (
    author_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE genres (
    genre_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE book_copies (
    copy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(book_id),
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    copy_number INTEGER NOT NULL CHECK (copy_number > 0),
    acquisition_year INTEGER,
    acquisition_method TEXT
        CHECK (acquisition_method IN ('purchase', 'donation', 'transfer')),
    condition_notes TEXT,
    inventory_status TEXT NOT NULL DEFAULT 'in_collection'
        CHECK (inventory_status IN ('in_collection', 'missing', 'withdrawn')),
    UNIQUE (book_id, branch_id, copy_number)
);

CREATE TABLE borrow_requests (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    copy_id UUID NOT NULL REFERENCES book_copies(copy_id),
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

CREATE TABLE fine_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES borrow_requests(loan_id),
    amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),
    paid_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE book_genres (
    book_id UUID NOT NULL REFERENCES books(book_id),
    genre_id UUID NOT NULL REFERENCES genres(genre_id),
    PRIMARY KEY (book_id, genre_id)
);

CREATE TABLE book_authors (
    book_id UUID NOT NULL REFERENCES books(book_id),
    author_id UUID NOT NULL REFERENCES authors(author_id),
    PRIMARY KEY (book_id, author_id)
);
