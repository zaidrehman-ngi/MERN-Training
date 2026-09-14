# Exercise 1

## Task 2 — React Events

The event received by the React `onClick` handler is not the exact same object created by the browser. React provides a `SyntheticBaseEvent` that wraps the browser's native event.

The browser's original event can be accessed through `event.nativeEvent`. In this test, the React event contained a `PointerEvent` as its `nativeEvent`.

Three event properties I would commonly use are:

* `event.target` — the element that triggered the event.
* `event.currentTarget` — the element whose handler is currently running.
* `event.type` — the type of event, such as `"click"`.

React wraps browser events to provide a consistent event interface across React components and integrate event handling with React's event system.


## Task 4 — Event Bubbling

When the Borrow button was clicked, both handlers ran because the click event bubbled from the button to its parent row. The button handler ran first, followed by the row's `onClick` handler.

I fixed this by calling `e.stopPropagation()` inside the Borrow handler. This stops the event from continuing to propagate to the row, so clicking Borrow no longer triggers the row's detail-page handler.

`stopPropagation()` also prevents the event from bubbling further to any ancestor elements that may have their own click handlers.


## Task 5 — Handler Patterns

I tested three ways to pass the book ID to a click handler:

- Inline arrow: `onClick={() => handleBorrow(book.id)}`
- Function returning a function: `onClick={createBorrowHandler(book.id)}`
- Data attribute: `data-book-id={book.id}` with `onClick={handleDataBorrow}`

I would ship the inline arrow because it is clear, simple, and makes it obvious which book ID is being passed to the handler.

The function-returning-a-function pattern also works, but it is more verbose. The data attribute approach can be useful when the ID is already part of the DOM element, but it is unnecessary here.

The Week 2 issue happened because `onClick={handleBorrow(book.id)}` calls `handleBorrow` immediately during rendering instead of giving React a function to call when the button is clicked. Wrapping it in an arrow function gives React the function reference and delays the call until the click happens.


## Task 6 — Keyboard Accessibility

A clickable `<div>` is not keyboard accessible by default. I added `tabIndex={0}` to make the row reachable with the keyboard and used `onKeyDown` to allow Enter and Space to activate it.

If I were starting the markup again, I would use a `<button>` instead of making a `<div>` clickable because a button is keyboard accessible by default.


# Exercise 2

## Task 1 — Conditional Rendering

I implemented the same availability badge using four approaches: `&&`, a ternary, an early return, and a JSX variable.

I would reach for a ternary by default when there are a small number of clear UI outcomes. I would use `&&` when I only need to show something when a condition is true and otherwise want to render nothing.

An early return is better when there are multiple conditions that determine the whole component's output. A JSX variable is useful when the conditional UI is more complex and easier to build before the final `return`.

The choice depends on the situation, but the main goal is to keep the conditional logic clear and readable.


## Task 2 — The Bare Zero

When `books` is an empty array, `books.length` evaluates to `0`. Therefore:

`{books.length && <List />}`

effectively becomes:

`{0 && <List />}`

Because `0` is falsy, the `&&` expression evaluates to `0`. React renders `false` and `null` as nothing, but `0` is treated as valid text content, so React displays the bare `0`.

The two fixes are:

`{books.length > 0 && <List />}`

or:

`{books.length > 0 ? <List /> : null}`

From now on, I will never use a numeric value directly as the left side of `&&` for conditional rendering. I will make the condition explicitly boolean, such as `books.length > 0`.


## Task 3 — Four Catalogue States

The catalogue has four states:

- Loading — the books have not finished loading yet.
- Error — something went wrong while loading the books.
- Loaded and empty — loading finished, but no books were found.
- Loaded with results — loading finished and books are available.

Loaded-and-empty and not-loaded-yet must never look the same because they communicate different situations. In the loading state, we do not know yet whether books exist, so the member should see a message such as "Loading books...". In the loaded-and-empty state, we already know that there are no matching books, so the member should see something such as "No books found. Try changing your search or filter."

Making these states visually and verbally different prevents members from thinking that a search is broken or that there are no results when the catalogue is still loading.


## Task 4 — Conditional Attributes

I calculated the conditional values before the JSX and then used them as attributes. The row gets the `is-overdue` class only when the status is `overdue`, the Borrow button is disabled when `copiesOnShelf` is `0`, and the badge text and class change according to the book status.

I did not use `if` statements inside JSX. Instead, I prepared values such as `rowClass`, `isBorrowDisabled`, `badgeText`, and `badgeClass` before the `return` and then used those values in the JSX.

This follows the same rule from Week 2 Exercise 3: keep JavaScript logic outside the JSX and let the JSX focus on rendering the result.


## Task 5 — Two Ways to Hide Something

I tested two ways of hiding the same panel.

With conditional rendering, `{isOpen && <Panel />}`, the panel is removed from the React tree when it is hidden. The component is unmounted, so anything it was doing through effects, such as subscriptions or timers, can be cleaned up during unmount.

With `display: none`, the panel remains in the React tree and is only hidden visually. The component is still mounted, so its effects and other ongoing work can continue even though the user cannot see it.

I would deliberately use `display: none` when I want to keep the component mounted and preserve its state while temporarily hiding it. If the component should not exist or do any work while hidden, I would prefer conditional rendering.

This connects to the cleanup concept from Friday: when a component is unmounted, its effects should clean up subscriptions, timers, listeners, or other ongoing work so they do not continue after the component is gone.