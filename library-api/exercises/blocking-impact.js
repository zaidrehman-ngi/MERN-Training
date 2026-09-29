const fs = require("fs");

const FILE = "catalogue.csv";

let ticks = 0;

const interval = setInterval(() => {
  ticks++;
  console.log("tick", ticks);
}, 100);

// setTimeout(() => {
//   const ticksBefore = ticks;

//   console.log("Starting synchronous read...");

//   fs.readFileSync(FILE);

//   console.log("Synchronous read finished.");
//   console.log("Ticks before read:", ticksBefore);
//   console.log("Ticks after read:", ticks);
//   console.log("Ticks during read:", ticks - ticksBefore);

//   clearInterval(interval);
// }, 1000);

// setTimeout(() => {
//   const ticksBefore = ticks;

//   console.log("Starting asynchronous read...");

//   fs.readFile(FILE, (error) => {
//     if (error) throw error;

//     console.log("Asynchronous read finished.");
//     console.log("Ticks before read:", ticksBefore);
//     console.log("Ticks after read:", ticks);
//     console.log("Ticks during read:", ticks - ticksBefore);

//     clearInterval(interval);
//   });
// }, 1000);

setTimeout(() => {
  const ticksBefore = ticks;

  console.log("Starting 2-second CPU loop...");

  const start = Date.now();

  while (Date.now() - start < 2000) {
    // Tight CPU loop
    Math.sqrt(Math.random() * 1000000);
  }

  console.log("CPU loop finished.");
  console.log("Ticks before loop:", ticksBefore);
  console.log("Ticks after loop:", ticks);
  console.log("Ticks during loop:", ticks - ticksBefore);

  clearInterval(interval);
}, 1000);
