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