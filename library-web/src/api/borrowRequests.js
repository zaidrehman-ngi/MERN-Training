import client from "./client";

export function listBorrowRequests({
  page = 1,
  search = "",
  status = "all",
} = {}) {
  const params = { page };
  if (search.trim()) params.q = search.trim();
  if (status !== "all") params.status = status;
  return client.get("/borrow-requests", { params });
}

export function createBorrowRequest(request) {
  return client.post("/borrow-requests", request);
}
