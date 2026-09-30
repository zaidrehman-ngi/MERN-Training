const getUsers = (req, res) => {
  const { users } = req.app.locals.db;

  res.status(200).json({
    data: users,
  });
};

const getUserById = (req, res) => {
  const { users } = req.app.locals.db;

  const user = users.find((user) => user.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "User not found.",
      details: [],
    });
  }

  res.status(200).json(user);
};

const createUser = (req, res) => {
  const { users } = req.app.locals.db;

  const { name, email, role, branch, joined } = req.body;

  const details = [];

  if (!name) {
    details.push({
      field: "name",
      message: "Name is required.",
    });
  }

  if (!email) {
    details.push({
      field: "email",
      message: "Email is required.",
    });
  }

  if (!role) {
    details.push({
      field: "role",
      message: "Role is required.",
    });
  }

  if (!branch) {
    details.push({
      field: "branch",
      message: "Branch is required.",
    });
  }

  if (!joined) {
    details.push({
      field: "joined",
      message: "Joined date is required.",
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Some fields are missing.",
      details,
    });
  }

  const allowedRoles = ["user", "librarian", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Invalid role.",
      details: [
        {
          field: "role",
          message: "Role must be user, librarian, or admin.",
        },
      ],
    });
  }

  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({
      error: "CONFLICT",
      message: "A user with this email already exists.",
      details: [
        {
          field: "email",
          message: "Email must be unique.",
        },
      ],
    });
  }

  const newUser = {
    id: `m-${1000 + users.length}`,
    name,
    email,
    role,
    branch,
    joined,
  };

  users.push(newUser);

  res.status(201).json({
    data: newUser,
  });
};

const updateUser = (req, res) => {
  const { users } = req.app.locals.db;

  const index = users.findIndex((user) => user.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "User not found.",
      details: [],
    });
  }

  const { role, email } = req.body;

  if (role !== undefined) {
    const allowedRoles = ["user", "librarian", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(422).json({
        error: "VALIDATION_ERROR",
        message: "Invalid role.",
        details: [
          {
            field: "role",
            message: "Role must be user, librarian, or admin.",
          },
        ],
      });
    }
  }

  if (email !== undefined) {
    const duplicate = users.find(
      (user) => user.email === email && user.id !== req.params.id,
    );

    if (duplicate) {
      return res.status(409).json({
        error: "CONFLICT",
        message: "A user with this email already exists.",
        details: [
          {
            field: "email",
            message: "Email must be unique.",
          },
        ],
      });
    }
  }

  users[index] = {
    ...users[index],
    ...req.body,
    id: users[index].id,
  };

  res.status(200).json({
    data: users[index],
  });
};

const deleteUser = (req, res) => {
  const { users } = req.app.locals.db;

  const index = users.findIndex((user) => user.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "User not found.",
      details: [],
    });
  }

  users.splice(index, 1);

  res.status(204).send();
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
