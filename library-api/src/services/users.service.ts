import { hashPassword } from "../utils/password.ts";
import {
  EmailTakenError,
  ForbiddenError,
  NotFoundError,
} from "../errors/domainErrors.js";
import type { UsersRepository } from "../repositories/users.repository.ts";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";
import type {
  Actor,
  MemberChanges,
  MemberQuery,
  MemberRowInput,
  PublicMember,
  Role,
  SignUp,
} from "../types/member.ts";

const isAdmin = (role: Role) => role === "admin" || role === "super admin";

type Events = { emit(eventName: string, payload: unknown): unknown };

const noEvents: Events = { emit: () => false };

const createUsersService = (
  usersRepository: UsersRepository,
  events: Events = noEvents,
) => ({
  list: (query: MemberQuery): Promise<PublicMember[]> =>
    usersRepository.findAll(query),

  async getById(id: string): Promise<PublicMember> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  },

  async getVisible(id: string, viewer: Actor): Promise<PublicMember> {
    if (viewer.role === "user" && viewer.id !== id) {
      throw new ForbiddenError("You can only see your own profile.");
    }
    return this.getById(id);
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

  async update(
    id: string,
    changes: MemberChanges,
    actor: Actor,
  ): Promise<PublicMember> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const self = actor.id === id;
    if (!self && !isAdmin(actor.role)) {
      throw new ForbiddenError("You can only edit your own profile.");
    }
    if (changes.role !== undefined && changes.role !== user.role) {
      if (self) {
        throw new ForbiddenError("You can't change your own role.");
      }
      if (isAdmin(changes.role) && actor.role !== "super admin") {
        throw new ForbiddenError(
          "Only a super admin can make someone an admin.",
        );
      }
    }
    if (!self && isAdmin(user.role) && actor.role !== "super admin") {
      throw new ForbiddenError("Only a super admin can change an admin.");
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
    if (updated.role !== user.role) {
      events.emit(DOMAIN_EVENTS.MEMBER_ACCESS_CHANGED, { memberId: id });
    }
    return updated;
  },

  async delete(id: string, actor: Actor): Promise<void> {
    if (actor.id === id) {
      throw new ForbiddenError("You can't deactivate your own account.");
    }
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    if (isAdmin(user.role) && actor.role !== "super admin") {
      throw new ForbiddenError("Only a super admin can deactivate an admin.");
    }
    const deleted = await usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError("User not found.");
    }
    events.emit(DOMAIN_EVENTS.MEMBER_ACCESS_CHANGED, { memberId: id });
  },
});

export type UsersService = ReturnType<typeof createUsersService>;

export default createUsersService;
