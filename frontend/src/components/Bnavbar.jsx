import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Bnavbar.css";

const NAV_LINKS = [
  { label: "Home", to: "/business" },
  { label: "API", to: "/business/api" },
  { label: "Profile", to: "/business/profile" },
];

const Bnavbar = ({ onLogout } = {}) => {
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
    <nav className={`bnavbar ${isScrolled ? "is-scrolled" : ""}`}>
      <div
        className={`bnavbar__backdrop ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsMenuOpen(false)}
      />
      <div className="bnavbar__shell">
        <div className="bnavbar__brand">
          <NavLink to="/business" className="bnavbar__logo">
            AutoDoc<span>AI</span>
          </NavLink>
          <span className="bnavbar__badge">Business</span>
        </div>

        <div className={`bnavbar__menu ${isMenuOpen ? "is-open" : ""}`}>
          <ul className="bnavbar__links" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="bnavbar__item">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `bnavbar__link ${isActive ? "is-active" : ""}`
                  }
                  end
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button type="button" className="bnavbar__logout" onClick={handleLogout}>
            <span className="bnavbar__logout-icon" aria-hidden="true">
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
          className={`bnavbar__toggle ${isMenuOpen ? "is-open" : ""}`}
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

export default Bnavbar;
