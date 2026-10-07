import { hashPassword } from "../utils/password.js";
import { conflict, notFound } from "../errors/ApiError.js";

const toPublicUser = ({ password, ...user }) => user;

const getUsers = (req, res) => {
  const { users } = req.app.locals.db;

  res.status(200).json({
    data: users.map(toPublicUser),
  });
};

const getUserById = (req, res) => {
  const { users } = req.app.locals.db;

  const user = users.find((user) => user.id === req.params.id);

  if (!user) {
    throw notFound("User not found.");
  }

  res.status(200).json(toPublicUser(user));
};

const createUser = async (req, res) => {
  const { users } = req.app.locals.db;

  const { name, email, password, branch, joined } = req.body;

  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    throw conflict("A user with this email already exists.", [
      {
        field: "email",
        message: "Email must be unique.",
      },
    ]);
  }

  const newUser = {
    id: `m-${1000 + users.length}`,
    name,
    email,
    password: await hashPassword(password),
    role: "user",
    branch,
    joined,
  };

  users.push(newUser);

  res.status(201).json({
    data: toPublicUser(newUser),
  });
};

const updateUser = async (req, res) => {
  const { users } = req.app.locals.db;

  const index = users.findIndex((user) => user.id === req.params.id);

  if (index === -1) {
    throw notFound("User not found.");
  }

  const { email } = req.body;

  if (email !== undefined) {
    const duplicate = users.find(
      (user) => user.email === email && user.id !== req.params.id,
    );

    if (duplicate) {
      throw conflict("A user with this email already exists.", [
        {
          field: "email",
          message: "Email must be unique.",
        },
      ]);
    }
  }

  const updatedUser = {
    ...users[index],
    ...req.body,
    id: users[index].id,
  };

  if (req.body.password !== undefined) {
    updatedUser.password = await hashPassword(req.body.password);
  }

  users[index] = updatedUser;

  res.status(200).json({
    data: toPublicUser(users[index]),
  });
};

const deleteUser = (req, res) => {
  const { users } = req.app.locals.db;

  const index = users.findIndex((user) => user.id === req.params.id);

  if (index === -1) {
    throw notFound("User not found.");
  }

  users.splice(index, 1);

  res.status(204).send();
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
