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
    { expiresIn: config.jwtExpiresIn },
  );

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: config.jwtExpiresInMs,
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

const logout = (req, res) => {
  res.status(200).json({
    message: "Logged out successfully.",
  });
};

const refreshToken = (req, res) => {
  const accessToken = createAccessToken({
    id: req.user.sub,
    role: req.user.role,
  });

  setAccessTokenCookie(res, accessToken);

  res.status(200).json({
    accessToken,
  });
};

export { register, login, logout, refreshToken };
