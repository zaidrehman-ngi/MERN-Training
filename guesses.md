# Exercise 1

## Task 2 — Three State Updates

### Guess

I predict that after one click, `count` will be `1`.

I also predict that `console.log(count)` immediately after the three setter calls will print `0`.

The reason is that all three calls use the same `count` value from the current render. Since `count` starts at `0`, all three calls effectively request `setCount(0 + 1)`.


# Exercise 4

## Task 1 — Effect Run Counts

### Guess

The component renders once initially, then its state changes twice.

I predict:

* Effect A will run **3 times** because it has no dependency array, so it runs after every render.
* Effect B will run **1 time** because the empty dependency array means it runs after the initial mount.
* Effect C will run **1 time if `filter` does not change**, because it runs on the initial render and then only when `filter` changes.
