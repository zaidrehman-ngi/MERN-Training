const getUsers = async (req, res) => {
  const users = await req.app.locals.services.users.list();
  res.status(200).json({
    data: users,
  });
};

const getUserById = async (req, res) => {
  const user = await req.app.locals.services.users.getById(req.params.id);
  res.status(200).json(user);
};

// Same response whether the email was new or already registered.
const registrationResponse = {
  message:
    "Registration received. If this email wasn't already registered, the account has been created and you can log in.",
};

const createUser = async (req, res) => {
  await req.app.locals.services.users.create(req.body);
  res.status(201).json(registrationResponse);
};

const updateUser = async (req, res) => {
  const updatedUser = await req.app.locals.services.users.update(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    data: updatedUser,
  });
};

const deleteUser = async (req, res) => {
  await req.app.locals.services.users.delete(req.params.id);
  res.status(204).send();
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registrationResponse,
};
