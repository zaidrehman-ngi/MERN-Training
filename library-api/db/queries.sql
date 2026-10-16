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

-- Exercise 2, Task 1: obvious inner-join stock report; one row per loan.
SELECT b.title, loan.borrowed_on
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id;

-- Count rows produced by the inner join.
SELECT COUNT(*) AS joined_row_count
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id;

-- Count all catalogue rows for comparison.
SELECT COUNT(*) AS book_row_count
FROM books;

-- Exercise 2, Task 2: predict and count rows using INNER JOIN.
SELECT COUNT(*) AS inner_join_rows
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id;

-- Exercise 2, Task 2: count rows using LEFT JOIN, retaining every book.
SELECT COUNT(*) AS left_join_rows
FROM books AS b
LEFT JOIN book_copies AS bc ON bc.book_id = b.book_id
LEFT JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id;

-- Exercise 2, Task 2: count rows using RIGHT JOIN, retaining every loan.
SELECT COUNT(*) AS right_join_rows
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
RIGHT JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id;

-- Corrected stock report: retain every book and show a clear label if it has no loans.
SELECT
    b.title,
    CASE
        WHEN loan.loan_id IS NULL THEN 'Never borrowed'
        ELSE loan.borrowed_on::TEXT
    END AS borrow_date
FROM books AS b
LEFT JOIN book_copies AS bc ON bc.book_id = b.book_id
LEFT JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id
ORDER BY b.title, loan.borrowed_on;

-- Exercise 2, Task 3: overdue notices with member, book, branch, and days overdue.
SELECT
    m.name AS member_name,
    m.email AS member_email,
    bk.title AS book_title,
    br.name AS branch_name,
    loan.due_on,
    CURRENT_DATE - loan.due_on AS days_overdue
FROM borrow_requests AS loan
JOIN members AS m ON m.member_id = loan.member_id
JOIN book_copies AS cp ON cp.copy_id = loan.copy_id
JOIN books AS bk ON bk.book_id = cp.book_id
JOIN branches AS br ON br.branch_id = loan.branch_id
WHERE loan.returned_on IS NULL
  AND loan.due_on < CURRENT_DATE
ORDER BY loan.due_on ASC, loan.loan_id;

-- Exercise 2, Task 4: every genre assigned to Dune, through book_genres.
SELECT g.name AS genre_name
FROM books AS b
JOIN book_genres AS bg ON bg.book_id = b.book_id
JOIN genres AS g ON g.genre_id = bg.genre_id
WHERE b.title = 'Dune'
ORDER BY g.name;

-- Exercise 2, Task 4: every book assigned to the Science Fiction genre.
SELECT b.title
FROM genres AS g
JOIN book_genres AS bg ON bg.genre_id = g.genre_id
JOIN books AS b ON b.book_id = bg.book_id
WHERE g.name = 'Science Fiction'
ORDER BY b.title;

-- Deliberately incorrect: one joined genre row cannot have both names at once.
SELECT b.title
FROM books AS b
JOIN book_genres AS bg ON bg.book_id = b.book_id
JOIN genres AS g ON g.genre_id = bg.genre_id
WHERE g.name = 'Science Fiction'
  AND g.name = 'Classics';

-- Books linked to both genres: group the separate genre rows for each book.
SELECT b.title
FROM books AS b
JOIN book_genres AS bg ON bg.book_id = b.book_id
JOIN genres AS g ON g.genre_id = bg.genre_id
WHERE g.name IN ('Science Fiction', 'Classics')
GROUP BY b.book_id, b.title
HAVING COUNT(DISTINCT g.name) = 2
ORDER BY b.title;

-- Temporary positive test: Local History exists, unlike Classics.
-- Add a second genre link to Dune inside a transaction, run the same pattern,
-- then roll back so the seeded book-genre data is unchanged.
BEGIN;

INSERT INTO book_genres (book_id, genre_id)
SELECT b.book_id, g.genre_id
FROM books AS b
CROSS JOIN genres AS g
WHERE b.title = 'Dune'
  AND g.name = 'Local History'
ON CONFLICT DO NOTHING;

SELECT b.title
FROM books AS b
JOIN book_genres AS bg ON bg.book_id = b.book_id
JOIN genres AS g ON g.genre_id = bg.genre_id
WHERE g.name IN ('Science Fiction', 'Local History')
GROUP BY b.book_id, b.title
HAVING COUNT(DISTINCT g.name) = 2
ORDER BY b.title;

ROLLBACK;

-- Exercise 2, Task 5: distinct pairs of books with in-collection copies at the same branch.
SELECT DISTINCT
    br.name AS branch_name,
    b1.title AS first_book,
    b2.title AS second_book
FROM book_copies AS cp1
JOIN book_copies AS cp2
  ON cp2.branch_id = cp1.branch_id
 AND cp2.book_id > cp1.book_id
JOIN books AS b1 ON b1.book_id = cp1.book_id
JOIN books AS b2 ON b2.book_id = cp2.book_id
JOIN branches AS br ON br.branch_id = cp1.branch_id
WHERE cp1.inventory_status = 'in_collection'
  AND cp2.inventory_status = 'in_collection'
ORDER BY br.name, b1.title, b2.title;
