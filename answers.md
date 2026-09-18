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


# Exercise 3

## Task 1 — Measuring branchName Prop Drilling

4 components currently receive `branchName`: `Main`, `CataloguePanel`, `PanelHeader`, and `PanelFooter`.

Only 2 of them actually use/render it: `PanelHeader` and `PanelFooter`.

The other 2 components, `Main` and `CataloguePanel`, only receive `branchName` to pass it down.

The ratio is 2 ÷ 4 = 50%, meaning half of the components receiving `branchName` are only passing it through.


## Task 2 — Replacing Prop Drilling with Context

I created `BranchContext` with a `BranchProvider` that holds the current branch and signed-in member. The app is wrapped with `BranchProvider` in `App.jsx`.

`PanelHeader` and `PanelFooter` now read the branch directly from `BranchContext` using `useContext`.

I removed the `branchName` prop from `Main` and `CataloguePanel` because they only received it to pass it to the next component.

After removing the prop-drilling chain, I ran the app and confirmed that the branch name still appears correctly in both `PanelHeader` and `PanelFooter`.

This removed the need for intermediate components to know about or pass along the branch name.


## Task 3 — Missing Provider

The result matched my guess. Without `BranchProvider`, `useContext(BranchContext)` returned `null`, and destructuring `branch` caused a runtime `TypeError`.

The screen became blank because `PanelHeader` crashed while rendering.

This is dangerous because moving or reusing a component outside the required Provider tree can cause a runtime crash.


## Task 4 — useBranch

I created `useBranch()` to call `useContext(BranchContext)`, throw a clear error when `BranchProvider` is missing, and return the context value.

I switched `PanelHeader` and `PanelFooter` to use `useBranch()`.

Benefits over calling `useContext` directly:

* Provides a clear and consistent missing-provider error.
* Hides the Context implementation from consumers and gives them a reusable `useBranch()` API.


## Task 5 — Context Re-renders

With `value={{ branch, member }}`, changing unrelated state in the Provider caused all three consumers to re-render because a new object was created on every Provider render.

I fixed this by using `useMemo` so the context value only changes when `branch` or `member` changes.

When `branch` changes but `member` does not, all consumers of the same Context still re-render because the Context value changes.

If `branch` and `member` update at very different rates, I would split them into separate Contexts so consumers only re-render when the value they need changes.


# Exercise 4

## Task 1 — Seven Problems

1. **Conditional Hook:** `useState` is called inside an `if` block. This can break when `showAdminColumns` changes because Hooks must be called in the same order on every render.

2. **Missing dependency:** The effect uses `search` but only depends on `filter`. Changing the search text therefore does not trigger a new search.

3. **Race condition:** Multiple `loadBooks` requests can overlap, allowing an older response to overwrite newer results. This can show the user stale data.

4. **State mutation:** `results.push(...books)` directly mutates the existing state array. This can cause incorrect results and unreliable state updates.

5. **Data mutation:** `book.title` is modified directly. This can unexpectedly change the original book data if the same object is used elsewhere.

6. **Unstable key:** The table rows use the array index as the key. When the list changes, React can associate the wrong item with an existing DOM element.

7. **Not reusable:** The Hook receives the screen-specific `showAdminColumns` option and returns table row JSX. This ties it to one screen instead of returning reusable book-search data.


## Task 2 — Testing the Four Sequences

### Sequence 1 — Search

Typing `dune` exposed:

* **#2 — Missing search dependency:** The effect did not respond to changes in the search value.
* **#4 — State mutation:** Results accumulated because the existing array was mutated with `push()`.
* **#5 — Data mutation:** Unavailable book titles were modified repeatedly, causing `(unavailable)` to appear more than once.

### Sequence 2 — Available → All

This exposed **#3 — Race condition**. The requests can overlap, allowing an older response to overwrite newer results.

### Sequence 3 — Available → All → Available

This exposed **#4 — State mutation**. Results from previous requests accumulated, causing the number of rows to keep increasing.

### Sequence 4 — `showAdminColumns: true`

This did not expose any additional problem. The conditional Hook (#1) was not triggered because `showAdminColumns` remained `true`.

### Problems Not Exposed

* **#1 — Conditional Hook**
* **#6 — Unstable key**
* **#7 — Not reusable**

These problems were not exposed by the four sequences and could therefore reach production without this review.


## Task 3 — Why the Hook Is Not Reusable

Two things make this Hook specific to one screen:

1. **Screen-specific parameter:** `showAdminColumns` makes the Hook responsible for an admin screen's UI concerns. A reusable search Hook should not know which columns a particular screen needs.

2. **Returns JSX:** The Hook returns `<tr>` elements, so it is tied to a table layout. A different page such as a grid or search dropdown could not reuse the returned markup.

The Hook should return the search data and its state instead of JSX. Each component should decide how to display that data, whether as a table, grid, dropdown, or another UI.

**Hooks reuse logic; components reuse UI.**


## Task 4 — Rewriting useBookSearch

I rewrote `useBookSearch` to accept only `search` and `filter` and return book-search data and state instead of JSX. The Hook now returns `results`, `loading`, and `error`, allowing the consuming component to decide how the books should be displayed.

I used the `useDebounce` Hook from Exercise 1 with a 500ms delay, so the search request is not triggered for every character typed. I also kept the request cleanup to prevent an older request from updating the results after a newer request.

I replaced the `useEffect` and related API logic in `Catalogue` with `useBookSearch(searchText, selectedFilter)`. The Catalogue now only manages its UI state and rendering, while the Hook handles searching, loading, errors, and results.

I tested the loading, error, empty, and results states, along with search debouncing and filter changes. The Catalogue worked correctly after the refactor.


## Task 5 — Final Review

If I were starting `useForm` again, I would test the complete form submission flow earlier, including a fully valid form, instead of mainly checking validation behaviour. I would also define and test the validation error handling more carefully because the Add a Book form exposed an issue where valid fields with empty error messages were incorrectly treated as errors. Finally, I would think about the second form while designing the Hook from the start so I could identify the reusable parts and test the Hook with more than one type of form earlier.
