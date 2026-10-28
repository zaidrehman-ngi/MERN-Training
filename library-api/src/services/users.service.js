import { hashPassword } from "../utils/password.js";
import { EmailTakenError, NotFoundError } from "../errors/domainErrors.js";

const createUsersService = (usersRepository) => ({
  list: (query) => usersRepository.findAll(query),

  async getById(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  },

  // Registration. It doesn't say if the email is already taken (see
  // decisions.md, Exercise 7 Task 4): the caller gets the same answer either
  // way, so nobody can use this to find out who has an account.
  async create(userData) {
    // hash first, so a taken email takes as long as a new one
    const passwordHash = await hashPassword(userData.password);

    const existingUser = await usersRepository.findByEmail(userData.email);
    if (existingUser) {
      return null;
    }

    try {
      return await usersRepository.create({
        ...userData,
        password: passwordHash,
        role: "user",
      });
    } catch (err) {
      // two sign-ups with the same email at once: same answer as above
      if (err instanceof EmailTakenError) {
        return null;
      }
      throw err;
    }
  },

  async update(id, changes) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (changes.email !== undefined) {
      const duplicate = await usersRepository.findByEmail(changes.email);
      if (duplicate && duplicate.id !== id) {
        throw new EmailTakenError();
      }
    }

    const updates = { ...changes };
    if (updates.password !== undefined) {
      updates.password = await hashPassword(updates.password);
    }

    return usersRepository.updateById(id, updates);
  },

  async delete(id) {
    const deleted = await usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError("User not found.");
    }
  },
});

export default createUsersService;
