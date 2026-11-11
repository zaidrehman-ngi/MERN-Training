import type { Prisma } from "../generated/prisma/client.ts";
import type { Branch } from "../types/branch.ts";

type Db = Prisma.TransactionClient;

export interface BranchesRepository {
  findAll(): Promise<Branch[]>;
}

const createBranchesRepository = (prisma: Db): BranchesRepository => ({
  async findAll() {
    const rows = await prisma.branches.findMany({
      select: { branch_id: true, name: true },
      orderBy: [{ name: "asc" }, { branch_id: "asc" }],
    });
    return rows.map((row) => ({ id: row.branch_id, name: row.name }));
  },
});

export default createBranchesRepository;
