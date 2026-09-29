const fs = require("fs");

console.log("1 start");

setTimeout(() => console.log("2 timeout"), 0);
setImmediate(() => console.log("3 immediate"));

Promise.resolve().then(() => console.log("4 promise"));
process.nextTick(() => console.log("5 nextTick"));

fs.readFile(__filename, () => {
  console.log("6 read done");
  setTimeout(() => console.log("7 timeout in read"), 0);
  setImmediate(() => console.log("8 immediate in read"));
  process.nextTick(() => console.log("9 nextTick in read"));
});

console.log("10 end");
