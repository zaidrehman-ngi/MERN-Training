import client from "./client";

export function listBorrowRequests() {
  return client.get("/borrowRequests");
}
