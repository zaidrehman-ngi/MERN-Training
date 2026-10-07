import { forbidden } from "../errors/ApiError.js";

const requireRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!requiredRoles.includes(req.user.role)) {
      return next(
        forbidden("You do not have permission to perform this action."),
      );
    }

    next();
  };
};

export default requireRole;
