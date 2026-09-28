import client from "./client";

export function listBooks({ filter = "all", search = "" } = {}) {
  const params = {};

  if (filter !== "all") {
    params.status = filter;
  }

  if (search.trim()) {
    params.q = search.trim();
  }

  return client.get("/books", { params });
}

export function getBook(id) {
  return client.get(`/books/${id}`);
}

export function createBook(book) {
  return client.post("/books", book);
}

export function updateBook(id, book) {
  return client.patch(`/books/${id}`, book);
}

export function removeBook(id) {
  return client.delete(`/books/${id}`);
}
