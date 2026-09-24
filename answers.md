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
