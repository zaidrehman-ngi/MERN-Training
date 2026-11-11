import type { BranchesRepository } from "../repositories/branches.repository.ts";
import type { Branch } from "../types/branch.ts";

const createBranchesService = (branchesRepository: BranchesRepository) => ({
  list(): Promise<Branch[]> {
    return branchesRepository.findAll();
  },
});

export type BranchesService = ReturnType<typeof createBranchesService>;

export default createBranchesService;
