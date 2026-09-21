# Exercise 1

## Task 3 — Link vs Anchor

### Router Link

I initially expected the state to persist when navigating away and coming back because `Link` does not reload the page. After checking, I found that the Books component unmounts when I leave the route, so its local state is lost and resets when I return. The page itself does not fully reload.

### Plain Anchor

I expected the `<a href="/users">` to perform a normal browser navigation and reload the page, so the local state would be lost when returning to the Books page.
