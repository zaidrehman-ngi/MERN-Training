import express from "express";

const app = express();

app.get("/books", (req, res) => {
  res.status(200).json({
    data: [
      { id: "bk-1", title: "Dune" },
      { id: "bk-2", title: "Neuromancer" },
    ],
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found.",
    details: [],
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
