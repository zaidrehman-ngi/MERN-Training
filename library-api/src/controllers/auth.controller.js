import jwt from "jsonwebtoken";

const login = (req, res) => {
  const { users } = req.app.locals.db;

  const { email, password } = req.body;

  const user = users.find(
    (user) => user.email === email && user.password === password,
  );

  if (!user) {
    return res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      details: [],
    });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    "library-secret",
    { expiresIn: "1h" },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
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
