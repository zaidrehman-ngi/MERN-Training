import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import useDebounce from "../hooks/useDebounce";
import UserCard from "../components/UserCard/UserCard";
import Pagination from "../components/Pagination";
import { ROLES } from "../constants/roles";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { assignableRoles, canManageMember } from "../constants/permissions";
import { deactivateUser, updateUser } from "../api/users";

function Users() {
  const { user: me, can } = useCurrentUser();
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const {
    items: users,
    total,
    pageCount,
    status,
    error,
    reload,
  } = useUsers({
    page,
    search: debouncedSearch,
    role,
  });
  const filtered = debouncedSearch.trim() !== "" || role !== "all";

  const runAction = async (id, action) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (error) {
      setActionError({ id, message: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = (member) => {
    if (
      window.confirm(`Deactivate ${member.name}? They won't be able to log in.`)
    ) {
      runAction(member.id, () => deactivateUser(member.id));
    }
  };

  const manageControls = (member) => {
    if (!canManageMember(me, member)) {
      return null;
    }
    const roles = [...new Set([member.role, ...assignableRoles(me.role)])];
    return (
      <div>
        <label htmlFor={`role-${member.id}`}>Role</label>
        <select
          id={`role-${member.id}`}
          value={member.role}
          disabled={busyId === member.id}
          onChange={(event) =>
            runAction(member.id, () =>
              updateUser(member.id, { role: event.target.value }),
            )
          }
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>{" "}
        <button
          className="dangerButton"
          type="button"
          disabled={busyId === member.id}
          onClick={() => handleDeactivate(member)}
        >
          Deactivate
        </button>
        {actionError?.id === member.id && (
          <p role="alert">{actionError.message}</p>
        )}
      </div>
    );
  };

  return (
    <main>
      <h1>{can("members:manage") ? "Manage members" : "Members"}</h1>

      <label htmlFor="user-search">Search users</label>
      <input
        id="user-search"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Name, email, or branch"
      />
      <label htmlFor="user-role">Role</label>
      <select
        id="user-role"
        value={role}
        onChange={(event) => {
          setRole(event.target.value);
          setPage(1);
        }}
      >
        <option value="all">All roles</option>
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "idle" && <p role="status">Waiting to load users...</p>}
      {status === "loading" && <p role="status">Loading users...</p>}
      {status === "failed" && (
        <p role="alert">
          {error?.message || "Something went wrong while loading users."}
        </p>
      )}

      {status === "succeeded" && users.length === 0 && (
        <p>{filtered ? "No users match these filters." : "No users found."}</p>
      )}

      {status === "succeeded" && users.length > 0 && (
        <>
          <p>
            Showing {users.length} of {total} users
          </p>
          <div>
            {users.map((user) => (
              <UserCard key={user.id} user={user}>
                {manageControls(user)}
              </UserCard>
            ))}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}

export default Users;
