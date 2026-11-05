// Takes the token from the Authorization header and checks it with the auth
// service (the same check the socket server uses), then loads the member it
// belongs to. The token only says who the member is; their current role (and
// whether they still have an account at all) comes from the database, so a
// member who was deleted or had their role changed can't keep using an old
// token.
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  try {
    const { member, jti, exp } =
      await req.app.locals.services.auth.verifyAccessToken(token);

    req.user = { sub: member.id, role: member.role, name: member.name };
    // logout needs the token's id and expiry
    req.token = { jti, exp };
    next();
  } catch (err) {
    next(err);
  }
};

export default requireAuth;
