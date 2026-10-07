import registerProcessErrorHandlers from "./processErrorHandlers.js";

registerProcessErrorHandlers();

const { default: app } = await import("./app.js");

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
