import { NavLink } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import styles from "./Navbar.module.css";

const linkClass = ({ isActive }) =>
  isActive ? `${styles.link} ${styles.linkActive}` : styles.link;

function Navbar() {
  const { user, can } = useCurrentUser();

  return (
    <nav className={styles.navbar}>
      <NavLink to="/" end className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/books" end className={linkClass}>
        Books
      </NavLink>
      {user && (
        <NavLink to="/borrow-requests" className={linkClass}>
          {can("requests:seeAll") ? "Approval queue" : "My requests"}
        </NavLink>
      )}
      {can("books:add") && (
        <NavLink to="/books/add" className={linkClass}>
          Add Book
        </NavLink>
      )}
      {can("members:list") && (
        <NavLink to="/users" className={linkClass}>
          {can("members:manage") ? "Manage members" : "Members"}
        </NavLink>
      )}
      {can("admins:manage") && (
        <NavLink to="/admins" className={linkClass}>
          Manage admins
        </NavLink>
      )}
    </nav>
  );
}

export default Navbar;
