BEGIN;

INSERT INTO branches (branch_id, name, address, phone) VALUES
    ('a1000000-0000-4000-8000-000000000001', 'Clifton Branch',
     '12 Zamzama Blvd, Clifton, Karachi', '021-3583-1100'),
    ('a1000000-0000-4000-8000-000000000002', 'Saddar Branch',
     '44 Preedy St, Saddar, Karachi', '021-3277-4400');

INSERT INTO members (member_id, name, email, phone, joined_on, branch_id) VALUES
    ('b1000000-0000-4000-8000-000000000001', 'Aisha Khan',
     'aisha.seed@example.com', '0300-1234567', DATE '2024-04-02',
     'a1000000-0000-4000-8000-000000000001'),
    ('b1000000-0000-4000-8000-000000000002', 'Omar Sethi',
     'omar.seed@example.com', '0321-9876543', DATE '2025-01-15',
     'a1000000-0000-4000-8000-000000000002');

INSERT INTO books (book_id, title, isbn) VALUES
    ('c1000000-0000-4000-8000-000000000001', 'Dune', '9780441013593'),
    ('c1000000-0000-4000-8000-000000000002',
     'Stories from Karachi', NULL),
    ('c1000000-0000-4000-8000-000000000003',
     'Untitled donation, box 14', NULL);

INSERT INTO authors (author_id, name) VALUES
    ('d1000000-0000-4000-8000-000000000001', 'Frank Herbert'),
    ('d1000000-0000-4000-8000-000000000002', 'Amina Shah'),
    ('d1000000-0000-4000-8000-000000000003', 'Bilal Ahmed');

INSERT INTO genres (genre_id, name) VALUES
    ('e1000000-0000-4000-8000-000000000001', 'Science Fiction'),
    ('e1000000-0000-4000-8000-000000000002', 'Local History');

INSERT INTO book_authors (book_id, author_id) VALUES
    ('c1000000-0000-4000-8000-000000000001',
     'd1000000-0000-4000-8000-000000000001'),
    ('c1000000-0000-4000-8000-000000000002',
     'd1000000-0000-4000-8000-000000000002'),
    ('c1000000-0000-4000-8000-000000000002',
     'd1000000-0000-4000-8000-000000000003');

INSERT INTO book_genres (book_id, genre_id) VALUES
    ('c1000000-0000-4000-8000-000000000001',
     'e1000000-0000-4000-8000-000000000001'),
    ('c1000000-0000-4000-8000-000000000002',
     'e1000000-0000-4000-8000-000000000002');

INSERT INTO book_copies (
    copy_id, book_id, branch_id, copy_number, acquisition_year,
    acquisition_method, condition_notes, inventory_status
) VALUES
    ('f1000000-0000-4000-8000-000000000001',
     'c1000000-0000-4000-8000-000000000001',
     'a1000000-0000-4000-8000-000000000001',
     1, 2020, 'purchase', 'Good condition', 'in_collection'),
    ('f1000000-0000-4000-8000-000000000002',
     'c1000000-0000-4000-8000-000000000001',
     'a1000000-0000-4000-8000-000000000001',
     2, 1998, 'donation', 'Falling apart; handle carefully', 'in_collection'),
    ('f1000000-0000-4000-8000-000000000003',
     'c1000000-0000-4000-8000-000000000001',
     'a1000000-0000-4000-8000-000000000001',
     3, 2022, 'purchase', 'Good condition', 'in_collection'),
    ('f1000000-0000-4000-8000-000000000004',
     'c1000000-0000-4000-8000-000000000001',
     'a1000000-0000-4000-8000-000000000002',
     4, 2021, 'purchase', 'Good condition', 'in_collection'),
    ('f1000000-0000-4000-8000-000000000005',
     'c1000000-0000-4000-8000-000000000001',
     'a1000000-0000-4000-8000-000000000002',
     5, 2020, 'purchase', 'Not located during stock-take', 'missing'),
    ('f1000000-0000-4000-8000-000000000006',
     'c1000000-0000-4000-8000-000000000002',
     'a1000000-0000-4000-8000-000000000001',
     1, 2025, 'purchase', 'Good condition', 'in_collection');

INSERT INTO borrow_requests (
    loan_id, member_id, copy_id, branch_id, borrowed_on, due_on,
    returned_on, fine_rate_per_day, fine_assessed, status
) VALUES (
    '11000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000006',
    'a1000000-0000-4000-8000-000000000001',
    DATE '2026-08-01', DATE '2026-08-15', NULL, 20.00, 100.00, 'overdue'
);

INSERT INTO fine_payments (payment_id, loan_id, amount, paid_on) VALUES (
    '12000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    25.00,
    DATE '2026-08-20'
);

COMMIT;
