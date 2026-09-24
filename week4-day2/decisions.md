# Exercise 2

## Task 6

**Decision:** The URL will be the source of truth for the book filter and search term.

The filter and search term represent the current catalogue view, so keeping them in the URL allows the view to be shared, bookmarked, refreshed, and restored through browser navigation. Redux can mirror these values when other parts of the application need them, but it should not become a second source of truth.

The URL should stay in sync with Redux by updating the URL when the filter or search changes and updating the Redux state when the URL changes, such as through browser navigation or a pasted link.

The current design breaks when a user pastes a link containing a filter or search term because the Redux store currently starts with its own default values (`filter: "all"` and `search: ""`) and does not read those values from the URL. As a result, the pasted link does not restore the intended catalogue state.
