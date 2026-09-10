# Exercise 1

## Task 1 — Component Tree

After reading `LegacyBookPanel.jsx`, I identified the following component structure:

```text
LegacyBookPanel
├── PanelHeader
│   └── FilterChips
│       └── FilterChip
├── BookList
│   └── BookRow
│       ├── BookCover
│       ├── BookInfo
│       └── BookStatus
└── PanelFooter
```

**Total components identified: 10**


## Task 2 — Component Jobs

* **LegacyBookPanel:** Manages the overall library panel.
* **PanelHeader:** Displays the panel heading with branch information.
* **FilterChips:** Displays the available filter options.
* **FilterChip:** Renders one filter button.
* **BookList:** Renders the list of books.
* **BookRow:** Displays one book entry.
* **BookCover:** Displays the book cover.
* **BookInfo:** Displays the book's descriptive information.
* **BookStatus:** Displays the book's availability details.
* **PanelFooter:** Displays the panel summary with the borrow action.

**Tree changes:** None. All component boundaries have a clear single responsibility, so the original tree remains unchanged.


## Task 3 — Application Shell

Built the application shell using separate function components for `Header`, `Sidebar`, `Main`, and `Footer`.

The components were imported into `App.jsx` and nested to create the required structure:

```text
App
├── Header
├── Sidebar
├── Main
└── Footer
```

React DevTools was used to verify that the component tree matches the expected structure.


## Task 4 — Decomposing the Legacy Panel

The legacy panel was decomposed into function components using props only, with no state.

The final component tree was rendered inside `Main` and verified in React DevTools.

The planned count from Task 1 was **10 components**. The final build also contains **10 components**, so there were no extra or missing components.

No component boundaries were changed during implementation. The planned structure worked well when building the actual components.


## Task 5 — Prop Drilling

The branchName prop is passed from App through Main and LegacyBookPanel to PanelHeader and PanelFooter.

Main and LegacyBookPanel receive branchName but do not use it themselves; they only pass it to the next component. So, 2 components are involved in prop drilling.

This problem is called prop drilling. My instinct for fixing it would be to use React Context so the value can be accessed by the components that need it without passing it through every intermediate component.


# Exercise 2

## Task 1 — Function vs Class Component

The BookCard was converted from a function component to a class component and both versions were rendered at the same time. They produced the same UI and were indistinguishable on the page.

* Component declaration: A function component is declared with `function`, while a class component uses `class` and extends `React.Component`.
* Markup: In a function component, JSX is returned directly from the function, while in a class component, JSX is returned from the `render()` method.
* Props: Function components receive props through their parameters, while class components access props through `this.props`.
* Function body: Function component logic is written inside the function, while class component logic can be placed in `render()` and other class methods.


## Task 3 — Understanding `this` and Binding

Both handlers are ordinary class methods and are defined in the same way. The difference is how they are passed to `onClick`.

When `handleBorrowClick` runs, `this` is undefined because the method was passed directly as `onClick={this.handleBorrowClick}` without being bound to the class instance. This causes the error when the method tries to access `this.props`.

`handleFilterClick` is passed through an arrow function, which calls it as `this.handleFilterClick(...)`, so `this` refers to the class instance.

The `this.handleFilterClick = this.handleFilterClick.bind(this)` line in the constructor is redundant here because the filter handler is already called through an arrow function in `onClick`.


## Task 4 — The Second Bug

The value received by handleBorrowClick was undefined because the handler was called without passing a book ID.

In the original button, React calls the click handler with the click event as the argument. Since handleBorrowClick expects a bookId, the event object would be received instead of an actual book ID. The book ID is never passed to the handler by this button.


## Task 5 — Binding Methods

Three ways to bind the handler were tested:

* Constructor binding: Uses bind(this) in the constructor. It works reliably but adds extra boilerplate because each method that needs binding must be bound manually.
* Arrow class property: Defines the handler as an arrow function class property. It automatically keeps the correct this value and avoids manual binding, but creates a function for each class instance.
* Inline arrow in render: Uses an arrow function directly in the onClick prop. It avoids manual binding, but creates a new function on every render and can make the JSX less clean.

For a code review, I would prefer the arrow class property because it keeps the handler bound to the class instance without requiring extra constructor code.

Function components do not have these problems because they do not use class-based this. The BookCard function receives its values through parameters, and the inline arrow function directly passes book.id to onBorrow.


## Task 6 — Class vs Function Components

* Class components can use local state and lifecycle methods directly through class features.
* Function components could not use state or lifecycle features on their own before React 16.8.
* React 16.8 introduced Hooks, which allowed function components to use state and other React features without converting them to classes.

