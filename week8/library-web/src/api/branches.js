import client from "./client";

export function listBranches() {
  return client.get("/branches");
}
