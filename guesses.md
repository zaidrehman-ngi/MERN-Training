# Exercise 1

## Task 2 — Custom Hook State

### Guess

I expect the two components to have independent toggle states. Opening the first component should not open the second component.

The custom hook shares the toggle logic so it can be reused without writing the same code again, but each call to `useToggle()` creates its own state. Therefore, even if multiple components use the same custom hook on the same page, their state is managed independently.
