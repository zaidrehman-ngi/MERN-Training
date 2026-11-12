import client, { refreshSession } from "./client";

export { refreshSession };

export function loginUser(credentials) {
  return client.post("/auth/login", credentials);
}

export function logoutUser() {
  return client.post("/auth/logout");
}
