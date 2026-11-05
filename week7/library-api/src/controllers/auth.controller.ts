import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { RequestWithBody } from "../types/http.ts";
import type { LoginBody } from "../schemas/auth.schema.ts";
import type { CreateUserBody } from "../schemas/users.schema.ts";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { registrationResponse } from "./users.controller.ts";
import type { Role } from "../types/member.ts";
import { AuthenticationError } from "../errors/domainErrors.js";

const createAccessToken = (user: { id: string; role: Role }): string =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: Math.floor(config.jwtExpiresInMs / 1000),
      jwtid: randomUUID(),
    },
  );

const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: config.jwtExpiresInMs,
  });
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

const register = async (
  req: RequestWithBody<CreateUserBody>,
  res: Response,
) => {
  await servicesFor(req).users.create(req.body);
  res.status(201).json(registrationResponse);
};

const login = async (req: RequestWithBody<LoginBody>, res: Response) => {
  const { email, password } = req.body || {};
  const user = await servicesFor(req).auth.authenticate(email, password);

  const accessToken = createAccessToken(user);
  setAccessTokenCookie(res, accessToken);

  const refreshToken = await servicesFor(req).auth.issueRefreshToken(user.id);
  setRefreshTokenCookie(res, refreshToken);

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

const refreshTokenCookie = (req: Request): string | undefined => {
  const value: unknown = req.cookies?.refreshToken;
  return typeof value === "string" ? value : undefined;
};

const logout = async (req: Request, res: Response) => {
  if (!req.token) {
    throw new AuthenticationError();
  }
  await servicesFor(req).auth.logout(req.token, refreshTokenCookie(req));

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_PATH });

  res.status(200).json({
    message: "Logged out successfully.",
  });
};

const refreshToken = async (req: Request, res: Response) => {
  const { member, refreshToken: newRefreshToken } = await servicesFor(
    req,
  ).auth.rotateRefreshToken(refreshTokenCookie(req));

  const accessToken = createAccessToken(member);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(200).json({
    accessToken,
  });
};

export { register, login, logout, refreshToken };
