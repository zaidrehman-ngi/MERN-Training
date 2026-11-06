import client from "./client";

export function listUsers() {
  return client.get("/users");
}

export function createUser(user) {
  return client.post("/auth/register", user);
}
