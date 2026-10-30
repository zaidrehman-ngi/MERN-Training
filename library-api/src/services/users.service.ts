import { hashPassword } from "../utils/password.js";
import { EmailTakenError, NotFoundError } from "../errors/domainErrors.js";
import type { UsersRepository } from "../repositories/users.repository.ts";
import type {
  MemberChanges,
  MemberQuery,
  MemberRowInput,
  PublicMember,
  SignUp,
} from "../types/member.ts";

const createUsersService = (usersRepository: UsersRepository) => ({
  list: (query: MemberQuery): Promise<PublicMember[]> =>
    usersRepository.findAll(query),

  async getById(id: string): Promise<PublicMember> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  },

  // Registration. It doesn't say if the email is already taken (see
  // decisions.md, Exercise 7 Task 4): the caller gets the same answer either
  // way, so nobody can use this to find out who has an account.
  async create(signUp: SignUp): Promise<PublicMember | null> {
    // hash first, so a taken email takes as long as a new one
    const passwordHash = await hashPassword(signUp.password);

    const existingUser = await usersRepository.findByEmail(signUp.email);
    if (existingUser) {
      return null;
    }

    try {
      return await usersRepository.create({
        name: signUp.name,
        email: signUp.email,
        branch: signUp.branch,
        joined: signUp.joined,
        role: "user",
        passwordHash,
      });
    } catch (err) {
      // two sign-ups with the same email at once: same answer as above
      if (err instanceof EmailTakenError) {
        return null;
      }
      throw err;
    }
  },

  async update(id: string, changes: MemberChanges): Promise<PublicMember> {
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

    const { password, ...rest } = changes;
    const updates: MemberRowInput =
      password === undefined
        ? rest
        : { ...rest, passwordHash: await hashPassword(password) };

    const updated = await usersRepository.updateById(id, updates);
    if (!updated) {
      throw new NotFoundError("User not found.");
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError("User not found.");
    }
  },
});

export type UsersService = ReturnType<typeof createUsersService>;

export default createUsersService;
