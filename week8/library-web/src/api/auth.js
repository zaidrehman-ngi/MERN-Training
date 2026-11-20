import client, { authRequest, refreshSession } from "./client";

export { refreshSession };

export function loginUser(credentials) {
  return client.post("/auth/login", credentials, authRequest);
}

export function logoutUser() {
  return client.post("/auth/logout", undefined, authRequest);
}
