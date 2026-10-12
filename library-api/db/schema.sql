CREATE TABLE members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    joined_on DATE
);

CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    isbn TEXT UNIQUE
);

CREATE TABLE branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
);

CREATE TABLE book_copies (
    copy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(book_id),
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    copy_number INTEGER NOT NULL CHECK (copy_number > 0),
    UNIQUE (book_id, branch_id, copy_number)
);

CREATE TABLE borrow_requests (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(member_id),
    copy_id UUID NOT NULL REFERENCES book_copies(copy_id),
    borrowed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    due_on DATE NOT NULL,
    returned_on DATE,
    status TEXT NOT NULL DEFAULT 'out'
        CONSTRAINT borrow_requests_status_check
        CHECK (status IN ('out', 'overdue', 'returned'))
);
