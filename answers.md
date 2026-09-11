# Exercise 1

## Task 1 — Props vs State

### Props

- Props are owned and provided by the parent component.
- The parent can change props, but the child should not modify them.
- When props change, the child receives the updated values and re-renders if needed.

### State

- State is owned by the component that defines it.
- Only the owning component can change its state using the state update mechanism.
- When state changes, React re-renders the component and its relevant children with the updated state.


## Task 2

The card still shows 1 on shelf even after the parent changes the prop from 1 to 2.

The child receives the updated prop value, but its state is not updated automatically because the prop was copied into state only when the component was created.

This is the derived state from props anti-pattern, also described as copying props into state. It can cause the state to become out of sync with the current prop value.


## Task 3 — Mutating Props

React does not stop the child from directly changing a property inside the book object.

The screen updates in the child and shows 0 on shelf, because the child renders the mutated value.

The parent is still holding the same book object, and React does not automatically re-render the parent just because a property inside that object was mutated.

One-way data flow means that data should flow from parent to child through props, while the child should not change the data it receives from the parent. The child can use the props, but changes should be made by the component that owns the data.

React did not protect the object from direct mutation, so preventing this kind of bug is the developer's responsibility.


## Task 4 — Classification Drill

- The list of books shown on the catalogue page — Props, because the books are provided by the parent and are not owned by the card.
- Which filter chip is currently selected — State, because it changes through user interaction and needs to be remembered by the owning component.
- The text the user has typed into the search box — State, because the value changes as the user types.
- The total fine owed across all overdue books — Neither, because it can be calculated from the overdue books.
- The name of the branch the page is for — Props, because it is provided by the parent.
- Whether the book card is showing its expanded view — State, because it changes through user interaction.

The two commonly mistaken values are the list of books and the total fine. Copying the books into state can make them become out of sync with the original data. Storing the total fine in state duplicates derived data and can make the value stale when the books change.


## Task 5 — One-Way Data Flow

When a filter chip is clicked:

1. The user clicks a filter chip in the Catalogue component.
2. The click calls handleFilterChange with the selected filter.
3. Catalogue updates its selectedFilter state.
4. React re-renders Catalogue with the new state.
5. Catalogue derives the filtered books and passes them to BookList as props.
6. BookList re-renders the matching BookCard components, so the new list appears on the screen.


# Exercise 2

## Task 1 — Reproduce the Outage

### Error

Uncaught TypeError: Cannot read properties of null (reading 'split')
at BookCard (BookCard.jsx:2:31)

### Component Stack

BookCard (BookCard.jsx:2:31)
BookList (BookList.jsx:6)
Catalogue (Catalogue.jsx:43)
App (App.jsx:48)
main.jsx:8

The error was caused by the 1961 book record having `author: null`. The `BookCard` tried to call `.split(" ")` on the null value.

One bad record caused the BookCard rendering to fail, which caused the catalogue page to go blank instead of rendering the remaining books.


## Task 2 — PropTypes Validation

Installed `prop-types` and added a full `BookCard.propTypes` definition using `shape`, `string`, `number`, `oneOf`, `func`, and `isRequired`.

### Violations Tested

- Omitted the required `book` prop: the component threw `Uncaught TypeError: Cannot read properties of undefined (reading 'id')`. No PropTypes warning appeared.
- Passed `"2000"` as the `year` where a number was expected: no console warning appeared and the component rendered normally.
- Passed `"RESERVED_STACK"` as the `status`: no console warning appeared and the component rendered normally.

No PropTypes warnings appeared in the console for any of the three violations.


## Task 3 — React 19 and PropTypes

`npm ls react` shows that this project is using React 19.2.8 and React DOM 19.2.8.

React 19 removed PropTypes checking from React. This means the `propTypes` block is ignored and React does not show warnings for invalid props.

React 19 also removed `defaultProps` for function components. Default parameters should be used instead.

Therefore, the `BookCard.propTypes` block I added is present in the code, but React 19 does not use it for runtime validation.


## Task 4 — React 18 PropTypes Warnings

The React 18.3.1 test project showed the PropTypes warnings that are no longer shown by React 19.

### Test 1 — Missing Required Prop

Warning:

`Warning: Failed prop type: The prop \`book\` is marked as required in \`BookCard\`, but its value is \`undefined\`.`

The component then crashed with:

`Uncaught TypeError: Cannot read properties of undefined (reading 'author')`

PropTypes detected the missing prop, but it did not prevent the component from crashing.

### Test 2 — Wrong Type

Warning:

`Warning: Failed prop type: Invalid prop \`book.year\` of type \`string\` supplied to \`BookCard\`, expected \`number\`.`

### Test 3 — Invalid Value

Warning:

`Warning: Failed prop type: Invalid prop \`book.status\` of value \`RESERVED_STACK\` supplied to \`BookCard\`, expected one of ["available","out","overdue"].`

React 18 displayed runtime warnings for all three invalid prop cases, while React 19 no longer performs these PropTypes checks.


## Task 5 — PropTypes vs Runtime Safety

A correct `propTypes` block would not have prevented the white screen, even in React 18. PropTypes only reports a warning when a prop has the wrong type; it does not stop the component from using invalid data.

The actual fix is to handle missing or invalid data safely in the component. In `BookCard`, the author, year, and cover now have sensible fallback values, so every record in `MESSY_BOOKS` renders without crashing or showing `undefined`.

PropTypes checks types while the program is running and in development only. TypeScript can check types before the program runs, but it has not been covered yet in this training programme. TypeScript would have caught the 1961 record's `author: null` if the author field had been typed as a non-nullable string, while PropTypes would only have reported it at runtime.


# Exercise 3

## Task 3 — Parent and Children Mount Order

The children run their `componentDidMount` methods before the parent because React mounts the child components and their rendered output before completing the parent's mount.

A component is considered mounted after its rendered output has been committed to the DOM. Once the child components are mounted, the parent's `componentDidMount` runs.

React StrictMode also caused the components to be deliberately unmounted and mounted again during development, which produced the additional `componentWillUnmount` and `componentDidMount` logs.


## Task 4 — Cleaning Up the Interval

The interval continued running after the `LifecycleProbe` was removed from the page because `setInterval` creates a browser timer that does not automatically stop when the component unmounts. The timer still held the callback and continued executing it every second.

I stored the interval ID on the component and called `clearInterval(this.intervalId)` inside `componentWillUnmount()`.

After clicking "Remove Probe", `componentWillUnmount` ran and the interval logs stopped. This confirmed that work started when a component mounts should be cleaned up when the component unmounts.


## Task 5 — React StrictMode and Double Firing

Without `React.StrictMode`, the four LifecycleProbe components mounted normally: each constructor and render ran once, followed by each componentDidMount.

With `React.StrictMode`, the components were deliberately mounted, unmounted, and mounted again during development. This caused the constructor, render, and componentDidMount logs to appear again, with componentWillUnmount appearing between the two mount cycles.

StrictMode is used to help find unsafe code and bugs during development. It deliberately re-runs certain lifecycle behavior so that problems such as missing cleanup, side effects during rendering, and other code that is not safe to run more than once become easier to notice.

This extra development-only behavior does not happen in the same way in production builds.

Task 4 is a good example: the interval continued running after the component was removed because it was not cleaned up. StrictMode helps expose this type of side-effect and cleanup bug during development.


## Task 6 — Class Lifecycle to Hooks

| Purpose | Class method | Hook form |
|---|---|---|
| Run once on mount | `componentDidMount` | `useEffect(() => { ... }, [])` |
| Run when a specific value changes | `componentDidUpdate` | `useEffect(() => { ... }, [value])` |
| Clean up on unmount | `componentWillUnmount` | `useEffect(() => { return () => { ... } }, [])` |