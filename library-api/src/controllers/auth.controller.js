import jwt from "jsonwebtoken";
import { verifyPassword } from "../utils/password.js";
import { unauthorized } from "../errors/ApiError.js";
import config from "../config/config.js";

const login = async (req, res) => {
  const { users } = req.app.locals.db;

  const { email, password } = req.body || {};

  const user = users.find((user) => user.email === email);
  const passwordMatches =
    user && (await verifyPassword(password, user.password));

  if (!passwordMatches) {
    throw unauthorized(
      "Email or password is incorrect.",
      "INVALID_CREDENTIALS",
    );
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: config.jwtExpiresInMs,
  });

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
  res.status(200).json({
    accessToken: "refreshed-token",
  });
};

export { login, logout, refreshToken };
