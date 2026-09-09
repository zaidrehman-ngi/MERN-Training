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
