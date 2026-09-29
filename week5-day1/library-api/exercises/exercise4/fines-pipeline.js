import fs from "fs";
import { Transform, Writable } from "stream";
import { pipeline } from "stream/promises";

const input = "./catalogue.csv";

let leftover = "";
let rowCount = 0;
let totalFine = 0;
let headers;
let fineIndex;

const parseRows = new Transform({
  readableObjectMode: true,

  transform(chunk, encoding, callback) {
    try {
      const data = leftover + chunk.toString("utf8");
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
        const fine = Number(columns[fineIndex]);

        if (fine > 0) {
          this.push(columns);
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  },

  flush(callback) {
    try {
      if (leftover.trim() && headers) {
        const columns = leftover.trim().split(",");
        const fine = Number(columns[fineIndex]);

        if (fine > 0) {
          this.push(columns);
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  },
});

const collectRows = new Writable({
  objectMode: true,

  write(row, encoding, callback) {
    totalFine += Number(row[fineIndex]);
    rowCount++;
    callback();
  },
});

try {
  await pipeline(fs.createReadStream(input, "utf8"), parseRows, collectRows);

  console.log("Rows with fine:", rowCount);
  console.log("Total fine:", totalFine);
  console.log("Pipeline completed.");
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("Input file not found:", input);
  } else {
    console.error("Pipeline failed:", error.message);
  }
}
