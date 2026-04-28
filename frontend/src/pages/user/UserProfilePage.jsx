import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { changeUserPassword, fetchUserProfile } from "../../services/userDashboardApi";
import "./UserProfilePage.css";

function strengthLabel(value) {
  const v = value || "";
  const score =
    (v.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(v) ? 1 : 0) +
    (/[a-z]/.test(v) ? 1 : 0) +
    (/[0-9]/.test(v) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(v) ? 1 : 0);
  if (!v) return { text: "—", level: 0 };
  if (score <= 2) return { text: "Weak", level: 1 };
  if (score === 3) return { text: "Good", level: 2 };
  return { text: "Strong", level: 3 };
}

function UserProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const [pwdOk, setPwdOk] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserProfile({ token, signal });
        setProfile(data);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const displayName = useMemo(() => profile?.username || profile?.email || "—", [profile]);
  const companyName = useMemo(() => profile?.company_name || "—", [profile]);
  const strength = useMemo(() => strengthLabel(pwd.next), [pwd.next]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(null);
    setPwdOk(false);

    if (!pwd.current || !pwd.next || !pwd.confirm) {
      setPwdError("Please fill all password fields.");
      return;
    }
    if (pwd.next.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdError("New password and confirmation do not match.");
      return;
    }
    if (pwd.current === pwd.next) {
      setPwdError("New password must be different from current password.");
      return;
    }

    setSavingPwd(true);
    try {
      await changeUserPassword({ token, currentPassword: pwd.current, newPassword: pwd.next });
      setPwd({ current: "", next: "", confirm: "" });
      setPwdOk(true);
    } catch (err) {
      setPwdError(err.message || "Unable to change password.");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-profile__top">
        <Link to="/user" className="user-profile__back">
          <span aria-hidden>←</span> Back to dashboard
        </Link>
        <div className="user-profile__badge" aria-hidden>
          <div className="user-profile__badge-dot" />
          <span>Secure session</span>
        </div>
      </div>

      <header className="user-profile__hero">
        <h1 className="user-profile__title">Profile & Security</h1>
        <p className="user-profile__subtitle">
          Manage your identity details and keep your workspace access secure.
        </p>
      </header>
      {error ? (
        <p className="user-profile__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="user-profile__grid">
        <section className="user-profile__panel">
          <div className="user-profile__panel-head">
            <h2>Account</h2>
            <p>Workspace identity (read-only)</p>
          </div>

          {loading ? <div className="user-profile__skeleton" /> : null}
          {!loading && profile ? (
            <div className="user-profile__account">
              <div className="user-profile__identity">
                <div className="user-profile__avatar" aria-hidden>
                  {(displayName || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="user-profile__account-meta">
                  <div className="user-profile__account-name">{displayName}</div>
                  <div className="user-profile__account-sub">{companyName}</div>
                </div>
              </div>

              <dl className="user-profile__card">
                <div className="user-profile__row">
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div className="user-profile__row">
                  <dt>Company</dt>
                  <dd>{companyName}</dd>
                </div>
                <div className="user-profile__row">
                  <dt>Role</dt>
                  <dd>{profile.role}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </section>

        <section className="user-profile__panel user-profile__panel--security">
          <div className="user-profile__panel-head">
            <h2>Change password</h2>
            <p>Use a strong password to protect your documents and templates.</p>
          </div>

          <form className="user-profile__form" onSubmit={handleChangePassword}>
            <label className="user-profile__field">
              <span>Current password</span>
              <div className="user-profile__input-wrap">
                <input
                  type={show.current ? "text" : "password"}
                  value={pwd.current}
                  onChange={(e) => {
                    setPwdOk(false);
                    setPwdError(null);
                    setPwd((p) => ({ ...p, current: e.target.value }));
                  }}
                  autoComplete="current-password"
                  disabled={savingPwd}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="user-profile__toggle"
                  onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                  aria-label={show.current ? "Hide password" : "Show password"}
                >
                  {show.current ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="user-profile__field">
              <span>New password</span>
              <div className="user-profile__input-wrap">
                <input
                  type={show.next ? "text" : "password"}
                  value={pwd.next}
                  onChange={(e) => {
                    setPwdOk(false);
                    setPwdError(null);
                    setPwd((p) => ({ ...p, next: e.target.value }));
                  }}
                  autoComplete="new-password"
                  disabled={savingPwd}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="user-profile__toggle"
                  onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                  aria-label={show.next ? "Hide password" : "Show password"}
                >
                  {show.next ? "Hide" : "Show"}
                </button>
              </div>
              <div className="user-profile__strength" aria-live="polite">
                <div className={`user-profile__strength-bar user-profile__strength-bar--${strength.level}`} />
                <span>
                  Strength: <b>{strength.text}</b>
                </span>
              </div>
            </label>

            <label className="user-profile__field">
              <span>Confirm new password</span>
              <div className="user-profile__input-wrap">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={pwd.confirm}
                  onChange={(e) => {
                    setPwdOk(false);
                    setPwdError(null);
                    setPwd((p) => ({ ...p, confirm: e.target.value }));
                  }}
                  autoComplete="new-password"
                  disabled={savingPwd}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  className="user-profile__toggle"
                  onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                  aria-label={show.confirm ? "Hide password" : "Show password"}
                >
                  {show.confirm ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {pwdError ? (
              <p className="user-profile__inline-error" role="alert">
                {pwdError}
              </p>
            ) : null}
            {pwdOk ? (
              <p className="user-profile__inline-ok" role="status">
                Password updated successfully.
              </p>
            ) : null}

            <div className="user-profile__form-actions">
              <button type="submit" className="user-profile__cta" disabled={savingPwd}>
                {savingPwd ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default UserProfilePage;
