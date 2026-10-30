import type { Prisma } from "../generated/prisma/client.ts";
import { EmailTakenError, NotFoundError } from "../errors/domainErrors.js";
import translateDbError from "./dbErrors.js";
import type {
  AuthMember,
  MemberQuery,
  MemberRecord,
  MemberRowInput,
  NewMemberRow,
  PublicMember,
  Role,
} from "../types/member.ts";

type Db = Prisma.TransactionClient;

const translateWriteError = (err: unknown) =>
  translateDbError(err, {
    members_active_email_unique: () => new EmailTakenError(),
  });

// The columns a user is allowed to have in a response. password_hash is
// left out on purpose, so it never leaves the database by accident.
const publicSelect = {
  api_id: true,
  name: true,
  email: true,
  role: true,
  joined_on: true,
  branches: { select: { name: true } },
} satisfies Prisma.membersSelect;

const credentialsSelect = {
  ...publicSelect,
  password_hash: true,
} satisfies Prisma.membersSelect;

type PublicMemberRow = Prisma.membersGetPayload<{
  select: typeof publicSelect;
}>;
type CredentialsRow = Prisma.membersGetPayload<{
  select: typeof credentialsSelect;
}>;

const toRole = (value: string): Role => {
  if (value === "user" || value === "librarian" || value === "admin") {
    return value;
  }
  throw new Error(`Unknown role in the database: ${value}`);
};

// Turns a members row into the same user shape the API returned from db.json.
const toUser = (row: PublicMemberRow): PublicMember => ({
  id: row.api_id,
  name: row.name,
  email: row.email,
  role: toRole(row.role),
  branch: row.branches.name,
  joined: row.joined_on ? row.joined_on.toISOString().slice(0, 10) : null,
});

const toRecord = (row: CredentialsRow): MemberRecord => ({
  ...toUser(row),
  passwordHash: row.password_hash,
});

const findBranchId = async (prisma: Db, name: string): Promise<string> => {
  const branch = await prisma.branches.findFirst({ where: { name } });
  // no status code here, the error handler decides that
  if (!branch) {
    throw new NotFoundError("Branch not found.", {
      details: [{ field: "branch", message: "No branch with this name." }],
    });
  }
  return branch.branch_id;
};

// API field names -> column names. The API sends the branch by name.
const toRow = async (
  prisma: Db,
  member: MemberRowInput,
): Promise<Prisma.membersUncheckedUpdateInput> => {
  const row: Prisma.membersUncheckedUpdateInput = {};
  if (member.name !== undefined) row.name = member.name;
  if (member.email !== undefined) row.email = member.email;
  if (member.role !== undefined) row.role = member.role;
  if (member.passwordHash !== undefined)
    row.password_hash = member.passwordHash;
  if (member.joined !== undefined) row.joined_on = new Date(member.joined);
  if (member.branch !== undefined) {
    row.branch_id = await findBranchId(prisma, member.branch);
  }
  return row;
};

const createUsersRepository = (prisma: Db) => ({
  async findAll({ page, limit }: MemberQuery = {}): Promise<PublicMember[]> {
    const rows = await prisma.members.findMany({
      where: { is_active: true },
      select: publicSelect,
      orderBy: { api_id: "asc" },
      // no page given: the whole list, like before
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });
    return rows.map(toUser);
  },

  async findById(id: string): Promise<PublicMember | null> {
    const row = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: publicSelect,
    });
    return row ? toUser(row) : null;
  },

  async findByEmail(email: string): Promise<PublicMember | null> {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true },
      select: publicSelect,
    });
    return row ? toUser(row) : null;
  },

  // For requireAuth on every protected request: one small query, only what
  // the auth checks need.
  async findForAuth(id: string): Promise<AuthMember | null> {
    const row = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: { api_id: true, name: true, role: true },
    });
    return row
      ? { id: row.api_id, name: row.name, role: toRole(row.role) }
      : null;
  },

  // Only for logging in: the one place the password hash is read.
  async findCredentialsByEmail(email: string): Promise<MemberRecord | null> {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true },
      select: credentialsSelect,
    });
    return row ? toRecord(row) : null;
  },

  async create(member: NewMemberRow): Promise<PublicMember> {
    const data: Prisma.membersUncheckedCreateInput = {
      name: member.name,
      email: member.email,
      role: member.role,
      password_hash: member.passwordHash,
      joined_on: new Date(member.joined),
      branch_id: await findBranchId(prisma, member.branch),
    };
    try {
      const row = await prisma.members.create({ data, select: publicSelect });
      return toUser(row);
    } catch (err) {
      throw translateWriteError(err);
    }
  },

  async updateById(
    id: string,
    changes: MemberRowInput,
  ): Promise<PublicMember | null> {
    const existing = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: { member_id: true },
    });
    if (!existing) {
      return null;
    }

    const data = await toRow(prisma, changes);
    try {
      const row = await prisma.members.update({
        where: { member_id: existing.member_id },
        data,
        select: publicSelect,
      });
      return toUser(row);
    } catch (err) {
      throw translateWriteError(err);
    }
  },

  // Soft delete, like on Tuesday: members with loans or requests can't be
  // removed from the table, so they are marked inactive instead.
  async deleteById(id: string): Promise<boolean> {
    const result = await prisma.members.updateMany({
      where: { api_id: id, is_active: true },
      data: { is_active: false },
    });
    return result.count > 0;
  },
});

export type UsersRepository = ReturnType<typeof createUsersRepository>;

export default createUsersRepository;
