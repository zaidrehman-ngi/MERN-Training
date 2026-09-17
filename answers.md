# Exercise 1

## Task 2 — Custom Hook State

Both components have independent toggle states. Opening the first component does not open the second one, even though both use the same `useToggle` hook.

What is shared is the reusable toggle logic inside `useToggle`. The state is not shared. Each call to `useToggle()` creates its own `useState` state, so every component manages its toggle value independently.

A custom hook is simply a function whose name starts with `use` and that calls other hooks. It shares reusable logic, not state.


## Task 3 — Custom Hook Naming

Renaming `useToggle` to `toggleHook` did not break the browser functionality, but ESLint reported that `useState` is being called inside `toggleHook`, which is neither a React function component nor a custom React Hook because its name does not start with `use`.

The `use` prefix helps React's Hooks tooling identify custom Hooks and enforce rules such as calling Hooks only at the top level and not inside conditions or loops.

The prefix is not enforced by JavaScript itself; the `react-hooks/rules-of-hooks` ESLint rule is what checks and reports the problem.


## Task 4 — Logic vs UI

A custom Hook can contain reusable logic such as state, state updates, event handling, and effects. JSX can technically be returned from a Hook, as I confirmed with `useToggle`, but it should not be used for sharing UI.

Putting UI inside a Hook makes the Hook less reusable because it becomes tied to a specific markup. For example, one component might need a `<div>`, another might need a `<p>`, and another might need a card. The Hook should not decide what UI each component should use.

If two components need the same markup, a reusable React component should be created instead.

**Hooks reuse logic; components reuse UI.**


## Task 5 — useDebounce

I created a `useDebounce(value, delay)` hook and used it with the Catalogue search box. With a 500ms delay, typing `neuromancer` triggered only one API call after I stopped typing, instead of calling the API for every character.

I verified this using `getCallCount()`. The initial count was 2 because of React Strict Mode, and after typing the full search term it increased to 3.

The effect uses cleanup with `clearTimeout()` to cancel the previous timer whenever the value changes. Without the cleanup, every character created its own timer, so all of them eventually triggered API calls. This caused 13 calls in my test and showed loading repeatedly, similar to yesterday's problem where multiple requests could remain active and produce unwanted updates.


# Exercise 2

## Task 3 — Refactor Registration Form

The Registration form was **338 lines** before refactoring and **297 lines** after moving the form management logic into `useForm`.

The component was reduced by **41 lines**. The form now keeps its registration-specific validation rules and UI, while `useForm` handles the reusable form logic such as values, errors, touched fields, change handling, blur handling, and submission.

The line count dropped substantially enough to show that the reusable form logic was moved out of the component.


## Task 4 — Add a Book Form

I built the Add a Book form using the same `useForm` hook. It supports title, author, ISBN, copies, and branch validation and uses the same touched-field error behaviour as the Registration form.

The Add a Book form itself did not have a problem with the hook. The issue was in the generic logic inside `useForm`. The `validate` function returns an error object where valid fields have an empty string as their error. The original submit check used `Object.keys(validationErrors).length`, which counted those empty strings as errors. Because of this, even a completely valid form was prevented from submitting.

I changed the submit logic to check whether any error value is actually non-empty:

`const hasErrors = Object.values(validationErrors).some((error) => error !== "");`

I also updated `isValid` to use the same logic:

`const isValid = Object.values(errors).every((error) => error === "");`

The same issue did not occur to me while building the Registration form because I was refactoring an already-working form onto the Hook. I did not properly test the complete submission flow after the refactor. The Add a Book form exposed the issue because it was the second independent form using the same Hook and I tested the complete flow, including submitting with all valid values.

This showed that the problem was not that `useForm` could not support a second form. The second form worked directly with the Hook; the problem was that the Hook itself had incorrect generic logic for determining whether validation errors actually existed.


## Task 5 — Proving the Hook Is General

I checked `useForm.js` and confirmed that it does not contain any form-specific logic or references to emails, ISBNs, members, or books. The Hook only handles generic form state, validation, touched fields, submission, and reset behaviour.

For the documentation test, I gave `HOOKS.md` to Copilot and asked it to act as another developer who had never seen the Hook implementation. It was not allowed to open or inspect `useForm.js` or the existing Registration and Add a Book forms.

Copilot used only the documented API to create a third form: a Support Ticket form. It used `values`, `errors`, `touched`, `handleChange`, `handleBlur`, `handleSubmit`, `isValid`, `isSubmitting`, and `resetForm` as documented.

Copilot asked no questions because the documentation was sufficient to build the third form without needing clarification. I then created the form from its response and tested it. The validation errors appeared correctly, valid submission worked, and the form's other documented behaviour worked as expected.

This confirmed that `useForm` is general enough to support different forms and that `HOOKS.md` provides enough information for another developer to use the Hook without seeing its implementation.
