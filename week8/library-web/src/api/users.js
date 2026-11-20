import client from "./client";

export function listUsers({ page = 1, search = "", role = "all" } = {}) {
  const params = { page };
  if (search.trim()) params.q = search.trim();
  if (role !== "all") params.role = role;
  return client.get("/users", { params });
}

export function createUser(user) {
  return client.post("/auth/register", user);
}

export function updateUser(id, changes) {
  return client.patch(`/users/${id}`, changes);
}

export function deactivateUser(id) {
  return client.delete(`/users/${id}`);
}
