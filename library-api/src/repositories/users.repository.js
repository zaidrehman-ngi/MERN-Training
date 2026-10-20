import { ApiError } from "../errors/ApiError.js";

// The columns a user is allowed to have in a response. password_hash is
// left out on purpose, so it never leaves the database by accident.
const publicSelect = {
  api_id: true,
  name: true,
  email: true,
  role: true,
  joined_on: true,
  branches: { select: { name: true } },
};

// Turns a members row into the same user shape the API returned from db.json.
const toUser = (row) => ({
  id: row.api_id,
  name: row.name,
  email: row.email,
  role: row.role,
  branch: row.branches.name,
  joined: row.joined_on ? row.joined_on.toISOString().slice(0, 10) : null,
});

// API field names -> column names. The API sends the branch by name.
const toRow = async (prisma, user) => {
  const row = {
    name: user.name,
    email: user.email,
    role: user.role,
    password_hash: user.password,
    joined_on: user.joined ? new Date(user.joined) : undefined,
  };

  if (user.branch !== undefined) {
    const branch = await prisma.branches.findFirst({
      where: { name: user.branch },
    });
    if (!branch) {
      throw new ApiError("Branch not found.", 422, {
        code: "VALIDATION_ERROR",
        details: [{ field: "branch", message: "No branch with this name." }],
      });
    }
    row.branch_id = branch.branch_id;
  }

  return row;
};

const createUsersRepository = (prisma) => ({
  async findAll() {
    const rows = await prisma.members.findMany({
      where: { is_active: true },
      select: publicSelect,
      orderBy: { api_id: "asc" },
    });
    return rows.map(toUser);
  },

  async findById(id) {
    const row = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: publicSelect,
    });
    return row ? toUser(row) : null;
  },

  async findByEmail(email) {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true },
      select: publicSelect,
    });
    return row ? toUser(row) : null;
  },

  // For requireAuth on every protected request: one small query, only what
  // the auth checks need.
  async findForAuth(id) {
    const row = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: { api_id: true, name: true, role: true },
    });
    return row ? { id: row.api_id, name: row.name, role: row.role } : null;
  },

  // Only for logging in: the one place the password hash is read.
  async findCredentialsByEmail(email) {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true },
      select: { ...publicSelect, password_hash: true },
    });
    return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
  },

  async findByEmailExcludingId(email, id) {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true, api_id: { not: id } },
      select: publicSelect,
    });
    return row ? toUser(row) : null;
  },

  async create(userData) {
    const row = await prisma.members.create({
      data: await toRow(prisma, userData),
      select: publicSelect,
    });
    return toUser(row);
  },

  async updateById(id, changes) {
    const existing = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      select: { member_id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.members.update({
      where: { member_id: existing.member_id },
      data: await toRow(prisma, changes),
      select: publicSelect,
    });
    return toUser(row);
  },

  // Soft delete, like on Tuesday: members with loans or requests can't be
  // removed from the table, so they are marked inactive instead.
  async deleteById(id) {
    const result = await prisma.members.updateMany({
      where: { api_id: id, is_active: true },
      data: { is_active: false },
    });
    return result.count > 0;
  },
});

export default createUsersRepository;
