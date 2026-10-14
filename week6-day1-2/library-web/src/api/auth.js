import client from "./client";

export function loginUser(credentials) {
  return client.post("/auth/login", credentials);
}
