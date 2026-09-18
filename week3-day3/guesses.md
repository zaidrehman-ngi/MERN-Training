# Exercise 1

## Task 2 — Custom Hook State

### Guess

I expect the two components to have independent toggle states. Opening the first component should not open the second component.

The custom hook shares the toggle logic so it can be reused without writing the same code again, but each call to `useToggle()` creates its own state. Therefore, even if multiple components use the same custom hook on the same page, their state is managed independently.


# Exercise 3

## Task 3

### Guess

If a component calls `useContext(BranchContext)` without being wrapped in `BranchProvider`, I expect it to receive the default value passed to `createContext`.

Since `BranchContext` was created with `createContext(null)`, I expect the component to receive `null`.

I do not expect React itself to throw an error just because the Provider is missing. However, if the component tries to read a property such as `branch` from the `null` value, it will cause a runtime error.