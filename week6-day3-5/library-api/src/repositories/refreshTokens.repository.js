// Refresh tokens are stored as a SHA-256 hash, never the token itself.
const createRefreshTokensRepository = (prisma) => ({
  async create({ memberId, tokenHash, expiresAt }) {
    await prisma.refresh_tokens.create({
      data: {
        token_hash: tokenHash,
        expires_at: expiresAt,
        members: { connect: { api_id: memberId } },
      },
    });
  },

  // A token that exists, isn't revoked, hasn't expired, and belongs to a
  // member who still has an account. Returns the member it belongs to.
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
        members: { select: { api_id: true, name: true, role: true } },
      },
    });
    if (!row) {
      return null;
    }
    return {
      tokenId: row.token_id,
      member: { id: row.members.api_id, name: row.members.name, role: row.members.role },
    };
  },

  // For logout: revoke the refresh token by its hash (if it's still valid).
  async revokeByHash(tokenHash) {
    await prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  },

  // Marks the token as used. Only succeeds once, so the same refresh token
  // can't be swapped twice (count is 0 the second time).
  async revoke(tokenId) {
    const result = await prisma.refresh_tokens.updateMany({
      where: { token_id: tokenId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return result.count > 0;
  },
});

export default createRefreshTokensRepository;
