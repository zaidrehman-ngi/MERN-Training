# Exercise 1

## Task 2 — Three State Updates

### Guess

I predict that after one click, `count` will be `1`.

I also predict that `console.log(count)` immediately after the three setter calls will print `0`.

The reason is that all three calls use the same `count` value from the current render. Since `count` starts at `0`, all three calls effectively request `setCount(0 + 1)`.