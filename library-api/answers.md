# Exercise 1

## Task 1

### Node REPL

* `__dirname` → `ReferenceError` in the Node REPL
* `__filename` → `ReferenceError` in the Node REPL
* `process.version` → `v24.20.0`
* `window` → `ReferenceError: window is not defined`
* `document` → `ReferenceError: document is not defined`

### Browser vs Node

**Browser gives you that Node does not:**

* `window`
* `document` and DOM APIs
* `localStorage`
* Browser events such as `click` and `keydown`

**Node gives you that the browser does not:**

* `process`
* File system access through `fs`
* `__dirname` and `__filename` in CommonJS modules
* Node's module and server-side APIs


### Task 2

**Actual output order:**

1. After readFileSync
2. After readFile
3. End of file
4. Inside readFile callback
5. Inside promise

The synchronous read completed first, while the async reads continued in the background. I expected the Promise handler to run first because Promises use microtasks, but the Promise had to wait for its file read to complete first. In this run, the `fs.readFile` operation completed first.

**What I learned:** A Promise being a microtask does not mean its underlying I/O will finish first.


### Task 3

| Read method       | Ticks during read |
| ----------------- | ----------------: |
| `fs.readFileSync` |                 0 |
| `fs.readFile`     |                 1 |

The synchronous read blocked the event loop, so no ticks could run while the file was being read. The asynchronous read allowed the event loop to continue, so 1 tick ran while the file read was in progress.


### Task 4

**Result:**

* Ticks before CPU loop: 9
* Ticks after CPU loop: 9
* Ticks during CPU loop: 0

Switching from `fs.readFileSync` to `fs.readFile` fixes the blocking I/O problem because asynchronous file I/O can run outside the main JavaScript thread. It does not fix a CPU-heavy loop because the arithmetic is running directly on the main JavaScript thread and keeps the event loop busy. For CPU-bound work, Node provides **Worker Threads** and **Child Processes**, which allow the work to run separately from the main thread.


### Task 5

Node runs our JavaScript code on a single main thread, where the event loop handles callbacks and other JavaScript work. Some operations, such as file system I/O, are handled outside the main thread, including through Node's thread pool, so the event loop can continue running while the I/O is in progress. In Task 3, the asynchronous file read allowed ticks to continue because the main thread was not blocked waiting for the file. In Task 4, the CPU-heavy arithmetic ran on the main thread itself, so it blocked the event loop and no ticks could run.
