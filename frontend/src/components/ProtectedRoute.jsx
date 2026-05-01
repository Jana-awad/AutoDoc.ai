import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRoleHome, useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading, session } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    // Pass `expired` so the login page can show "Your session expired" instead
    // of nothing. We rely on the fact that AuthContext only flips this to
    // false after a real boot OR after the global session-expired event.
    const wasLoggedIn = Boolean(session === null && location.pathname !== "/login");
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, expired: wasLoggedIn }}
      />
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
