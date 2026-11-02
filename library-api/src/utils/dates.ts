export const todayIn = (timeZone: string, now: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);

export const addDays = (date: string, days: number): string => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};
