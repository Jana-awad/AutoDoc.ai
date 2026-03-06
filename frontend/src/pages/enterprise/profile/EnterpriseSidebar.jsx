import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { fetchEnterpriseAccountInfo } from "../../../services/enterpriseProfileApi";
import { formatText, getInitials, pickValue } from "../../../utils/profileFormatters";

const PROFILE_BASE = "/enterprise/profile";

const EnterpriseSidebar = () => {
  const location = useLocation();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchEnterpriseAccountInfo({ token, signal: controller.signal })
      .then((data) => setProfile(data || null))
      .catch(() => setProfile(null));
    return () => controller.abort();
  }, [token]);

  const userName = formatText(profile?.name);
  const userSub = formatText(pickValue(profile?.company, profile?.email));
  const initials = getInitials(profile?.name);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isAccountActive =
    location.pathname === PROFILE_BASE || isActive(`${PROFILE_BASE}/account`);

  const links = [
    { label: "Account Info", to: `${PROFILE_BASE}/account`, active: isAccountActive },
    { label: "Manage Users", to: `${PROFILE_BASE}/users`, active: isActive(`${PROFILE_BASE}/users`) },
    { label: "Billing", to: `${PROFILE_BASE}/billing`, active: isActive(`${PROFILE_BASE}/billing`) },
    { label: "Settings", to: `${PROFILE_BASE}/settings`, active: isActive(`${PROFILE_BASE}/settings`) },
  ];

  return (
    <aside className="b-sidebar">
      <div className="b-sidebar-top">
        <div className="b-sidebar-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </div>
        <div className="b-sidebar-platform">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Enterprise Document Processing</span>
        </div>
      </div>

      <div className="b-sidebar-user">
        <div className="b-sidebar-avatar">{initials}</div>
        <div className="b-sidebar-user-info">
          <div className="b-sidebar-user-name">{userName}</div>
          <div className="b-sidebar-user-sub">{userSub}</div>
        </div>
      </div>

      <nav className="b-sidebar-nav">
        <div className="b-sidebar-section-label">Management</div>
        {links.slice(0, 3).map((link) => (
          <Link key={link.to} to={link.to} className={`b-sidebar-link ${link.active ? "active" : ""}`}>
            {link.label === "Account Info" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            {link.label === "Manage Users" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
            {link.label === "Billing" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            )}
            {link.label}
          </Link>
        ))}

        <div className="b-sidebar-section-label">Preferences</div>
        {links.slice(3).map((link) => (
          <Link key={link.to} to={link.to} className={`b-sidebar-link ${link.active ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="b-sidebar-back">
        <Link to="/enterprise">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
};

export default EnterpriseSidebar;
