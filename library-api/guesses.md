## Exercise 1 — Task 2

### Guessed Output Order

1. After readFileSync
2. After readFile
3. End of file
4. Inside promise
5. Inside readFile callback


## Exercise 2 — Task 1

### Guessed Output Order

1. `1 start`
2. `10 end`
3. `5 nextTick`
4. `4 promise`
5. `2 timeout`
6. `3 immediate`
7. `6 read done`
8. `9 nextTick in read`
9. `7 timeout in read`
10. `8 immediate in read`


## Exercise 3 - Task 3

**Guessed result:**

* Top-level `console.log()` will appear: **1 time**
* The three files will receive: **three separate copies**

**Reason:**
I think Node will run the required module once, but each file will get its own copy of the exported object.
