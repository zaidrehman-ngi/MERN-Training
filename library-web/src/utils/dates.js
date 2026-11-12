const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// "2026-11-12" is a library day, so it is shown as is, never shifted
export function formatDay(value) {
  if (!value) {
    return "-";
  }
  return dayFormat.format(new Date(`${value}T00:00:00Z`));
}
