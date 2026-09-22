# Exercise 1

## Task 3 — Link vs Anchor

### Router Link

I initially expected the state to persist when navigating away and coming back because `Link` does not reload the page. After checking, I found that the Books component unmounts when I leave the route, so its local state is lost and resets when I return. The page itself does not fully reload.

### Plain Anchor

I expected the `<a href="/users">` to perform a normal browser navigation and reload the page, so the local state would be lost when returning to the Books page.


# Exercise 2

## Task 2 — useParams and ID Types

I expect the book will not be found if the fixture ID is a number. `useParams` returns route parameters as strings, so a numeric ID such as `3` will not strictly match the string `"3"` from the URL when using `===`.
