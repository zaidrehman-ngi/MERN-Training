# Exercise 2

## Task 1

`useForm` will receive validation rules through a `validate` function instead of having validation rules built into the Hook.

This keeps `useForm` reusable because it does not need to know about specific fields such as emails, ISBNs, members, or books. Each form can provide its own validation rules while using the same form logic.
