import client from "./client";

export function listBorrowRequests() {
  return client.get("/borrowRequests");
}

export function createBorrowRequest(request) {
  return client.post("/borrowRequests", request);
}
