Exercise 1 — Task 6

Guess:
I thought `rates.gold = 10` would fail because `rates` is const.

Actual:
The third line failed: `TypeError: Assignment to constant variable.`

Surprised:
const allows us to add or change object properties, but we cannot reassign the variable.

======================================================================================================

Exercise 5 - PART A - Task 1

My Guess:
search start  
search end  
promise 1  
async body  
after await  
timer 0  
timer 10  
promise inside timer  

Actual Output:
search start  
async body  
search end  
promise 1  
after await  
timer 0  
timer 10  
promise inside timer  

My Mistake:
I didn't notice that async body log is normal synchronous code, so it runs immediately. I thought since it has async await so it will run after all the synchornous code.
