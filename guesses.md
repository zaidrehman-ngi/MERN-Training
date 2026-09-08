# Exercise 1

## Task 4 — Guess

I guessed that the text typed into the input would disappear after changing the heading and saving the file, because I thought the component would render again from the beginning.


# Exercise 2

## Task 3 — Guess

`{0}` → 0

`{''}` → nothing

`{false}` → 0

`{null}` → nothing

`{undefined}` → nothing

`{NaN}` → nothing

`{[1, 2, 3]}` → values will render

`{['a', 'b']}` → values will render

`{{ title: 'Dune' }}` → `{title: 'Dune'}`

`{new Date()}` → current date

### Result

After checking the results in React, **6 out of 10 guesses were correct and 4 were wrong**.

The incorrect guesses were `{false}`, `{NaN}`, `{{ title: 'Dune' }}`, and `{new Date()}`.

I expected `{false}` to render `0`, but React does not render boolean values as visible content.

I expected `{NaN}` to render nothing, but React renders `NaN` and shows a warning.

I expected the object `{title: 'Dune'}` to render, but React does not allow plain objects to be rendered directly as React children.

I expected `new Date()` to render the current date, but a Date object cannot be rendered directly as a React child and causes an error.
