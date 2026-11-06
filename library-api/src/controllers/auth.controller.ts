import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { RequestWithBody } from "../types/http.ts";
import type { LoginBody } from "../schemas/auth.schema.ts";
import type { CreateUserBody } from "../schemas/users.schema.ts";
import config from "../config/config.js";
import { AuthenticationError } from "../errors/domainErrors.ts";

// same response whether the email was new or already registered
const registrationResponse = {
  message:
    "Registration received. If this email wasn't already registered, the account has been created and you can log in.",
};

const REFRESH_COOKIE_PATH = "/api/v1/auth";

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.nodeEnv === "production",
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshExpiresInMs,
  });
};

const refreshTokenCookie = (req: Request): string | undefined => {
  const value: unknown = req.cookies?.refreshToken;
  return typeof value === "string" ? value : undefined;
};

const register = async (
  req: RequestWithBody<CreateUserBody>,
  res: Response,
) => {
  await servicesFor(req).users.create(req.body);
  res.status(201).json(registrationResponse);
};

const login = async (req: RequestWithBody<LoginBody>, res: Response) => {
  const { auth } = servicesFor(req);
  const user = await auth.authenticate(req.body.email, req.body.password);

  const accessToken = auth.createAccessToken(user);
  setRefreshTokenCookie(res, await auth.issueRefreshToken(user.id));

  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const logout = async (req: Request, res: Response) => {
  if (!req.token) {
    throw new AuthenticationError();
  }
  await servicesFor(req).auth.logout(req.token, refreshTokenCookie(req));

  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_PATH });
  res.status(200).json({
    message: "Logged out successfully.",
  });
};

const refreshToken = async (req: Request, res: Response) => {
  const { auth } = servicesFor(req);
  const { member, refreshToken: newRefreshToken } =
    await auth.rotateRefreshToken(refreshTokenCookie(req));

  setRefreshTokenCookie(res, newRefreshToken);
  res.status(200).json({
    accessToken: auth.createAccessToken(member),
  });
};

export { register, login, logout, refreshToken };
