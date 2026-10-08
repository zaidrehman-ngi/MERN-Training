const createUsersRepository = (db) => {
  const { users } = db;

  return {
    async findAll() {
      return [...users];
    },

    async findById(id) {
      return users.find((user) => user.id === id) ?? null;
    },

    async findByEmail(email) {
      return users.find((user) => user.email === email) ?? null;
    },

    async findByEmailExcludingId(email, id) {
      return users.find((user) => user.email === email && user.id !== id) ?? null;
    },

    async create(userData) {
      const user = {
        id: `m-${1000 + users.length}`,
        ...userData,
      };
      users.push(user);
      return user;
    },

    async updateById(id, changes) {
      const index = users.findIndex((user) => user.id === id);
      if (index === -1) {
        return null;
      }

      users[index] = { ...users[index], ...changes, id };
      return users[index];
    },

    async deleteById(id) {
      const index = users.findIndex((user) => user.id === id);
      if (index === -1) {
        return false;
      }

      users.splice(index, 1);
      return true;
    },
  };
};

export default createUsersRepository;
