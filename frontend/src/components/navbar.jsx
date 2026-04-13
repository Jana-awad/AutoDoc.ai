import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Contact Us', path: '/contact' },
];

const Navbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLink = NAV_LINKS.find((link) => link.path === location.pathname)?.name ?? 'Home';

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeMenu]);

  const handleLinkClick = () => {
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__bar">
          <Link to="/" className="navbar__logo" onClick={handleLinkClick}>
            AutoDoc
          </Link>

          {/* Desktop: center links */}
          <nav className="navbar__nav" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`navbar__nav-link ${activeLink === link.name ? 'navbar__nav-link--active' : ''}`}
                onClick={handleLinkClick}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop: actions */}
          <div className="navbar__actions">
            <Link to="/login" className="navbar__btn navbar__btn--secondary" onClick={handleLinkClick}>
              Login
            </Link>
            <Link to="/signup" className="navbar__btn navbar__btn--primary" onClick={handleLinkClick}>
              Get Started
            </Link>
          </div>

          {/* Mobile: burger button */}
          <button
            type="button"
            className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="navbar-drawer"
          >
            <span className="navbar__burger-line" />
            <span className="navbar__burger-line" />
            <span className="navbar__burger-line" />
          </button>
        </div>
      </header>

      {/* Mobile: backdrop (tap to close) */}
      <div
        id="navbar-backdrop"
        className={`navbar__backdrop ${menuOpen ? 'navbar__backdrop--open' : ''}`}
        onClick={closeMenu}
        onKeyDown={(e) => e.key === 'Enter' && closeMenu()}
        role="button"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Mobile: drawer */}
      <div
        id="navbar-drawer"
        className={`navbar__drawer ${menuOpen ? 'navbar__drawer--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="navbar__drawer-inner">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`navbar__drawer-link ${activeLink === link.name ? 'navbar__drawer-link--active' : ''}`}
              onClick={handleLinkClick}
            >
              {link.name}
            </Link>
          ))}
          <div className="navbar__drawer-actions">
            <Link to="/login" className="navbar__drawer-btn navbar__drawer-btn--secondary" onClick={handleLinkClick}>
              Login
            </Link>
            <Link to="/signup" className="navbar__drawer-btn navbar__drawer-btn--primary" onClick={handleLinkClick}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
