import bcrypt from "bcrypt";
import config from "../config/config.ts";

const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, config.bcryptCost);

const verifyPassword = async (
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> => {
  if (typeof storedHash !== "string") {
    return false;
  }
  return bcrypt.compare(password, storedHash);
};

export { hashPassword, verifyPassword };
