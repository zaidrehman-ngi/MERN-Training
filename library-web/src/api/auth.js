import client from "./client";

export function loginUser(credentials) {
  return client.post("/auth/login", credentials);
}

let refreshing = null;

export function refreshSession() {
  refreshing ??= client.post("/auth/refresh").finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export function logoutUser() {
  return client.post("/auth/logout");
}
