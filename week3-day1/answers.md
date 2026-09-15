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


# Exercise 3

## Task 1 — Missing Key Warning

I rendered all books using `.map()` without providing a `key` prop.

React showed this warning:

Each child in a list should have a unique "key" prop. Check the render method of `div`. It was passed a child from KeyWarning. See https://react.dev/link/warning-keys for more information.

This is a warning, not an error. The page still works, which is why this kind of issue can easily make it into a shipped application.


## Task 2 — Index Key Bug

After checking the third book and removing the first book, the checkbox stayed checked on the third row, but that row now contained the fourth book.

This reproduced the bug: the checkbox appeared to move to the wrong book.


## Task 3 — Stable Keys

I changed only `key={index}` to `key={book.id}` and repeated the same sequence: I checked the third book and removed the first book.

This time, the checkbox stayed with the correct book instead of moving to the wrong row.

Nothing else in the file changed. The difference came entirely from giving React a stable key that identifies the book itself rather than its current position in the list.


## Task 4 — What a Key Is For

A key tells React which item in a list is which between two renders. React uses the key to match the previous rendered item with the corresponding item in the next render so it can decide which elements to keep, update, move, or remove.

With `key={index}`, the row's identity was based on its position. When the first book was removed, the remaining books shifted indexes, so React reused existing rows for different books.

The checkbox was affected even though it was not part of the book data because the checkbox was part of the reused DOM row. React reused that row and therefore reused the same checkbox element, including its browser-managed checked state.

With `key={book.id}`, each row keeps the identity of the book it represents, so React can correctly match rows when the list changes. The checkbox therefore stays with the correct book.


## Task 5 — Rules for Keys

### 1. The key goes on the element returned by the map

The key should be placed on the outermost element returned for each item in the `.map()`.

My code proves this:

`{books.map((book) => (`
`  <div key={book.id}>`

The `<div>` is the element representing each book, so it carries the key.

### 2. Keys only need to be unique among the siblings in that list

A key does not need to be globally unique across the whole application. It only needs to uniquely identify each item among the other siblings in the same list.

My code uses:

`<div key={book.id}>`

Each book has a unique `id`, so the rows can be identified correctly within this list.

### 3. Use a keyed Fragment when returning multiple siblings without a wrapper

If the mapped item needs to return two sibling elements without adding an extra wrapper element, I can use `React.Fragment` and put the key on the Fragment:

`<React.Fragment key={book.id}>`
`  <h3>{book.title}</h3>`
`  <button>Remove</button>`
`</React.Fragment>`

The short `<>...</>` Fragment syntax cannot receive a key, so `React.Fragment` is needed when the Fragment itself must carry the key.


# Exercise 4

## Task 2 — State vs Derived Data

The selected filter and search text belong in state because they are values directly chosen and changed by the user.

The filtered book list does not belong in state because it can be derived during render from `selectedFilter`, `searchText`, and `ALL_BOOKS`.


## Task 5 — BookCard API

I did not edit BookCard today. Task 4 tempted me to add the checkbox to BookCard, but the checkbox was only needed to prove the key behavior, so I kept it in Catalogue instead.

This avoided making BookCard responsible for page-specific UI and state. Since the BookCard prop API did not need to change, no update to COMPONENTS.md was required.