## Exercise 1

### Task 5: Validation and sanitisation

The API validates the shape and constraints of a book title, but it does not
sanitize the title as HTML. A value such as `<script>alert(1)</script>` is a
valid string and may be stored and returned unchanged. It becomes dangerous
when a browser interprets it as markup or executable script.

For the capstone, the React frontend is responsible for safely presenting
untrusted text. Book titles are rendered as React text children, so React
escapes the string instead of interpreting it as HTML. Do not bypass this
protection for untrusted values with `dangerouslySetInnerHTML` or direct DOM
HTML insertion; if rich HTML is ever required, sanitize it before rendering.