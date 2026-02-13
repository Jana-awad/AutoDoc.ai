import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchEnterpriseProfile } from "../services/enterpriseDashboardApi";

function EDashboardHeader() {
  const { token, session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await fetchEnterpriseProfile({ token, signal: controller.signal });
        if (isActive) setProfile(data);
      } catch (error) {
        if (isActive) setProfile(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token]);

  const displayName =
    profile?.name || profile?.fullName || profile?.email || session?.userId || "";

  return (
    <header className="edashboard-header">
      <div className="edashboard-header__intro">
        <span className="edashboard-header__eyebrow">Enterprise Admin Dashboard</span>
        <h1 className="edashboard-header__title">AI Document Operations Overview</h1>
        <p className="edashboard-header__subtitle">
          Monitor AI extraction performance, template intelligence, and enterprise-grade system
          health in real time.
        </p>
      </div>
      <div className="edashboard-welcome glass-card">
        <div className="edashboard-welcome__content">
          <span className="edashboard-welcome__label">Welcome back</span>
          {loading ? (
            <span className="edashboard-welcome__name edashboard-skeleton-line" />
          ) : (
            <span className="edashboard-welcome__name">{displayName}</span>
          )}
        </div>
        <div className="edashboard-welcome__meta">
          <div>
            <span className="edashboard-welcome__meta-label">Workspace</span>
            <span className="edashboard-welcome__meta-value">
              {profile?.organization || profile?.workspace || "—"}
            </span>
          </div>
          <div>
            <span className="edashboard-welcome__meta-label">Plan</span>
            <span className="edashboard-welcome__meta-value">{profile?.plan || "—"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default EDashboardHeader;
