import jwt from "jsonwebtoken";
import config from "../config/config.js";

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
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
    email: req.user.email,
    role: req.user.role,
  });

  setAccessTokenCookie(res, accessToken);

  res.status(200).json({
    accessToken,
  });
};

export { login, logout, refreshToken };
