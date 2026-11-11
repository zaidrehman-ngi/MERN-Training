import type { Prisma } from "../generated/prisma/client.ts";
import type { AuthMember } from "../types/member.ts";
import { toRole } from "./users.repository.ts";

type Db = Prisma.TransactionClient;

export type NewRefreshToken = {
  memberId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type ValidRefreshToken = { tokenId: string; member: AuthMember };

// only the SHA-256 hash is stored, never the token
export interface RefreshTokensRepository {
  create(token: NewRefreshToken): Promise<void>;
  findValidByHash(tokenHash: string): Promise<ValidRefreshToken | null>;
  revokeByHash(tokenHash: string): Promise<void>;
  revoke(tokenId: string): Promise<boolean>;
}

const createRefreshTokensRepository = (
  prisma: Db,
): RefreshTokensRepository => ({
  async create({ memberId, tokenHash, expiresAt }) {
    await prisma.refresh_tokens.create({
      data: {
        token_hash: tokenHash,
        expires_at: expiresAt,
        member_id: memberId,
      },
    });
  },

  async findValidByHash(tokenHash) {
    const row = await prisma.refresh_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
        members: { is_active: true },
      },
      select: {
        token_id: true,
        members: { select: { member_id: true, name: true, role: true } },
      },
    });
    if (!row) {
      return null;
    }
    return {
      tokenId: row.token_id,
      member: {
        id: row.members.member_id,
        name: row.members.name,
        role: toRole(row.members.role),
      },
    };
  },

  async revokeByHash(tokenHash) {
    await prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  },

  // succeeds only once, so a token can't be swapped twice
  async revoke(tokenId) {
    const result = await prisma.refresh_tokens.updateMany({
      where: { token_id: tokenId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return result.count > 0;
  },
});

export default createRefreshTokensRepository;
