# Exercise 1 

## Task 5 — Form State Decision

## Registration Form

I will use controlled inputs for the registration form.

The form will need validation, error messages, and submit handling, so keeping the field values in React state will make those things easier to manage. It also gives React a single source of truth for the form values.

## Exception — File Input

`<input type="file">` must remain uncontrolled because the browser does not allow its value to be controlled by React like a normal text input.

This is the field type I will use for book cover uploads in Week 8.