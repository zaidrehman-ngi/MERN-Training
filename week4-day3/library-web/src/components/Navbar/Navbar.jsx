import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.linkActive}` : styles.link
        }
      >
        Home
      </NavLink>

      <NavLink
        to="/books"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.linkActive}` : styles.link
        }
      >
        Books
      </NavLink>

      <NavLink
        to="/books/add"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.linkActive}` : styles.link
        }
      >
        Add Book
      </NavLink>

      <NavLink
        to="/users"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.linkActive}` : styles.link
        }
      >
        Users
      </NavLink>

      <NavLink
        to="/borrow-requests"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.linkActive}` : styles.link
        }
      >
        Borrow Requests
      </NavLink>
    </nav>
  );
}

export default Navbar;
