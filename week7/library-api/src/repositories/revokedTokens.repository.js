// The denylist: ids (jti) of access tokens that were logged out early.
const createRevokedTokensRepository = (prisma) => ({
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

  // Once a token's expiry has passed it's rejected anyway, so its row
  // isn't needed. Keeps the table small.
  async deleteExpired() {
    await prisma.revoked_tokens.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  },
});

export default createRevokedTokensRepository;
