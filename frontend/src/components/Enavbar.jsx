import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Enavbar.css";

const NAV_LINKS = [
  { label: "Dashboard", to: "/enterprise" },
  { label: "Templates", to: "/enterprise/template" },
  { label: "API", to: "/enterprise/api" },
  { label: "Profile", to: "/enterprise/profile" },
];

const Enavbar = ({ onLogout } = {}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  return (
    <nav className={`enavbar ${isScrolled ? "is-scrolled" : ""}`}>
      <div
        className={`enavbar__backdrop ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsMenuOpen(false)}
      />
      <div className="enavbar__shell">
        <div className="enavbar__brand">
          <NavLink to="/enterprise" className="enavbar__logo">
            AutoDoc<span>AI</span>
          </NavLink>
          <span className="enavbar__badge">Enterprise</span>
        </div>

        <div className={`enavbar__menu ${isMenuOpen ? "is-open" : ""}`}>
          <ul className="enavbar__links" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="enavbar__item">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `enavbar__link ${isActive ? "is-active" : ""}`
                  }
                  end
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button type="button" className="enavbar__logout" onClick={handleLogout}>
            <span className="enavbar__logout-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 7l5 5-5 5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Logout
          </button>
        </div>

        <button
          type="button"
          className={`enavbar__toggle ${isMenuOpen ? "is-open" : ""}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
};

export default Enavbar;
