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


# Exercise 2

## Task 1 — Controlled Form Fields

I used one `useState` object to store all eight form fields instead of creating separate state for each field.

I also used one `handleChange` for the text fields, select, and radio buttons by reading the input's `name` and `value`.

The trade-off is that checkboxes do not use `e.target.value` to represent their checked state. They use `e.target.checked`, which is a boolean. This means the checkbox needs separate handling even though the other fields can share the same change handler.

The form fields are all controlled, so React state is the source of truth for their current values.


## Task 2 — Validation Rules

| Field | Rule | Message shown to member |
|---|---|---|
| Full name | Required | Please enter your full name. |
| Email | Required and must have a valid email shape | Please enter a valid email address. |
| Password | Required and at least 8 characters | Password must be at least 8 characters long. |
| Confirm password | Required and must match password | Passwords do not match. Please enter the same password again. |
| Phone | Required and accepts common Karachi formats such as `03001234567` or `0300-1234567` | Please enter a valid phone number. |
| Home branch | Required | Please select your home branch. |
| Membership tier | Required | Please select a membership tier. |
| Agree to terms | Must be checked | Please agree to the terms and conditions. |


## Task 3 — Validation Timing

I chose to validate each field when the user leaves it instead of validating on every keystroke or waiting until submit.

I track completed fields using a `touched` state object and only show a field's error after it has been touched. The validation functions check the current form values, but the errors are not shown while the user is still typing.

I will also validate the entire form on submit so untouched invalid fields cannot be missed.

The trade-off is that a member may not see an error until they leave a field, but this avoids interrupting them with validation errors while they are still typing.


## Task 4 — Accessibility

I added real labels for every form field using `htmlFor` and matching `id` values. Each error message is associated with its field using `aria-describedby`, and `aria-invalid` communicates the invalid state instead of relying on red text alone.

I tested it with Windows Narrator by focusing each invalid field and verifying that its label, invalid state, and associated error message were announced correctly.


## Task 5 — Submit Handling

I used `onSubmit` with `e.preventDefault()` so the page does not reload when the form is submitted.

On submit, I mark all fields as touched so that any errors are shown, then check all validation results. If there are errors, the function returns without submitting the form. If there are no errors, the form data is submitted.

I decided not to disable the submit button until the form is valid. A disabled button can leave a member unsure why they cannot continue if they have made a mistake they have not noticed. Instead, I keep the button enabled and show clear validation messages when they try to submit, so they can see exactly what needs to be fixed.


# Exercise 3

## Task 1 — Reproduce the Bug

SearchBox and ResultCount each have their own `searchText` state. When I type into SearchBox, only the state inside SearchBox changes.

ResultCount cannot know about the new search term because its state lives inside a different component instance. The two components are siblings, so neither one can directly access the other's local state.

Both components are therefore reading their own separate copy of the same fact instead of sharing one state value.


## Task 2 — Lifting State

The `Catalogue` component is the single source of truth for the search term because it is the nearest common parent of `SearchBox` and `ResultCount`, so both children now receive the same value from it.


## Task 3 — Stateless Children

SearchBox is now reusable because it no longer owns its search state. The parent decides what value it displays and what happens when the user types.

For example, the same SearchBox could be used in a Borrowed Books section by giving it the borrowed-books search value and its corresponding change handler.

In Task 1, SearchBox owned its own state, so it was tied to that specific search state and could not be controlled by another part of the catalogue.


## Task 4 — One Owner for Catalogue State

Catalogue now owns the two pieces of user-controlled state: `searchText` and `selectedFilter`. `SearchBox` and `FilterChips` receive their values and change handlers as props, while `ResultCount` receives the derived count.

The filtered book list remains derived during render from `ALL_BOOKS`, `searchText`, and `selectedFilter` instead of being stored in state.


## Task 5 — The Cost of Lifting State

When the user types one character, `SearchBox` calls `setSearchText`, which updates state in `Catalogue`. This causes `Catalogue` to render again, recalculates the derived `filteredBooks`, and causes its child components to render again as part of the parent render.

The components that re-render do not all need to because only the search value and the filtered results are affected by the new character. For example, `FilterChips` does not need to change when the search text changes.

This is the problem of unnecessary re-renders. The three tools we will learn in Week 4 to control this are `React.memo`, `useMemo`, and `useCallback`.

I will not add these optimizations now because the exercise has not shown that the current rendering is actually a performance problem. Optimization should be based on measured performance rather than something simply feeling slow.


# Exercise 4

## Task 1 — Effect Run Counts

The three effects behaved differently based on their dependency arrays.

- Effect A has no second argument, so it runs after every render. It ran 4 times: twice on the initial render because of React Strict Mode in development, then once after each filter change.
- Effect B has an empty dependency array, so it normally runs after the initial mount. It ran 2 times because React Strict Mode runs mount effects an extra time in development.
- Effect C has `filter` as a dependency, so it runs after the initial mount and whenever the `filter` value changes. It ran 4 times: twice on the initial render because of Strict Mode, then once after each filter change.

The second argument of `useEffect` is the dependency array. React compares each dependency with its value from the previous render using `Object.is`. If a dependency changed, the effect runs again. If the dependency array is empty, there are no dependencies to watch.


## Task 2 — Catalogue Loading States

I replaced the manual catalogue state switcher with `loadBooks()` from the mock API inside a `useEffect`.

The catalogue now handles all four states:

- Loading — shown while the API request is pending.
- Error — shown when `loadBooks()` rejects.
- Empty — shown when the request succeeds but returns no books.
- Results — shown when books are returned successfully.

I used `failNext()` to force the next API request to fail and confirmed that the error message appeared correctly.

The spinner also stopped after the failed request because `setLoading(false)` runs inside `finally()`, so loading ends whether the request succeeds or fails.


## Task 3 — Effect Loop

The loop happened because the effect had no dependency array and updated state inside the effect.

The cycle was:

1. The component renders.
2. The effect runs after the render.
3. `loadBooks()` completes and `setBooks()` updates the state.
4. The state update causes the component to render again.
5. The effect runs again, starting another request, and the cycle repeats.

This caused the API call count to keep increasing.

I fixed the loop by adding an empty dependency array `[]` to the effect. This tells React that the effect has no values from the component that it needs to watch, so it should not run again after every render. It runs on the initial mount instead. In development, React Strict Mode runs the mount effect twice, which is why the API call count stopped at 2.


## Task 4 — Race Condition

The race condition happened because the requests were sent in this order:

1. `Out` request was sent first.
2. `All` request was sent next and took 1500ms.
3. `Available` request was sent last and took 300ms.
4. The `Available` response arrived first and displayed the available books.
5. The older `All` response arrived later and overwrote the screen with all books.

The problem was that the responses could arrive in a different order from the requests.

I fixed this using the `useEffect` cleanup function. Each effect run starts with `ignore = false`, and its cleanup sets `ignore = true` when the dependencies change. This makes the previous request's response ignored, so only the latest effect can update the screen.

I repeated the `Out → All → Available` sequence after the fix, and the screen correctly remained on the Available books.


## Task 5 — StrictMode Double Firing

I refreshed the Catalogue page and confirmed that the effect runs twice on mount in development because of React Strict Mode.

With the cleanup added in Task 4, the double run does not cause a visible problem. The cleanup marks the previous effect as inactive, so its response is ignored if a newer effect has already started.

This is the kind of situation Strict Mode is designed to help reveal during development. It can expose effects that are not safe to run more than once or that do not clean up properly.

If I had skipped Task 4, the double firing would have revealed that the Task 2 code could have multiple requests active at the same time. An older response could then overwrite newer catalogue data, causing the same race condition we reproduced in Task 4.
