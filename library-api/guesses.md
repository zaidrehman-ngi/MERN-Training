# Week 7

# Exercise 2 — The handshake

## Task 4: An event nobody is listening for

My guess is that nothing will happen at all, no error on the server and no
error in the browser. The server just sends the event, it doesn't know or
care if anyone on the other side is listening for that name, and the
browser just won't have a handler for it, so it will be silent.

After building it: I was right. Nothing happened anywhere.
