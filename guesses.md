# Exercise 1

## Task 3 — Target vs CurrentTarget

### Guess

I predicted that when the button is clicked:

- `e.target` would be the `<button>` because it is the element that was actually clicked.
- `e.currentTarget` would be the `<div>` because its `onClick` handler is running.
- They would not be the same object.

### Actual Result

The console showed:

- `e.target` → `<button>Click Me</button>`
- `e.currentTarget` → `<div>`
- `e.target === e.currentTarget` → `false`

The actual result matched my prediction.


