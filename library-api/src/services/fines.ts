import { daysBetween, todayIn } from "../utils/dates.ts";

export type FineRules = {
  ratePerDay: number;
  maxDays: number;
  timeZone: string;
};

export type FineInput = {
  dueDate: string;
  returnedAt: Date | null;
  asOf: Date;
};

// whole days late on the library's calendar, weekends count, capped at maxDays
export const calculateFine = (input: FineInput, rules: FineRules): number => {
  const endDay = todayIn(rules.timeZone, input.returnedAt ?? input.asOf);
  const daysLate = daysBetween(input.dueDate, endDay);
  if (daysLate <= 0) {
    return 0;
  }
  return Math.min(daysLate, rules.maxDays) * rules.ratePerDay;
};
