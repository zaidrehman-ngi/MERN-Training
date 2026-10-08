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


## Exercise 2

### Task 5: Fatal process errors

Keeping the process alive after an unhandled rejection or uncaught exception
avoids an immediate outage, but the application may be left in an inconsistent
state and continue serving bad responses. Letting it exit causes a short
interruption, but avoids trusting a process that may be corrupted.

We choose to log the full error and exit with a failure status. This is safe
only when deployment monitors process health, restarts failed instances, and
routes traffic to other healthy instances during restart. A single-instance
deployment without automatic restart and health-aware traffic routing would
not meet that condition.