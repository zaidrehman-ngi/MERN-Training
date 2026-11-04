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

// The fine is counted in whole days on the library's calendar (Karachi),
// the same way "due on the 14th" is defined in decisions.md:
// - The due day itself doesn't count. Due on the 14th means it can come
//   back any time on the 14th for nothing.
// - Weekends count. The rule is "per day late", and the book is out on
//   Saturday and Sunday the same as any other day.
// - There is a maximum: maxDays worth of the rate (30 days by default), so
//   a lost book doesn't keep growing a fine forever.
// - Two hours late is a day late. Any time on the 15th is the first late
//   day, so 00:01 on the 15th and 23:59 on the 15th are both 1 day.
// - Not returned yet: counted up to asOf, so the caller can ask "what does
//   it come to today" without this function reading the clock.
export const calculateFine = (input: FineInput, rules: FineRules): number => {
  const endDay = todayIn(rules.timeZone, input.returnedAt ?? input.asOf);
  const daysLate = daysBetween(input.dueDate, endDay);
  if (daysLate <= 0) {
    return 0;
  }
  return Math.min(daysLate, rules.maxDays) * rules.ratePerDay;
};
