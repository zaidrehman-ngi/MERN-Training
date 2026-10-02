const requireRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
        details: [],
      });
    }

    next();
  };
};

export default requireRole;
