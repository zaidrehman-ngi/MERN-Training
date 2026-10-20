import jwt from "jsonwebtoken";
import { unauthorized } from "../errors/ApiError.js";
import config from "../config/config.js";

// Checks the token, then loads the member it belongs to from the database.
// The token only says who the member is; their current role (and whether
// they still have an account at all) comes from the database, so a member
// who was deleted or had their role changed can't keep using an old token.
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(unauthorized());
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Token has expired." : "Invalid token.";
    return next(unauthorized(message));
  }

  // logged out tokens are on the denylist (tokens without an id are old or
  // not made by us, so they're refused too)
  if (
    !payload.jti ||
    (await req.app.locals.services.auth.isAccessTokenRevoked(payload.jti))
  ) {
    return next(unauthorized("This token has been logged out."));
  }

  const member = await req.app.locals.services.auth.findMemberForToken(
    payload.sub,
  );
  if (!member) {
    return next(unauthorized("This account no longer exists."));
  }

  // role comes from the database, not from the token
  req.user = { sub: member.id, role: member.role, name: member.name };
  // logout needs the token's id and expiry
  req.token = { jti: payload.jti, exp: payload.exp };
  next();
};

export default requireAuth;
