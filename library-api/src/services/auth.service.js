import { verifyPassword } from "../utils/password.js";
import { unauthorized } from "../errors/ApiError.js";

const createAuthService = (usersRepository) => ({
  async authenticate(email, password) {
    const user = await usersRepository.findByEmail(email);
    const passwordMatches =
      user && (await verifyPassword(password, user.password));

    if (!passwordMatches) {
      throw unauthorized(
        "Email or password is incorrect.",
        "INVALID_CREDENTIALS",
      );
    }

    return user;
  },
});

export default createAuthService;
