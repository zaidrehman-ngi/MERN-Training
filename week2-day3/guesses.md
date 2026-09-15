# Exercise 1

## Task 2

I guessed that the card would show 2 on shelf because the parent changes the onShelf prop from 1 to 2 and the child re-renders. I thought the state would receive the updated prop value when the parent re-renders.


# Exercise 3

## Task 2

### First Mount

1. constructor
2. render
3. componentDidMount

### Re-render from Prop Change

1. render
2. componentDidUpdate

### Unmount

1. componentWillUnmount

### Actual First Mount

The actual lifecycle logs were:

1. constructor
2. constructor
3. render
4. render
5. componentDidMount
6. componentWillUnmount
7. componentDidMount

The constructor, render, and componentDidMount fired twice because the app is running in React StrictMode during development. The component was deliberately mounted, unmounted, and mounted again.

### Actual Re-render from Prop Change

The actual lifecycle logs after changing the prop were:

1. render
2. componentDidUpdate

This matched my prediction. The constructor and componentDidMount did not run again because the component was updated, not mounted again.

### Actual Unmount

The actual lifecycle log after clicking "Remove Probe" was:

1. componentWillUnmount

This matched my prediction. `componentWillUnmount` runs when the component is removed from the page.


## Task 3

### Predicted Mount Order

1. Parent constructor
2. Parent render
3. Child 1 constructor
4. Child 1 render
5. Child 2 constructor
6. Child 2 render
7. Child 3 constructor
8. Child 3 render
9. Child 1 componentDidMount
10. Child 2 componentDidMount
11. Child 3 componentDidMount
12. Parent componentDidMount

### Actual Mount Order

The actual mount order matched my prediction:

1. Parent constructor
2. Parent render
3. Child 1 constructor
4. Child 1 render
5. Child 2 constructor
6. Child 2 render
7. Child 3 constructor
8. Child 3 render
9. Child 1 componentDidMount
10. Child 2 componentDidMount
11. Child 3 componentDidMount
12. Parent componentDidMount

The child components run their componentDidMount methods before the parent because the children are mounted first. The parent is considered mounted after its rendered child tree has been mounted and committed to the DOM.

React StrictMode also caused the components to be deliberately unmounted and mounted again during development, which produced the additional componentWillUnmount and componentDidMount logs.