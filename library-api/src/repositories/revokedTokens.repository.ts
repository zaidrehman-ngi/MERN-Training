import type { Prisma } from "../generated/prisma/client.ts";

type Db = Prisma.TransactionClient;

// denylist of logged-out access token ids (jti)
export interface RevokedTokensRepository {
  add(jti: string, expiresAt: Date): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
  deleteExpired(): Promise<void>;
}

const createRevokedTokensRepository = (
  prisma: Db,
): RevokedTokensRepository => ({
  async add(jti, expiresAt) {
    await prisma.revoked_tokens.createMany({
      data: [{ jti, expires_at: expiresAt }],
      skipDuplicates: true, // logging out twice with the same token is fine
    });
  },

  async isRevoked(jti) {
    const row = await prisma.revoked_tokens.findUnique({
      where: { jti },
      select: { jti: true },
    });
    return row !== null;
  },

  // expired tokens are rejected anyway, so their rows can go
  async deleteExpired() {
    await prisma.revoked_tokens.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  },
});

export default createRevokedTokensRepository;
