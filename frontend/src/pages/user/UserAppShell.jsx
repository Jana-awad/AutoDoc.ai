import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "../../components/variables.css";
import "../../components/global.css";
import ErrorBoundary from "../../components/ErrorBoundary";
import { ToastProvider } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { fetchUserProfile } from "../../services/userDashboardApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import "./UserAppShell.css";

function UserAppShell() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const loadProfile = useCallback(
    async (signal) => {
      try {
        setProfileError(null);
        const data = await fetchUserProfile({ token, signal });
        setProfile(data);
      } catch (e) {
        if (e.name !== "AbortError") {
          setProfileError(e.message || "Unable to load profile.");
        }
      }
    },
    [token]
  );

  useEffect(() => {
    const ac = new AbortController();
    loadProfile(ac.signal);
    return () => ac.abort();
  }, [loadProfile]);

  const displayName = profile?.username || profile?.email || "";
  const companyName = profile?.company_name || "";

  return (
    <ToastProvider>
      <div className={`user-app ${sidebarOpen ? "user-app--sidebar-open" : ""}`}>
        <a className="user-app__skip-link" href="#user-main">
          Skip to main content
        </a>

        <button
          type="button"
          className="user-app__menu-btn"
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          aria-hidden={sidebarOpen}
          aria-controls="user-sidebar"
          tabIndex={sidebarOpen ? -1 : 0}
          onClick={() => setSidebarOpen(true)}
        >
          <span className="user-app__menu-icon" />
        </button>

        <button
          type="button"
          className="user-app__backdrop"
          aria-label="Close menu"
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <Header displayName={displayName} companyName={companyName} profileError={profileError} />

        <main id="user-main" className="user-app__main" tabIndex={-1}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}

export default UserAppShell;
