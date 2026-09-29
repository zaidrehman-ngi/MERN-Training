import fs from "fs";

const start = performance.now();

const data = fs.readFileSync("./catalogue.csv", "utf8");

const lines = data.trim().split("\n");

const headers = lines[0].split(",");

const fineIndex = headers.indexOf("fine_rs");

let totalFine = 0;
let rowCount = 0;

for (let i = 1; i < lines.length; i++) {
  const columns = lines[i].split(",");

  totalFine += Number(columns[fineIndex]);
  rowCount++;
}

const end = performance.now();

console.log("Total fine:", totalFine);
console.log("Row count:", rowCount);
console.log("Wall time:", (end - start).toFixed(2), "ms");
console.log("RSS:", (process.memoryUsage().rss / 1024 / 1024).toFixed(2), "MB");
