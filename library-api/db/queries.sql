-- Every book.
SELECT book_id, title, isbn
FROM books;

-- The first twenty books, ordered by title.
SELECT book_id, title, isbn
FROM books
ORDER BY title
LIMIT 20;

-- Only science fiction books.
SELECT b.book_id, b.title, b.isbn
FROM books AS b
JOIN book_genres AS bg ON bg.book_id = b.book_id
JOIN genres AS g ON g.genre_id = bg.genre_id
WHERE g.name = 'Science Fiction';

-- Books with fewer than three physical copies, including books with no copies.
SELECT b.book_id, b.title, COUNT(bc.copy_id) AS copy_count
FROM books AS b
LEFT JOIN book_copies AS bc ON bc.book_id = b.book_id
GROUP BY b.book_id, b.title
HAVING COUNT(bc.copy_id) < 3;

-- Books whose title contains "Karachi".
SELECT book_id, title, isbn
FROM books
WHERE title ILIKE '%Karachi%';

-- Available books at Clifton with copies acquired after 1980 (the schema has
-- acquisition_year, not publication year, so this is an explicit proxy).
SELECT DISTINCT b.book_id, b.title
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
JOIN branches AS br ON br.branch_id = bc.branch_id
WHERE br.name = 'Clifton Branch'
  AND bc.inventory_status = 'in_collection'
  AND bc.acquisition_year > 1980
ORDER BY b.title;

-- Books that have an overdue loan or at least one missing physical copy.
SELECT b.book_id, b.title
FROM books AS b
WHERE EXISTS (
    SELECT 1
    FROM book_copies AS bc
    JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id
    WHERE bc.book_id = b.book_id
      AND loan.status = 'overdue'
)
OR EXISTS (
    SELECT 1
    FROM book_copies AS bc
    WHERE bc.book_id = b.book_id
      AND bc.inventory_status = 'missing'
)
ORDER BY b.title;

-- Deliberately incorrect: comparing a value with NULL using = returns UNKNOWN.
SELECT b.book_id, b.title
FROM books AS b
LEFT JOIN book_authors AS ba ON ba.book_id = b.book_id
WHERE ba.author_id = NULL;

-- Books with no recorded author: test the NULL-extended left-join row with IS NULL.
SELECT b.book_id, b.title
FROM books AS b
LEFT JOIN book_authors AS ba ON ba.book_id = b.book_id
WHERE ba.author_id IS NULL
ORDER BY b.title;

-- Task 3, Node approach: fetch all loans; filter for unreturned overdue
-- loans and sort by due_on in Node before taking the first ten.
SELECT loan_id, member_id, due_on, returned_on
FROM borrow_requests;

-- Task 3, SQL approach: filter, sort most overdue first, and limit in SQL.
SELECT loan_id, member_id, due_on, returned_on
FROM borrow_requests
WHERE returned_on IS NULL
  AND due_on < CURRENT_DATE
ORDER BY due_on ASC, loan_id
LIMIT 10;

-- Task 4: Begin a transaction for the disposable book/copy CRUD demonstration.
BEGIN;

-- Insert a temporary book and its first copy at Clifton; ISBN identifies this test row.
WITH new_book AS (
    INSERT INTO books (title, isbn)
    VALUES ('Exercise 1 Task 4 Temporary Book', 'EX1-T4-TEMP-20261014')
    RETURNING book_id
)
INSERT INTO book_copies (book_id, branch_id, copy_number, acquisition_method)
SELECT new_book.book_id, branches.branch_id, 1, 'purchase'
FROM new_book
CROSS JOIN branches
WHERE branches.name = 'Clifton Branch'
RETURNING book_id, copy_id;

-- Change the test book's copy count from one to two by adding an individual copy row.
INSERT INTO book_copies (book_id, branch_id, copy_number, acquisition_method)
SELECT books.book_id, branches.branch_id, 2, 'purchase'
FROM books
CROSS JOIN branches
WHERE books.isbn = 'EX1-T4-TEMP-20261014'
  AND branches.name = 'Clifton Branch'
RETURNING copy_id, book_id;

-- Update a field on the second test copy, scoped to the temporary book.
UPDATE book_copies
SET condition_notes = 'Updated during Exercise 1 Task 4'
WHERE book_id = (
    SELECT book_id
    FROM books
    WHERE isbn = 'EX1-T4-TEMP-20261014'
)
  AND copy_number = 2
RETURNING copy_id, condition_notes;

-- Verify the test book now has two physical-copy rows.
SELECT books.title, COUNT(book_copies.copy_id) AS copy_count
FROM books
LEFT JOIN book_copies ON book_copies.book_id = books.book_id
WHERE books.isbn = 'EX1-T4-TEMP-20261014'
GROUP BY books.book_id, books.title;

-- Delete the test copies first because book_copies references books.
DELETE FROM book_copies
WHERE book_id = (
    SELECT book_id
    FROM books
    WHERE isbn = 'EX1-T4-TEMP-20261014'
)
RETURNING copy_id;

-- Delete the temporary book after its copies have been removed.
DELETE FROM books
WHERE isbn = 'EX1-T4-TEMP-20261014'
RETURNING book_id, title;

-- Dangerous version, safely isolated to a temporary test table.
CREATE TEMP TABLE task4_update_test (id INTEGER PRIMARY KEY, label TEXT NOT NULL);
INSERT INTO task4_update_test (id, label)
VALUES (1, 'first'), (2, 'second'), (3, 'third');

-- Deliberately has no WHERE clause: observe that all three temporary rows change.
UPDATE task4_update_test
SET label = 'updated without a filter';

SELECT COUNT(*) AS changed_rows
FROM task4_update_test
WHERE label = 'updated without a filter';

-- Remove the temporary table and commit the test book/copy CRUD transaction.
DROP TABLE task4_update_test;
COMMIT;
