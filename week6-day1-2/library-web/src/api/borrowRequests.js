import client from "./client";

export function listBorrowRequests() {
  return client.get("/borrow-requests");
}

export function createBorrowRequest(request) {
  return client.post("/borrow-requests", request);
}
