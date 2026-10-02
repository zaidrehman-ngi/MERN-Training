import jwt from "jsonwebtoken";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required.",
      details: [],
    });
  }

  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   res.status(401).json({
  //     error: "UNAUTHORIZED",
  //     message: "Authentication required.",
  //     details: [],
  //   });
  // }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token has expired.",
        details: [],
      });
    }

    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid token.",
      details: [],
    });
  }
};

export default requireAuth;
