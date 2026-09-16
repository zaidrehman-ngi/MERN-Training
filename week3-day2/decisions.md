# Exercise 1 

## Task 5 — Form State Decision

## Registration Form

I will use controlled inputs for the registration form.

The form will need validation, error messages, and submit handling, so keeping the field values in React state will make those things easier to manage. It also gives React a single source of truth for the form values.

## Exception — File Input

`<input type="file">` must remain uncontrolled because the browser does not allow its value to be controlled by React like a normal text input.

This is the field type I will use for book cover uploads in Week 8.


# Exercise 2

## Task 3 — Validation Decision

### Validation Timing

I will validate fields when the user leaves them rather than validating on every keystroke or waiting until submit.

This gives members feedback while they are filling out the form without interrupting them while they are still typing. I will also validate the full form on submit so untouched invalid fields cannot be missed.

The trade-off is that an error may not appear until the user leaves a field, but this is less distracting than showing an error while they are still typing.


## Task 5 — Submit Button Decision

I decided not to disable the submit button until the form is valid.

A disabled button can leave a member unsure why they cannot continue, especially if they have made a mistake they have not noticed. Instead, I will keep the button enabled and validate the full form when it is submitted.

If there are errors, the form will not submit and all invalid fields will show clear messages explaining what the member needs to fix. This gives the member a clear path to correct the form instead of making the button appear unresponsive.


# Exercise 3

## Task 5 — Re-rendering Decision

Lifting the search and filter state into `Catalogue` makes the state consistent across the screen, but it also means updates to that state cause the parent and its children to render again.

I will not optimize these renders yet. I will first measure the actual performance problem before using `React.memo`, `useMemo`, or `useCallback` in Week 4.