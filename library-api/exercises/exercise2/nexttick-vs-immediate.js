let count = 0;

function recursiveNextTick() {
  process.nextTick(() => {
    count++;

    if (count <= 10) {
      console.log("nextTick", count);
      recursiveNextTick();
    }
  });
}

recursiveNextTick();

// function recursiveImmediate() {
//   setImmediate(() => {
//     count++;
//     console.log("immediate", count);
//     recursiveImmediate();
//   });
// }

// recursiveImmediate();

// function recursiveImmediate() {
//   setImmediate(() => {
//     count++;

//     if (count <= 10) {
//       console.log("immediate", count);
//       recursiveImmediate();
//     }
//   });
// }

// recursiveImmediate();

setTimeout(() => {
  console.log("TIMEOUT ARRIVED");
}, 0);
