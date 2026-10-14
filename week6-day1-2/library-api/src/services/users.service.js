import { hashPassword } from "../utils/password.js";
import { conflict, notFound } from "../errors/ApiError.js";

const createUsersService = (usersRepository) => ({
  async list() {
    return usersRepository.findAll();
  },

  async getById(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw notFound("User not found.");
    }
    return user;
  },

  async create(userData) {
    const existingUser = await usersRepository.findByEmail(userData.email);
    if (existingUser) {
      throw conflict("A user with this email already exists.", [
        {
          field: "email",
          message: "Email must be unique.",
        },
      ]);
    }

    return usersRepository.create({
      ...userData,
      password: await hashPassword(userData.password),
      role: "user",
    });
  },

  async update(id, changes) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw notFound("User not found.");
    }

    if (changes.email !== undefined) {
      const duplicate = await usersRepository.findByEmailExcludingId(
        changes.email,
        id,
      );
      if (duplicate) {
        throw conflict("A user with this email already exists.", [
          {
            field: "email",
            message: "Email must be unique.",
          },
        ]);
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
      throw notFound("User not found.");
    }
  },
});

export default createUsersService;
