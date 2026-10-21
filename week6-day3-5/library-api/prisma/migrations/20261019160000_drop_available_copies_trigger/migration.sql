-- The trigger from Exercise 3 Task 5 was only ever created by hand on my
-- database. My decision was to keep this logic in the code, so remove it.
DROP TRIGGER IF EXISTS "borrow_requests_available_copies" ON "borrow_requests";
DROP FUNCTION IF EXISTS update_available_copies();
