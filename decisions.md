# Exercise 3 - Task 6

## Array Index as a Key

Using the array index as a key is safe when the list is static and its items will never be added, removed, reordered, sorted, or filtered. It is also safest when the rendered items do not contain state or browser-managed DOM state that needs to stay associated with a specific item.

The catalogue list is not one of those cases today. Books can be removed from the list, which changes the indexes and can cause React to reuse a row for a different book.

It will definitely not be safe in Week 4 when sorting and pagination arrive because the position of a book can change even when the book itself has not changed.

Decision: I will use a stable identifier such as `book.id` for catalogue items instead of the array index.