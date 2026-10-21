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


-- Exercise 3, Task 1: how many books are in the catalogue?
SELECT COUNT(*) AS total_books
FROM books;

-- Exercise 3, Task 1: how much in fines is still owed?
-- (fines assessed on loans minus what has been paid)
SELECT
    (SELECT COALESCE(SUM(fine_assessed), 0) FROM borrow_requests)
  - (SELECT COALESCE(SUM(amount), 0) FROM fine_payments) AS fines_outstanding;

-- Exercise 3, Task 1: average loan length in days (returned loans only).
SELECT ROUND(AVG(returned_on - borrowed_on), 2) AS avg_loan_days
FROM borrow_requests
WHERE returned_on IS NOT NULL;

-- Exercise 3, Task 1: oldest year in the catalogue.
-- There is no publication year in the schema, so this uses acquisition_year.
SELECT MIN(acquisition_year) AS oldest_year
FROM book_copies;

-- Exercise 3, Task 1: the busiest single day (most loans borrowed).
SELECT borrowed_on, COUNT(*) AS loans
FROM borrow_requests
GROUP BY borrowed_on
ORDER BY loans DESC
LIMIT 1;

-- Exercise 3, Task 2: fines per branch (assessed, paid, and still owed).
-- Payments are summed per loan first so a loan with two payments isn't counted twice.
SELECT
    br.name AS branch_name,
    COALESCE(SUM(loan.fine_assessed), 0) AS fines_assessed,
    COALESCE(SUM(paid.total_paid), 0) AS fines_paid,
    COALESCE(SUM(loan.fine_assessed), 0) - COALESCE(SUM(paid.total_paid), 0) AS fines_owed
FROM branches AS br
LEFT JOIN borrow_requests AS loan ON loan.branch_id = br.branch_id
LEFT JOIN (
    SELECT loan_id, SUM(amount) AS total_paid
    FROM fine_payments
    GROUP BY loan_id
) AS paid ON paid.loan_id = loan.loan_id
GROUP BY br.branch_id, br.name
ORDER BY fines_owed DESC, br.name;

-- Exercise 3, Task 2: loans per member (members with no loans show 0).
SELECT m.name AS member_name, COUNT(loan.loan_id) AS loans
FROM members AS m
LEFT JOIN borrow_requests AS loan ON loan.member_id = m.member_id
GROUP BY m.member_id, m.name
ORDER BY loans DESC, m.name;

-- Exercise 3, Task 2: books per genre (genres with no books show 0).
SELECT g.name AS genre_name, COUNT(bg.book_id) AS books
FROM genres AS g
LEFT JOIN book_genres AS bg ON bg.genre_id = g.genre_id
GROUP BY g.genre_id, g.name
ORDER BY books DESC, g.name;

-- Exercise 3, Task 2: loans per month.
SELECT DATE_TRUNC('month', borrowed_on)::date AS loan_month, COUNT(*) AS loans
FROM borrow_requests
GROUP BY loan_month
ORDER BY loan_month;

-- Exercise 3, Task 2: deliberately wrong - borrowed_on is neither grouped nor aggregated.
-- Postgres refuses this with an error.
SELECT br.name AS branch_name, loan.borrowed_on, COUNT(*) AS loans
FROM borrow_requests AS loan
JOIN branches AS br ON br.branch_id = loan.branch_id
GROUP BY br.name;

-- Exercise 3, Task 3: deliberately wrong - an aggregate in WHERE.
-- Postgres: "aggregate functions are not allowed in WHERE".
SELECT
    br.name AS branch_name,
    SUM(loan.fine_assessed - COALESCE(paid.total_paid, 0)) AS fines_owed
FROM branches AS br
JOIN borrow_requests AS loan ON loan.branch_id = br.branch_id
LEFT JOIN (
    SELECT loan_id, SUM(amount) AS total_paid
    FROM fine_payments
    GROUP BY loan_id
) AS paid ON paid.loan_id = loan.loan_id
WHERE SUM(loan.fine_assessed - COALESCE(paid.total_paid, 0)) > 10000
GROUP BY br.branch_id, br.name;

-- Exercise 3, Task 3: which branches owe more than 10,000 rupees in outstanding fines?
SELECT
    br.name AS branch_name,
    SUM(loan.fine_assessed - COALESCE(paid.total_paid, 0)) AS fines_owed
FROM branches AS br
JOIN borrow_requests AS loan ON loan.branch_id = br.branch_id
LEFT JOIN (
    SELECT loan_id, SUM(amount) AS total_paid
    FROM fine_payments
    GROUP BY loan_id
) AS paid ON paid.loan_id = loan.loan_id
GROUP BY br.branch_id, br.name
HAVING SUM(loan.fine_assessed - COALESCE(paid.total_paid, 0)) > 10000;

-- Exercise 3, Task 4: members with more than three overdue books,
-- with the count and what they owe on them, worst first.
SELECT
    m.name AS member_name,
    COUNT(*) AS overdue_books,
    SUM(loan.fine_assessed - COALESCE(paid.total_paid, 0)) AS total_owed
FROM members AS m
JOIN borrow_requests AS loan ON loan.member_id = m.member_id
LEFT JOIN (
    SELECT loan_id, SUM(amount) AS total_paid
    FROM fine_payments
    GROUP BY loan_id
) AS paid ON paid.loan_id = loan.loan_id
WHERE loan.returned_on IS NULL
  AND loan.due_on < CURRENT_DATE
GROUP BY m.member_id, m.name
HAVING COUNT(*) > 3
ORDER BY overdue_books DESC, total_owed DESC;

-- Exercise 3, Task 5: add an available-copy count to books and fill it from
-- the current data (in-collection copies that are not out on a loan).
ALTER TABLE books
    ADD COLUMN available_copies INTEGER NOT NULL DEFAULT 0;

UPDATE books AS b
SET available_copies = (
    SELECT COUNT(*)
    FROM book_copies AS bc
    WHERE bc.book_id = b.book_id
      AND bc.inventory_status = 'in_collection'
      AND NOT EXISTS (
          SELECT 1
          FROM borrow_requests AS loan
          WHERE loan.copy_id = bc.copy_id
            AND loan.returned_on IS NULL
      )
);

-- Exercise 3, Task 5: trigger that keeps available_copies correct when a loan
-- is created (count goes down) or returned (count goes up).
CREATE OR REPLACE FUNCTION update_available_copies()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.returned_on IS NULL THEN
        UPDATE books
        SET available_copies = available_copies - 1
        WHERE book_id = (SELECT book_id FROM book_copies WHERE copy_id = NEW.copy_id);
    ELSIF TG_OP = 'UPDATE' AND OLD.returned_on IS NULL AND NEW.returned_on IS NOT NULL THEN
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE book_id = (SELECT book_id FROM book_copies WHERE copy_id = NEW.copy_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER borrow_requests_available_copies
AFTER INSERT OR UPDATE OF returned_on ON borrow_requests
FOR EACH ROW
EXECUTE FUNCTION update_available_copies();

-- Exercise 3, Task 5: test in DBeaver with no application code running.
-- 1. Check Dune's count before the loan.
SELECT title, available_copies
FROM books
WHERE title = 'Dune';

-- 2. Insert a loan directly for one of Dune's copies.
INSERT INTO borrow_requests (member_id, copy_id, branch_id, due_on)
SELECT m.member_id, bc.copy_id, bc.branch_id, CURRENT_DATE + 14
FROM members AS m
CROSS JOIN book_copies AS bc
WHERE m.name = 'Omar Sethi'
  AND bc.copy_id = 'f1000000-0000-4000-8000-000000000002';

-- 3. Check the count again (it should have gone down by one).
SELECT title, available_copies
FROM books
WHERE title = 'Dune';

-- 4. Return the loan.
UPDATE borrow_requests
SET returned_on = CURRENT_DATE,
    status = 'returned'
WHERE copy_id = 'f1000000-0000-4000-8000-000000000002'
  AND returned_on IS NULL;

-- 5. Check the count again (it should be back up).
SELECT title, available_copies
FROM books
WHERE title = 'Dune';
