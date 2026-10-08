import jwt from "jsonwebtoken";
import { unauthorized } from "../errors/ApiError.js";
import config from "../config/config.js";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(unauthorized());
  }

  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   res.status(401).json({
  //     error: "UNAUTHORIZED",
  //     message: "Authentication required.",
  //     details: [],
  //   });
  //   }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, config.jwtSecret, (err, payload) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Token has expired."
          : "Invalid token.";
      next(unauthorized(message));
      return;
    }

    req.user = payload;
    next();
  });
};

export default requireAuth;
