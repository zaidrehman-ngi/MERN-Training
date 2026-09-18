# Exercise 2

## Task 1

`useForm` will receive validation rules through a `validate` function instead of having validation rules built into the Hook.

This keeps `useForm` reusable because it does not need to know about specific fields such as emails, ISBNs, members, or books. Each form can provide its own validation rules while using the same form logic.


# Exercise 3

## Task 6 — Context vs Props vs Lifted State

### Decision Test

* **Context:** Use when multiple distant components need the same shared value.
* **Lifted state:** Use when related components in the same feature need to share and coordinate state.
* **Props:** Use when data is passed directly between closely related components.

### Application

* **Branch name → Context:** It is needed by multiple components at different levels of the app.
* **Search term → Lifted state:** It is shared between the search input and catalogue results within the same feature.
* **Selected filter → Lifted state:** It is shared between filter controls and catalogue results within the same feature.
* **Signed-in member → Context:** It can be needed across different parts of the application.
