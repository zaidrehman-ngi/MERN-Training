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


# Exercise 2

### Task 1

**Actual output order:**

1. `1 start`
2. `10 end`
3. `5 nextTick`
4. `4 promise`
5. `2 timeout`
6. `3 immediate`
7. `6 read done`
8. `9 nextTick in read`
9. `8 immediate in read`
10. `7 timeout in read`

**Result:** 8 out of 10 lines were correct.

The surprising pair was `8 immediate in read` and `7 timeout in read`. I expected the timeout to run first, but inside the `fs.readFile` callback, `setImmediate` runs in the check phase, which comes after the poll phase where the file-read callback runs. The top-level `setTimeout(0)` and `setImmediate()` order is not guaranteed, while inside an I/O callback, `setImmediate()` runs before the timer in this situation.


### Task 2

**Order difference:**

* `5 nextTick` and `4 promise`
* In Node, `process.nextTick()` runs before Promise microtasks. The browser does not have the `process.nextTick()` queue, so this Node-specific priority does not exist there.

**Node-specific APIs:**

* `setImmediate()` — Node adds this to schedule callbacks in the event loop's check phase. It is not available in the browser.
* `process.nextTick()` — Node adds this higher-priority queue for scheduling callbacks before Promise microtasks.

These Node-specific mechanisms are why the execution order can differ between Node and the browser.


### Task 3

**Experiment 1 — Top level:**

| Result                | Runs |
| --------------------- | ---: |
| `immediate → timeout` |    9 |
| `timeout → immediate` |    1 |

The order was not consistent because at the top level, the event loop may reach the timers phase before the check phase or vice versa.

**Experiment 2 — Inside `fs.readFile` callback:**

| Result                | Runs |
| --------------------- | ---: |
| `immediate → timeout` |   10 |
| `timeout → immediate` |    0 |

The order was consistent inside the I/O callback because the callback runs during the poll phase. After the poll phase, Node moves to the check phase where `setImmediate()` runs before the next timers phase. Therefore, `setImmediate()` runs before `setTimeout(..., 0)` in this situation.


### Task 4

A recursive `process.nextTick()` kept scheduling another `nextTick`, so the `setTimeout` callback never arrived while the recursion continued. The `nextTick` queue kept being processed before the event loop could move on.

With recursive `setImmediate()`, the `setTimeout` callback was able to run between the recursive callbacks, so it did not get starved.

**When to use `nextTick`:** Only when a callback needs to run immediately after the current operation and before the event loop continues; it is "almost never" needed because excessive use can starve the event loop.


### Task 5

### Node.js Event Loop Phases

1. **Timers** — Runs callbacks scheduled by `setTimeout()` and `setInterval()`.
2. **Pending Callbacks** — Runs certain system-level callbacks that were deferred from the previous cycle.
3. **Idle, Prepare** — Internal Node.js operations used to prepare for the next event loop cycle.
4. **Poll** — Retrieves new I/O events and runs their callbacks.
5. **Check** — Runs callbacks scheduled by `setImmediate()`.
6. **Close Callbacks** — Runs close-event callbacks, such as `socket.on("close")`.

**`process.nextTick()` and Promises:** These are **not event loop phases**. Their queues are drained between event loop phases, after the current operation finishes. `process.nextTick()` is processed before Promise microtasks.

**Simplified order:**

```text
Current operation
      ↓
nextTick queue
      ↓
Promise microtask queue
      ↓
Timers
      ↓
Pending Callbacks
      ↓
Idle, Prepare
      ↓
Poll
      ↓
Check
      ↓
Close Callbacks
      ↓
(next event loop cycle)
```

This explains why recursive `nextTick()` can starve the event loop and why `setImmediate()` runs in the Check phase.


# Exercise 3

### Task 2

**`__dirname` difference:**

In CommonJS (`.cjs`), `__dirname` is available directly:

```js
console.log(__dirname);
```

In ES Modules (`.mjs`), `__dirname` is not available directly. The standard replacement is:

```js
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**Top-level `await`:**

Top-level `await` works in ES Modules (`.mjs`) but not in CommonJS (`.cjs`). ES Modules support top-level `await` because the module system can wait for asynchronous module evaluation, while CommonJS does not support it.


### Task 3

**Result:**

* The top-level `console.log()` appeared **1 time**.
* All three files received the **same object reference**, not separate copies.
* The `count` changed from `1` to `2` to `3`, proving that each file was using the same object.

This behaviour is called **CommonJS module caching**. Node loads a required module once and caches its exported value for later `require()` calls.

**Useful for:** Sharing a single module instance or state across different files and avoiding repeated module initialization.

**Possible bug:** If one file mutates the cached exported object, other files can unexpectedly see the changed state.


### Task 4

With `"type": "module"` in `package.json`, the `.cjs` CommonJS file still ran successfully because the `.cjs` extension explicitly marks the file as CommonJS.

**Module system rules:**

* `.mjs` → always treated as an ES Module.
* `.cjs` → always treated as CommonJS.
* `.js` → follows the nearest `package.json` `"type"` field. With `"type": "module"`, it is treated as an ES Module; with `"type": "commonjs"`, it is treated as CommonJS.

**Interop:**

In Node.js v24.20.0, both directions worked in my tests:

* CommonJS `require()` → ESM `.mjs` worked successfully.
* ES Module `import` → CommonJS `.cjs` worked successfully.

The original task expected an interop error, but the current Node.js version supports synchronous `require()` of compatible ES Modules, so no error occurred in this environment.


# Exercise 4

### Task 1

A **Buffer** stores raw binary data as bytes. Node.js needs Buffers because files, network data, and streams contain binary data, while JavaScript strings are mainly used to represent text.

The small file was read as a Buffer first, then the same bytes were represented as UTF-8, hexadecimal, and Base64.

The JWT payload can also be decoded using a Buffer instead of `atob()`. `Buffer.from(parts[1], "base64url")` decodes the JWT payload bytes, and `.toString("utf8")` converts those bytes into text before parsing the JSON.

**Base64url** is a URL-safe form of Base64. It replaces `+` with `-`, `/` with `_`, and removes the `=` padding. JWT uses Base64url so its encoded parts can safely be used in URLs and other contexts where those Base64 characters can cause problems.


### Task 2

**Naive approach (`readFileSync`):**

| Measurement |     Result |
| ----------- | ---------: |
| Total fine  |  260693280 |
| Row count   |    3949908 |
| Wall time   | 3000.22 ms |
| RSS memory  |  521.88 MB |

The CSV was read completely into memory using `readFileSync`, then split into lines and processed to calculate the total fine and row count.


### Task 3

**Streaming approach (`createReadStream`):**

| Measurement | Result |
|---|---:|
| Total fine | 260693280 |
| Row count | 3949908 |
| Wall time | 2539.28 ms |
| RSS memory | 68.43 MB |

The streaming version produced the same total fine and row count as the naive version. It uses much less memory because the CSV is processed in chunks instead of loading the entire file into memory.


### Task 4

At approximately 600 MB, the naive approach failed while the streaming approach completed successfully.

**200 MB results:**

| Approach  |  Wall time | RSS memory |
| --------- | ---------: | ---------: |
| Naive     | 3000.22 ms |  521.88 MB |
| Streaming | 2539.28 ms |   68.43 MB |

**600 MB streaming results:**

| Approach  |  Wall time | RSS memory |
| --------- | ---------: | ---------: |
| Naive     |     Failed |     Failed |
| Streaming | 7770.39 ms |   69.89 MB |

The naive approach failed with:

```text
Error: Cannot create a string longer than 0x1fffffe8 characters
code: 'ERR_STRING_TOO_LONG'
```

The limit reached was Node.js's maximum string length. `readFileSync(..., "utf8")` tries to load the entire 600 MB file into one JavaScript string, which exceeds that limit.

The streaming approach still completed because it processes the file in chunks instead of creating one huge string.

This shows that streaming is not just an optimisation for lower memory usage; it is necessary when the input can exceed the limits of the naive approach.


### Task 5

The pipeline processed the CSV through a `Transform` that parsed the rows and passed on only rows with a fine.

**Result:**

| Measurement    |    Result |
| -------------- | --------: |
| Rows with fine |   2354967 |
| Total fine     | 777138660 |

The pipeline completed successfully and produced the expected total fine.

The pipeline was also interrupted successfully using `Ctrl+C`.

When the input file was missing, it was handled cleanly with:

```text
Input file not found: ./catalogue.csv
```

`pipeline()` provides centralized error propagation across the whole stream chain. If one stream fails, the pipeline rejects and the failure can be handled in one `catch` block. With a chain of `.pipe()` calls, errors from individual streams are not automatically handled end-to-end, so error listeners and cleanup may need to be managed separately.


### Task 6

`stream.write()` returns `false` when the internal buffer is full. Without checking it, the producer could keep writing faster than the file stream can handle, causing data to build up in memory and potentially causing an out-of-memory error.

This mechanism is called **backpressure**. It solves the **fast producer / slow writer** problem.

The `pipeline()` in Task 5 handles backpressure automatically between the connected streams, so the upstream stream does not keep pushing data when the downstream stream cannot keep up.
