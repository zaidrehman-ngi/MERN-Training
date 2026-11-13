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

export function decideBorrowRequest(id, status) {
  return client.patch(`/borrow-requests/${id}`, { status });
}

export function cancelBorrowRequest(id) {
  return client.post(`/borrow-requests/${id}/cancel`);
}

export function returnBorrowRequest(id) {
  return client.post(`/borrow-requests/${id}/return`);
}

export function changeDueDate(id, dueDate) {
  return client.patch(`/borrow-requests/${id}`, { dueDate });
}

export function waiveFine(id) {
  return client.post(`/borrow-requests/${id}/waive-fine`);
}
