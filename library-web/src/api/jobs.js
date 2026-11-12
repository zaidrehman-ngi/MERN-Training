import client from "./client";

export function runDueReminders() {
  return client.post("/jobs/due-reminders/run");
}
