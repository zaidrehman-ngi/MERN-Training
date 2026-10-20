import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { registrationResponse } from "./users.controller.js";

// Only the member id and role go in the token. Anyone holding a token can
// read the payload (it's only encoded, not encrypted, Week 1 Day 4), so
// nothing personal or secret goes in it: no email, no password hash.
const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    config.jwtSecret,
    // jwtid (jti) gives every token its own id, so logout can deny just it
    { expiresIn: config.jwtExpiresIn, jwtid: randomUUID() },
  );

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: config.jwtExpiresInMs,
  });
};

// The refresh token goes in an httpOnly cookie (page JavaScript can't read
// it) that the browser only sends to the /auth routes, not with every
// request like the access token. It has to include /auth/logout as well
// as /auth/refresh, otherwise logout never gets it and can't revoke it.
const REFRESH_COOKIE_PATH = "/api/v1/auth";

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.nodeEnv === "production",
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshExpiresInMs,
  });
};

// The users service hashes the password and saves the member, unless the
// email is already registered. The response is the same either way, so it
// can't be used to check if someone has an account.
const register = async (req, res) => {
  await req.app.locals.services.users.create(req.body);
  res.status(201).json(registrationResponse);
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  const user = await req.app.locals.services.auth.authenticate(email, password);

  const accessToken = createAccessToken(user);
  setAccessTokenCookie(res, accessToken);

  const refreshToken = await req.app.locals.services.auth.issueRefreshToken(
    user.id,
  );
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

// Logout really ends the session: the access token is put on the denylist
// (requireAuth rejects it from now on) and the refresh token is revoked.
const logout = async (req, res) => {
  await req.app.locals.services.auth.logout(
    req.token,
    req.cookies?.refreshToken,
  );

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_PATH });

  res.status(200).json({
    message: "Logged out successfully.",
  });
};

// Swaps the refresh token cookie for a new access token (and a new refresh
// token, the old one stops working). Works even after the access token has
// expired, because it doesn't need it.
const refreshToken = async (req, res) => {
  const { member, refreshToken: newRefreshToken } =
    await req.app.locals.services.auth.rotateRefreshToken(
      req.cookies?.refreshToken,
    );

  const accessToken = createAccessToken(member);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(200).json({
    accessToken,
  });
};

export { register, login, logout, refreshToken };
