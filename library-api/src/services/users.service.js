import { hashPassword } from "../utils/password.js";
import { ConflictError, NotFoundError } from "../errors/domainErrors.js";

const createUsersService = (usersRepository) => ({
  async list() {
    return usersRepository.findAll();
  },

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

    return usersRepository.create({
      ...userData,
      password: passwordHash,
      role: "user",
    });
  },

  async update(id, changes) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (changes.email !== undefined) {
      const duplicate = await usersRepository.findByEmailExcludingId(
        changes.email,
        id,
      );
      if (duplicate) {
        throw new ConflictError("A user with this email already exists.", {
          details: [{ field: "email", message: "Email must be unique." }],
        });
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
