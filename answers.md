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