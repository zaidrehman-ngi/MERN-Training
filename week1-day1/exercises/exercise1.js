const books = ['Dune', 'Neuromancer', 'Snow Crash'];
var emails = [];

for (var i = 0; i < books.length; i++) {
    emails.push(function () {
        return 'Please return ' + books[i];
    });
}

emails.forEach(function (makeEmail) {
    console.log(makeEmail());
});

// Task 3
for (let i = 0; i < books.length; i++) {
    emails.push(function () {
        return 'Please return ' + books[i];
    });
}

emails.forEach(function (makeEmail) {
    console.log(makeEmail());
});

// Task 4
console.log(count);
var count = 5;

// Task 5
console.log(count);
let count = 5;

// Task 6
const rates = { basic: 20 };
rates.gold = 10;
rates = { basic: 25 };

// Task 8
console.log(makeEmail('Dune'));
console.log(makeEmailExpression('Dune'));
console.log(makeEmailArrow('Dune'));

// Task 7
// 1. Function declaration
function makeEmail(book) {
    return 'Please return ' + book;
}

// 2. Function expression
const makeEmailExpression = function (book) {
    return 'Please return ' + book;
};

// 3. Arrow function
const makeEmailArrow = (book) => {
    return 'Please return ' + book;
};

console.log(makeEmail('Dune'));
console.log(makeEmailExpression('Dune'));
console.log(makeEmailArrow('Dune'));
