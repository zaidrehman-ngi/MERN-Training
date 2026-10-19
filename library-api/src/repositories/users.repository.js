import { ApiError } from "../errors/ApiError.js";

// Always load the branch so we can return its name like db.json did.
const include = { branches: true };

// Turns a members row into the same user shape the API returned from db.json.
// password is only used by the auth service; the controller removes it.
const toUser = (row) => ({
  id: row.api_id,
  name: row.name,
  email: row.email,
  role: row.role,
  branch: row.branches.name,
  joined: row.joined_on ? row.joined_on.toISOString().slice(0, 10) : null,
  password: row.password_hash,
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
      include,
      orderBy: { api_id: "asc" },
    });
    return rows.map(toUser);
  },

  async findById(id) {
    const row = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
      include,
    });
    return row ? toUser(row) : null;
  },

  async findByEmail(email) {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true },
      include,
    });
    return row ? toUser(row) : null;
  },

  async findByEmailExcludingId(email, id) {
    const row = await prisma.members.findFirst({
      where: { email, is_active: true, api_id: { not: id } },
      include,
    });
    return row ? toUser(row) : null;
  },

  async create(userData) {
    const row = await prisma.members.create({
      data: await toRow(prisma, userData),
      include,
    });
    return toUser(row);
  },

  async updateById(id, changes) {
    const existing = await prisma.members.findFirst({
      where: { api_id: id, is_active: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.members.update({
      where: { member_id: existing.member_id },
      data: await toRow(prisma, changes),
      include,
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
