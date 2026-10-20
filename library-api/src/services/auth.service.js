import { createHash, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { unauthorized } from "../errors/ApiError.js";
import config from "../config/config.js";

// The refresh token is just a long random string. It isn't a JWT because
// the database has to be checked anyway (to see if it was revoked).
// Only its SHA-256 hash is stored. A fast hash is fine here, unlike for
// passwords, because the token is random and too long to guess.
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

// Used when the email doesn't exist, so login still runs one bcrypt check
// and takes as long as it does for a real account. Otherwise the timing
// would show which emails are registered, even with the same message.
let dummyHash;
const getDummyHash = async () => {
  dummyHash ??= await hashPassword("not a real password");
  return dummyHash;
};

const createAuthService = (
  usersRepository,
  refreshTokensRepository,
  revokedTokensRepository,
) => ({
  async authenticate(email, password) {
    const user = await usersRepository.findCredentialsByEmail(email);
    const hashToCheck = user?.passwordHash ?? (await getDummyHash());
    const passwordMatches = await verifyPassword(password, hashToCheck);

    if (!user || !user.passwordHash || !passwordMatches) {
      throw unauthorized(
        "Email or password is incorrect.",
        "INVALID_CREDENTIALS",
      );
    }

    // the hash was only needed for the check above, don't pass it on
    const { passwordHash, ...member } = user;
    return member;
  },

  // Used by requireAuth on every protected request: the member the token
  // belongs to, or null if they were deleted (soft delete) since.
  findMemberForToken: (id) => usersRepository.findForAuth(id),

  isAccessTokenRevoked: (jti) => revokedTokensRepository.isRevoked(jti),

  // Logout: the access token goes on the denylist until it would have
  // expired, and the refresh token is revoked, so neither can be used again.
  async logout({ jti, exp }, refreshToken) {
    await revokedTokensRepository.add(jti, new Date(exp * 1000));
    if (refreshToken) {
      await refreshTokensRepository.revokeByHash(sha256(refreshToken));
    }
    await revokedTokensRepository.deleteExpired();
  },

  // Makes a new refresh token for a member and saves its hash.
  async issueRefreshToken(memberId) {
    const token = randomBytes(32).toString("base64url");
    await refreshTokensRepository.create({
      memberId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + config.refreshExpiresInMs),
    });
    return token;
  },

  // Swaps a refresh token for a new one (rotation): the old one is revoked,
  // so each refresh token works only once. Returns the member and the new
  // refresh token, so the controller can sign a new access token.
  async rotateRefreshToken(token) {
    const found = token
      ? await refreshTokensRepository.findValidByHash(sha256(token))
      : null;

    // revoke() only works once, so two requests with the same token can't
    // both get through
    if (!found || !(await refreshTokensRepository.revoke(found.tokenId))) {
      throw unauthorized(
        "Refresh token is missing, expired or already used.",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const newToken = await this.issueRefreshToken(found.member.id);
    return { member: found.member, refreshToken: newToken };
  },
});

export default createAuthService;
