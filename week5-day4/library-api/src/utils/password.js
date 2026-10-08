import bcrypt from "bcrypt";
import { timingSafeEqual } from "node:crypto";

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== "string") {
    return false;
  }

  if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }

  const provided = Buffer.from(password);
  const stored = Buffer.from(storedPassword);

  return provided.length === stored.length && timingSafeEqual(provided, stored);
}

export { hashPassword, verifyPassword };
