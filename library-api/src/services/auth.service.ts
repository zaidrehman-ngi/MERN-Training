import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { AuthenticationError } from "../errors/domainErrors.ts";
import config from "../config/config.ts";
import type { UsersRepository } from "../repositories/users.repository.ts";
import type { RefreshTokensRepository } from "../repositories/refreshTokens.repository.ts";
import type { RevokedTokensRepository } from "../repositories/revokedTokens.repository.ts";
import type { AuthMember, PublicMember, Role } from "../types/member.ts";

export type VerifiedToken = { member: AuthMember; jti: string; exp: number };

// a fast hash is fine for refresh tokens: they are random and too long to guess
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

// checked when the email doesn't exist, so the timing doesn't reveal accounts
let dummyHash: string | undefined;
const getDummyHash = async () => {
  dummyHash ??= await hashPassword("not a real password");
  return dummyHash;
};

const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    const expired = err instanceof Error && err.name === "TokenExpiredError";
    throw new AuthenticationError(
      expired ? "Token has expired." : "Invalid token.",
    );
  }
};

const createAuthService = (
  usersRepository: UsersRepository,
  refreshTokensRepository: RefreshTokensRepository,
  revokedTokensRepository: RevokedTokensRepository,
) => ({
  // the jti lets logout put this one token on the denylist
  createAccessToken(member: { id: string; role: Role }): string {
    return jwt.sign({ sub: member.id, role: member.role }, config.jwtSecret, {
      expiresIn: Math.floor(config.jwtExpiresInMs / 1000),
      jwtid: randomUUID(),
    });
  },

  async authenticate(email: string, password: string): Promise<PublicMember> {
    const user = await usersRepository.findCredentialsByEmail(email);
    const hashToCheck = user?.passwordHash ?? (await getDummyHash());
    const passwordMatches = await verifyPassword(password, hashToCheck);

    if (!user || !user.passwordHash || !passwordMatches) {
      throw new AuthenticationError("Email or password is incorrect.", {
        code: "INVALID_CREDENTIALS",
      });
    }

    const { passwordHash, ...member } = user;
    return member;
  },

  async verifyAccessToken(token: string | undefined): Promise<VerifiedToken> {
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyJwt(token);
    if (typeof payload === "string" || !payload.sub || !payload.exp) {
      throw new AuthenticationError("Invalid token.");
    }

    if (
      !payload.jti ||
      (await revokedTokensRepository.isRevoked(payload.jti))
    ) {
      throw new AuthenticationError("This token has been logged out.");
    }

    const member = await usersRepository.findForAuth(payload.sub);
    if (!member) {
      throw new AuthenticationError("This account no longer exists.");
    }

    return { member, jti: payload.jti, exp: payload.exp };
  },

  async logout(
    { jti, exp }: { jti: string; exp: number },
    refreshToken?: string,
  ): Promise<void> {
    await revokedTokensRepository.add(jti, new Date(exp * 1000));
    if (refreshToken) {
      await refreshTokensRepository.revokeByHash(sha256(refreshToken));
    }
    await revokedTokensRepository.deleteExpired();
  },

  async issueRefreshToken(memberId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    await refreshTokensRepository.create({
      memberId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + config.refreshExpiresInMs),
    });
    return token;
  },

  // rotation: the old token is revoked, so each refresh token works once
  async rotateRefreshToken(
    token: string | undefined,
  ): Promise<{ member: AuthMember; refreshToken: string }> {
    const found = token
      ? await refreshTokensRepository.findValidByHash(sha256(token))
      : null;

    if (!found || !(await refreshTokensRepository.revoke(found.tokenId))) {
      throw new AuthenticationError(
        "Refresh token is missing, expired or already used.",
        { code: "INVALID_REFRESH_TOKEN" },
      );
    }

    const newToken = await this.issueRefreshToken(found.member.id);
    return { member: found.member, refreshToken: newToken };
  },
});

export type AuthService = ReturnType<typeof createAuthService>;

export default createAuthService;
