# Week 7

# Exercise 2 — The handshake

## Task 4: An event nobody is listening for

My guess is that nothing will happen at all, no error on the server and no
error in the browser. The server just sends the event, it doesn't know or
care if anyone on the other side is listening for that name, and the
browser just won't have a handler for it, so it will be silent.

After building it: I was right. Nothing happened anywhere.

# Exercise 3 — Who is actually connected

## Task 2: When does disconnect fire?

1. Closing the tab: disconnect fires.
2. Navigating to another page: disconnect doesn't fire.
3. Pulling the cable or turning off Wi-Fi: disconnect fires.
4. Putting the laptop to sleep: disconnect fires.

I didn't guess how long each one takes.

After testing: I was half right. Navigating away did fire, but only after
about 43 seconds, not straight away. Network loss and sleep fired too, but
also only after about 43 seconds.

# Exercise 4 — Everybody got everybody's message

## Task 4: Does the sender get its own reply?

If the server replies to everyone with `io.emit`, I think the original
sender will get its own reply as well. If it used `socket.broadcast.emit`
instead, the sender wouldn't get it. (I wasn't sure which of the two the
question meant, but "to everyone" sounds like `io.emit`.)

After testing: right. With `io.emit` the sender got its own reply, with
`socket.broadcast.emit` it didn't.
