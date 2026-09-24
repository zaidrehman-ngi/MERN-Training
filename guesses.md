# Exercise 1

## Task 3

I expect the component to re-render when an unrelated part of the store changes because filter() creates a new array, making the selector result different. I do not expect a console warning.


# Exercise 2

## Task 2

I expect `state.items.push(newBook)` to work because Redux Toolkit uses Immer, but I expect it to update the state without breaking anything and the component should re-render with the new book.
