import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Sidebar.css";

function Sidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className={`user-sidebar ${open ? "user-sidebar--open" : ""}`} aria-hidden={!open}>
      <div className="user-sidebar__panel">
        <div className="user-sidebar__head">
          <span className="user-sidebar__title">Menu</span>
          <button type="button" className="user-sidebar__close" aria-label="Close menu" onClick={onClose}>
            ×
          </button>
        </div>
        <nav className="user-sidebar__nav">
          <NavLink
            to="/user"
            end
            className={({ isActive }) =>
              `user-sidebar__link ${isActive ? "user-sidebar__link--active" : ""}`
            }
            onClick={onClose}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/user/profile"
            className={({ isActive }) =>
              `user-sidebar__link ${isActive ? "user-sidebar__link--active" : ""}`
            }
            onClick={onClose}
          >
            Profile
          </NavLink>
          <button
            type="button"
            className="user-sidebar__link user-sidebar__link--danger"
            onClick={() => {
              onClose();
              logout();
            }}
          >
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
