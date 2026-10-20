import { hashPassword, verifyPassword } from "../utils/password.js";
import { unauthorized } from "../errors/ApiError.js";

// Used when the email doesn't exist, so login still runs one bcrypt check
// and takes as long as it does for a real account. Otherwise the timing
// would show which emails are registered, even with the same message.
let dummyHash;
const getDummyHash = async () => {
  dummyHash ??= await hashPassword("not a real password");
  return dummyHash;
};

const createAuthService = (usersRepository) => ({
  async authenticate(email, password) {
    const user = await usersRepository.findCredentialsByEmail(email);
    const hashToCheck = user?.passwordHash ?? (await getDummyHash());
    const passwordMatches = await verifyPassword(password, hashToCheck);

    if (!user || !user.passwordHash || !passwordMatches) {
      throw unauthorized(
        "Email or password is incorrect.",
        "INVALID_CREDENTIALS",
      );
    }

    // the hash was only needed for the check above, don't pass it on
    const { passwordHash, ...member } = user;
    return member;
  },

  // Used by requireAuth on every protected request: the member the token
  // belongs to, or null if they were deleted (soft delete) since.
  findMemberForToken: (id) => usersRepository.findForAuth(id),
});

export default createAuthService;
