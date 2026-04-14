import "./Header.css";

function Header({ displayName, companyName, profileError }) {
  return (
    <header className="user-header">
      <div className="user-header__inner">
        {profileError ? (
          <p className="user-header__error" role="alert">
            {profileError}
          </p>
        ) : null}
        <div className="user-header__meta">
          <div className="user-header__block">
            <span className="user-header__label">Signed in as</span>
            <span className="user-header__value">{displayName || "…"}</span>
          </div>
          <div className="user-header__divider" aria-hidden />
          <div className="user-header__block">
            <span className="user-header__label">Company</span>
            <span className="user-header__value">{companyName || "…"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
