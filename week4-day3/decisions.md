# Exercise 3

## Task 4: Optimistic Updates

- **Borrowing: optimistic request state.** Show the request as pending immediately so the borrower gets instant feedback, then keep it as sent only after the server confirms the request was created. Roll back the pending state and show the API error if creation fails. A pending request is not the same as an approved loan, so the UI should not claim checkout is complete.
- **Deleting a book: wait for server confirmation.** Deletion is destructive and affects shared catalogue data. Keep the book visible until the server confirms deletion; on failure, this avoids restoring an item that other UI state may already have treated as gone.
- **Changing a filter: update immediately.** A filter only changes the current view and is reversible; it does not commit shared data or require server approval. The UI should reflect the selected filter at once while results update.
