import http from "http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/books") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    res.end(
      JSON.stringify({
        data: [
          { id: "bk-1", title: "Dune" },
          { id: "bk-2", title: "Neuromancer" },
        ],
      }),
    );

    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");

  res.end(
    JSON.stringify({
      error: "NOT_FOUND",
      message: "Route not found.",
      details: [],
    }),
  );
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
