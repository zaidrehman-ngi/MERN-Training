import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "navbar__link navbar__link--active" : "navbar__link"
        }
      >
        Home
      </NavLink>
      
      <NavLink
        to="/books"
        className={({ isActive }) =>
          isActive ? "navbar__link navbar__link--active" : "navbar__link"
        }
      >
        Books
      </NavLink>

      <NavLink
        to="/users"
        className={({ isActive }) =>
          isActive ? "navbar__link navbar__link--active" : "navbar__link"
        }
      >
        Users
      </NavLink>

      <NavLink
        to="/borrow-requests"
        className={({ isActive }) =>
          isActive ? "navbar__link navbar__link--active" : "navbar__link"
        }
      >
        Borrow Requests
      </NavLink>
    </nav>
  );
}

export default Navbar;
