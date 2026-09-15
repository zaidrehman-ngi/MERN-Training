console.log("search start");

setTimeout(() => console.log("timer 0"), 0);

Promise.resolve().then(() => console.log("promise 1"));

(async () => {
  console.log("async body");
  await null;
  console.log("after await");
})();

setTimeout(() => {
  console.log("timer 10");
  Promise.resolve().then(() => console.log("promise inside timer"));
}, 10);

console.log("search end");


function slowSearch(q) {
  const start = Date.now();
  while (Date.now() - start < 300) {
    /* pretend this is the database */
  }
  return "Result for " + q;
}

console.log("user A searching");
slowSearch("dune");
setTimeout(() => console.log("user B was waiting"), 0);
console.log("user A done");


// PART C - Task 8
const queries = ["dune", "dune", "neuromancer", "dune", "ubik"];

console.time("searches");

for (let i = 0; i < queries.length; i++) {
  slowSearch(queries[i]);
}

console.timeEnd("searches");


// PART C - Task 9
const cache = new Map();

function cachedSearch(q) {
  if (cache.has(q)) {
    return cache.get(q);
  }

  const result = slowSearch(q);
  cache.set(q, result);

  return result;
}

console.time("cached searches");

for (let i = 0; i < queries.length; i++) {
  cachedSearch(queries[i]);
}

console.timeEnd("cached searches");


// PART C - Task 11
console.log("Cache size:", cache.size);


// PART C - Task 12
function modifiedCachedSearch(q) {
  if (cache.has(q)) {
    return cache.get(q);
  }

  const result = slowSearch(q);

  if (cache.size >= 3) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }

  cache.set(q, result);

  console.log("Cache size:", cache.size);

  return result;
}

for (let i = 0; i < queries.length; i++) {
  modifiedCachedSearch(queries[i]);
}
