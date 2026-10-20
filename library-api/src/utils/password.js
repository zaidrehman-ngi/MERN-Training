import bcrypt from "bcrypt";
import config from "../config/config.js";

async function hashPassword(password) {
  // the cost factor comes from config (BCRYPT_COST), not typed in here
  return bcrypt.hash(password, config.bcryptCost);
}

// Only bcrypt hashes are stored now (the database CHECK makes sure of it),
// so there is no plain-text comparison any more.
async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") {
    return false;
  }

  return bcrypt.compare(password, storedHash);
}

export { hashPassword, verifyPassword };
