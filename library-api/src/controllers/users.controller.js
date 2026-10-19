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

const createUser = async (req, res) => {
  const newUser = await req.app.locals.services.users.create(req.body);
  res.status(201).json({
    data: newUser,
  });
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

export { getUsers, getUserById, createUser, updateUser, deleteUser };
