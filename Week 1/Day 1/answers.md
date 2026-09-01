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

