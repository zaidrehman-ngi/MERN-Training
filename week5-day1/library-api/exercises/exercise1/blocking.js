const fs = require("fs");
const fsPromises = require("fs/promises");

const filePath = __filename;

fs.readFileSync(filePath);
console.log("After readFileSync");

fs.readFile(filePath, "utf8", (error, data) => {
  if (error) throw error;
  console.log("Inside readFile callback");
});
console.log("After readFile");

fsPromises
  .readFile(filePath, "utf8")
  .then(() => console.log("Inside promise"))
  .catch((error) => console.error(error));

console.log("End of file");
