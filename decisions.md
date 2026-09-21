# Exercise 2

## Task 3 — Unknown Book ID

I would show a message inside the Books layout because the URL is valid but the requested book does not exist, so the user should stay in the books section and get a clear message instead of being redirected to another page.


## Task 6 — Choosing Where State Lives

**Test:** If a piece of state needs to be shared, bookmarked, refreshed, or returned to through a URL, keep it in the URL. Otherwise, keep it in component state if it is local to one component, or in context if it needs to be shared across multiple components.

* **Search term:** URL — it describes what the user is currently searching for and should survive refresh, sharing, and the Back button.
* **Selected filter:** URL — it changes the screen being viewed and should be shareable and restorable.
* **Which book is open:** URL — the book detail page needs a unique, shareable address such as `/books/bk-3`.
* **Signed-in member:** Context — it is shared application state needed by multiple parts of the application and should not be exposed in the URL.
* **Whether a modal is open:** Component state — it is temporary UI state that normally does not need to be shared or bookmarked, although putting it in the URL could be useful for some specific modal flows.
