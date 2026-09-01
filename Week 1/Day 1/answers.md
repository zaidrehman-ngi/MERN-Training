Exercise 1 - Task 1
Please return undefined
Please return undefined
Please return undefined

Exercise 1 - Task 2
The loop runs first and stores the functions in the emails array without executing them. The functions are executed later when forEach runs. By that time, i has become 3, so books[3] is undefined. That's why all three emails print undefined.

Exercise 1 - Task 3
Change var to let. With let, each loop iteration has its own value of `i`, so each function gets the correct book.

Exercise 1 - Task 4
undefined because var is hoisted, but the value is assigned after the console.log()

Exercise 1 - Task 5
The error is `ReferenceError: Cannot access 'count' before initialization`.

I prefer `let` because it shows the mistake immediately instead of silently giving `undefined`. This makes errors easier to find and fix.

Exercise 1 - Task 8
The function declaration works because its definition is hoisted. The const function expression and arrow function are in the Temporal Dead Zone (TDZ) because of assigning them to a const variable, so they cannot be accessed before they are initialized.

=============================================================================================================

Exercise 2 - Task 5
It is correct, not a bug. Hyperion was damaged, so `break` stopped the whole loop before Ubik could be processed.

Exericse 2 - Task 6
I think if / else if reads better here because there are only a few conditions. Switch is better when there are many possible values to check.

=============================================================================================================

Exercise 4 - Task 2
The checkout took 855.551ms.

Exercise 4 - Task 4
The .then() version was harder because we had to keep nesting callbacks to use the member variable. With async/await, we can define member once and use it easily in the next lines.

Exercise 4 - Task 5
The checkout took 431.781ms.

Exercise 4 - Task 6
No, the loans call needs member.id, and we only get member.id after the member call finishes. So they cannot run at the same time.

Exercise 4 - Task 7
Node prints 'Error: members: m-404 not found'. The promise is rejected and there is no try/catch to handle it, so the process stops.

Exercise 4 - Task 9
The reason is that we are directly returning the result without await, so I think the Promise is not being returned. That means it will not resolve or reject, and since there is no Promise to reject, the catch block will never run.

=============================================================================================================

Exercise 5 - PART A - Task 2
search start — sync
timer 0 — timer
promise 1 — promise
async body — sync
after await — promise
timer 10 — timer
promise inside timer — promise
search end — sync

Exercise 5 - PART A - Task 3
timer 0 is a timer, so it goes to the macrotask queue. The event loop first runs synchronous code, then promise callbacks (microtasks), and then timer callbacks. That's why timer 0 doesn't run second.

Exercise 5 - PART A - Task 4
after await ran after search end.

This tells us that await pauses the async function and continues the code after await later as a promise callback. It does not block the whole program.

Exercise 5 - PART A - Task 5
normal code runs first, then promise callbacks run, then timer callbacks run.

Exercise 5 - PART B - Task 6
User B's timer was stuck for about 300ms because slowSearch blocked the main thread for 300ms.

Exercise 5 - PART B - Task 7
While the loop is running, the main thread is blocked, so every other user's JavaScript work has to wait until the loop finishes.

Exercise 5 - PART C - Task 8
The five searches took 1.499s in total.

Exercise 5 - PART C - Task 10
3 unique queries.
Expected time: about 900ms.
Actual time: 899.624ms.
The timing matches because only the 3 unique queries called slowSearch.

Exercise 5 - PART C - Task 11
If there are 100,000 different searches, the Map will keep growing and use more memory. Eventually, the server may run out of memory, causing performance issues or a crash.
