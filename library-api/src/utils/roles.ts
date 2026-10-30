import type { Role } from "../types/member.ts";

export const homePageFor = (role: Role): string => {
  switch (role) {
    case "user":
      return "/books";
    case "librarian":
      return "/borrow-requests";
    case "admin":
      return "/users";
    default: {
      const unhandled: never = role;
      throw new Error(`No home page for role: ${unhandled}`);
    }
  }
};
