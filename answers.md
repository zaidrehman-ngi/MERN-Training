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
