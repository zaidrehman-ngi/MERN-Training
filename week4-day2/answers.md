# Exercise 1

## Task 2

Redux DevTools time travel shows how each dispatched action changes the store state by letting us move back through previous states.


## Task 3

The selector returned a new array reference even when the store state used by it had not changed. Since useSelector compares the previous and new results by reference, it treated them as different, causing an unnecessary re-render and a development warning. This is similar to Context, where a changed provider value can cause its consumers to re-render.


## Task 4

### Component State

The Add Book form state belongs in component state because it is only needed by the form; putting it in the URL, Context, or Redux would make simple local state more complicated.

### URL State

The Books search query `q` belongs in the URL because it should stay in the URL, support browser navigation, and allow the same search to be shared through a link; component state, Context, or Redux would not provide these URL benefits naturally.

### Context

Currently, there is no state in the active app that needs to be kept in Context, but in the future, signed-in member information and similar shared app-level data could be a good fit if multiple parts of the app need access to it; component state would require passing it through components, the URL would expose application data in the link, and Redux would be more setup than needed for simple shared data.

### Redux Store

The selected branch belongs in Redux because it is shared application state that can be read and changed from different parts of the app; component state would require passing it around, the URL is not a natural fit, and Context would provide sharing but not the same Redux tooling and action-based state flow.

### Redux vs Context

* **Redux DevTools:** We can see every dispatched action and inspect how the state changed, including time travel.
* **Clear update flow:** State changes happen through actions and reducers, making it easier to understand where and how shared state was changed.
* **Selectors:** Components can subscribe to the specific state they need, so an unrelated state change does not automatically mean every subscribed component has to re-render.


### Task 5

* **Action creators and action types:** `createSlice` automatically creates the action creators and action types from the reducers, which plain Redux required us to write separately.
* **Reducer setup:** `createSlice` creates the slice reducer from the reducer functions, instead of requiring separate reducer files and switch statements.
* **Immutable updates:** `createSlice` uses Immer, so we can write simple mutation-style code like `state.selectedBranch = action.payload` while Immer handles the immutable update behind the scenes.
* **Store setup:** `configureStore` automatically combines reducers, adds default middleware, and connects Redux DevTools instead of requiring us to configure these manually.


# Exercise 2

### Task 2

Redux Toolkit uses **Immer** inside its reducers. It gives the reducer a draft version of the state, so code like `state.items.push(newBook)` can be used safely.

Immer tracks the changes made to the draft and produces a new immutable state. Redux then uses that new state as the current store state.

The Week 2 rule is still valid. We should not directly mutate actual state in plain React or Redux code. Mutation-style code is only safe inside Redux Toolkit reducers because Immer handles the draft and creates the new immutable state.


### Task 4

`selectFilteredBooks` uses `createSelector` to derive the filtered and searched book list from three store values: the books list, filter, and search term.

`createSelector` caches the result of the selector. If the input values have not changed, it returns the previously calculated result instead of running the filtering logic again.

The cache becomes useless if the input selectors return new references unnecessarily, such as creating a new array or object every time. That makes the inputs look changed even when the actual data has not changed, so the selector has to calculate the result again.

The previous inline `useSelector` used `filter()` directly, which created a new array on each execution and caused the development warning. Using `createSelector` gives us a memoized selector and removes that problem.


# Exercise 3

### Task 2

* **Total time for the commit:** 134.1ms (first keystroke)
* **Slowest component:** `Books`, 42.8ms
* **Components re-rendered:** 221 (217 `BookCardModule` + `Books` + `FilterChips` + `SearchBox` + `ResultCount`)
* **Why did this render (BookCardModule):** Props changed: `onSelect`


### Task 3

**After wrapping `BookCardModule` with `React.memo`:**

* **Total time for the commit:** 173.8ms
* **Slowest component:** `Books`, 62.2ms
* **Components re-rendered:** 221
* **Why did this render (BookCardModule):** Props changed: `onSelect`

**Observation:** `React.memo` did not reduce the re-renders because the `onSelect` function is recreated whenever `Books` renders, so it is treated as a changed prop.


### Task 4

**After stabilizing `onSelect` with `useCallback`:**

* **Total time for the commit:** 62.6ms
* **Slowest component:** `Books`, 59.8ms
* **Components re-rendered:** 4 (`Books`, `SearchBox`, `FilterChips`, `ResultCount`)
* **BookCard:** Did not re-render because `onSelect` is now the same function reference between renders.

**Rule:** `React.memo` compares a component's props with their previous values. An inline handler creates a new function on every parent render, so `React.memo` sees it as a changed prop and re-renders the component. `useCallback` keeps the same function reference between renders, allowing `React.memo` to skip the re-render when the other props are also unchanged.


### Task 5

The filtering calculation was already memoized in Exercise 2 using Redux Toolkit's `createSelector`, so no additional `useMemo` was needed.

`createSelector` memoizes derived data from Redux state and only recalculates when its input selectors change. `useMemo` memoizes a calculation inside a React component and is useful when the derived value is component-specific or does not belong in Redux selectors.

For this case, `createSelector` is the better fit because the filtered books are derived from Redux state (`books`, `filter`, and `search`). `useMemo` would be useful for expensive calculations that are local to a component and do not need to be shared through Redux.

* **Total time for the commit:** 62.6ms
* **Slowest component:** `Books`, 59.8ms
* **Components re-rendered:** 4 (`Books`, `SearchBox`, `FilterChips`, `ResultCount`)
* **BookCard:** Did not re-render.


### Task 6

| Point               | Total Time | Slowest Component | Components Re-rendered |
| ------------------- | ---------: | ----------------- | ---------------------: |
| Baseline            |    134.1ms | `Books` — 42.8ms  |                    221 |
| After `React.memo`  |    173.8ms | `Books` — 62.2ms  |                    221 |
| After `useCallback` |     62.6ms | `Books` — 59.8ms  |                      4 |
| Final state         |     62.6ms | `Books` — 59.8ms  |                      4 |

**Most effective change:** `useCallback` had the biggest impact because it stabilized the `onSelect` function, allowing `React.memo` to skip the `BookCardModule` re-renders.

**Would I have guessed it?** I expected `React.memo` alone to have little or no effect because `onSelect` was being recreated on every render. The profiler confirmed this and showed that stabilizing the handler was the change that made `React.memo` effective.

**Wrong dependency array:** If `useCallback` had an incorrect dependency array, the callback could keep using an outdated value from an earlier render. To a user, this could appear as stale or incorrect behavior, such as an action using old data or navigating based on an outdated value. It would not necessarily look like a performance problem.


# Exercise 4

### Task 1

After memoizing `Header`, `FilterChips`, and the Books page title:

* **Total time for the commit:** 61.6ms
* **Slowest component:** `Books`, 58.6ms
* **Components re-rendered:** 3 (`Books`, `SearchBox`, `ResultCount`)

Only 1 of the 3 memoizations survived: `FilterChips`. Its `onFilterChange` prop was stabilized with `useCallback`, so it stopped re-rendering when the parent rendered again.

The `Header` memoization and the `BooksTitle` memoized component were removed because they produced no meaningful measurable improvement. The attempted deleted code was:

```jsx
const Header = React.memo(function Header() {
	return <header>Header</header>;
});
```

```jsx
const BooksTitle = React.memo(function BooksTitle() {
	return <h1>Books</h1>;
});
```

The commit time was effectively unchanged: 61.6ms compared with 62.6ms, so the optimization did not materially improve overall performance.


### Task 2

`useMemo` remembers a calculated value so React can reuse it when its inputs have not changed.

`useCallback` remembers a function so React can reuse the same function reference when its dependencies have not changed.

They both avoid creating or recalculating something unnecessarily; I use `useMemo` for an expensive value and `useCallback` for a function passed to another component, especially a memoized one.

**Real `useMemo` example:** `BranchProvider` in `src/context/BranchContext.jsx` memoizes its `{ branch, member }` context value. This is a project use case, although `BranchProvider` is not currently mounted in the active app tree.

**Real `useCallback` example:** `Books` memoizes `handleSelect` and passes it as `onSelect` to the memoized `BookCardModule`. The stable function reference lets the book cards avoid re-rendering when their other props have not changed.


### Task 3

With 2,000 books, the first commit took **161ms**, with `Books` as the slowest component at **153.7ms**. At 500 books, the same measurements were **61.6ms** and **58.6ms**.

The `BookCardModule` components still did not re-render because `React.memo` and `useCallback` are working. The main new cost is in `Books`, which has to process the much larger filtered list and create 2,000 elements on each search update, while React still has to compare the memoized cards.

The technique that addresses lists of this size is **list virtualization (windowing)**. It renders only the items currently visible on screen instead of processing the entire list at once. Libraries such as `react-window` and TanStack Virtual can be used for this.

Memoization can skip component re-renders, but it does not remove the work involved in processing a large list.


### Task 4

**Three things I memoised and would keep:**

* **`BookCardModule` with `React.memo`** — It prevents the book cards from re-rendering when their props have not changed, which becomes important with a large list.
* **`handleSelect` with `useCallback`** — It keeps the `onSelect` function reference stable so `React.memo` can work effectively for `BookCardModule`.
* **`FilterChips` with `React.memo` and `handleFilterChange` with `useCallback`** — This prevents `FilterChips` from re-rendering when the parent updates for unrelated changes.

**Three things I deliberately did not memoise:**

* **`Header`** — It had no props and memoizing it produced no meaningful improvement. Keeping the optimization would add unnecessary code.
* **Books page title (`<h1>Books</h1>`)** — It is a simple element with negligible rendering cost. Extracting it into a memoized component would add unnecessary component and maintenance overhead.
* **`ResultCount`** — Its `count` prop changes when the search results change, so memoizing it would not prevent the renders that matter. It would add memoization code without providing a useful benefit.

The main lesson is that memoization should be used where it prevents meaningful work, not applied automatically to every component.
