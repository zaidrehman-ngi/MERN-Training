import fs from "fs";

const data = fs.readFileSync("./exercises/exercise4/sample.txt");

console.log("Buffer:");
console.log(data);

console.log("UTF-8:");
console.log(data.toString("utf8"));

console.log("Hex:");
console.log(data.toString("hex"));

console.log("Base64:");
console.log(data.toString("base64"));

const TOKEN_A =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLTQ0NzEiLCJlbWFpbCI6ImFpc2hhQGxpYi5wayIsInJvbGUiOiJsaWJyYXJpYW4iLCJjbmljIjoiNDIxMDEtMTIzNDU2Ny04IiwicGFzc3dvcmRIYXNoIjoiJDJiJDEwJE45cW84dUxPaWNrZ3gyWk1SWm9NeWUiLCJpYXQiOjE3NzIwMDAwMDAsImV4cCI6MTg5MzQ1NjAwMH0.4dGtNU-VxUFBpKn241fkGlyZUIYpDiKbYx-4lILVss0";

const parts = TOKEN_A.split(".");
const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

console.log("JWT Payload:");
console.log(payload);
