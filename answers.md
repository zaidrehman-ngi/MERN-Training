# Exercise 1

## Task 1 — How useState Works

`useState()` returns two things: the current state value and a setter function used to request a state update.

Calling the setter does not directly change the current JavaScript variable. It tells React that the state should have a new value, which causes the component to render again with the updated state.

Hooks must be called at the top level of the component, not inside an `if` statement or a loop. React keeps track of hook state by the order in which hooks are called. If that order could change between renders, React would not know which stored state belongs to which `useState()` call.


## Task 2 — Three State Updates

The first version produced `1` after one click, while `console.log(count)` immediately after the three setter calls printed `0`.

The three calls all used the same `count` value from the current render:

`setCount(0 + 1)`

React batches the state updates instead of re-rendering after each setter call, so all three calls requested the same next value. The component then rendered again with `count` equal to `1`.

To make one click add three, I changed the updates to functional updaters:

`setCount((currentCount) => currentCount + 1);`
`setCount((currentCount) => currentCount + 1);`
`setCount((currentCount) => currentCount + 1);`

React queues these updater functions and applies them in order:

`0 → 1 → 2 → 3`

The component then re-renders once with `count` equal to `3`.

This connects to the main rule because the component function does not run again between the three setter calls. The `count` variable inside the current handler remains the value from that render. The functional updater lets React use the latest queued state for each update instead.


## Task 3 — Controlled Input

I first built the input as a controlled input by keeping its value in state and updating that state through `onChange`.

I then removed `onChange` while keeping `value={name}`. React showed this warning:

You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.

The text is stored in React state, and `value={name}` makes that state the source of truth for the input. When `onChange` is removed, typing cannot update the state, so `name` remains unchanged. React therefore keeps rendering the same value back into the input, which makes the field appear unable to accept typing.

The problem is that React owns the value, but there is no way for the user's input to update the state.


## Task 4 — Uncontrolled Input

I built the same field as an uncontrolled input using `defaultValue` instead of `value`. The DOM owns the current value, so I could type into the field without storing each change in React state.

On submit, I used `FormData` with the form element from `e.currentTarget` to read the current value from the form. After typing `Ahmed`, the submitted value was correctly logged as `Ahmed`.

I then reproduced the reset bug by calling `setName("")`. The state was reset correctly, but the input did not clear because the input's current value was owned by the DOM, not by React state. `defaultValue` only sets the initial value and does not control the value on later renders.

The console was right because the React state really was `""`. The screen was also right because the DOM still had `Ahmed` as the input's current value. They disagreed because React state and the uncontrolled input were storing different values.