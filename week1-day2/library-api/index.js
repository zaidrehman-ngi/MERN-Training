console.log('Library API is running');

const name = process.argv[2];
console.log(`Hello, ${name}!`);

const book = { title: 'Dune', author: 'Frank Herbert', year: 1965 };
function show(b) {
  return b.title + ' by ' + b.author;
}
console.log(show(book));
