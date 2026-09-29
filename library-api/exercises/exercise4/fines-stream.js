import fs from "fs";

const start = performance.now();

let leftover = "";
let totalFine = 0;
let rowCount = 0;
let headers;
let fineIndex;

const stream = fs.createReadStream("./catalogue.csv", "utf8");

stream.on("data", (chunk) => {
  const data = leftover + chunk;
  const lines = data.split("\n");

  leftover = lines.pop();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (!headers) {
      headers = line.split(",");
      fineIndex = headers.indexOf("fine_rs");
      continue;
    }

    const columns = line.split(",");

    totalFine += Number(columns[fineIndex]);
    rowCount++;
  }
});

stream.on("end", () => {
  if (leftover.trim()) {
    const columns = leftover.trim().split(",");

    totalFine += Number(columns[fineIndex]);
    rowCount++;
  }

  const end = performance.now();

  console.log("Total fine:", totalFine);
  console.log("Row count:", rowCount);
  console.log("Wall time:", (end - start).toFixed(2), "ms");
  console.log(
    "RSS:",
    (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
    "MB",
  );
});
