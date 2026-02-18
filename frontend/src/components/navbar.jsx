import { useState, useEffect } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeLink = NAV_LINKS.find((link) => link.path === location.pathname)?.name ?? 'Home';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    // Scroll to top when link is clicked
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" onClick={handleLinkClick}>
            AutoDoc
          </Link>
        </div>

        <div className="navbar-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`navbar-link ${activeLink === link.name ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <Link
            to="/login"
            className="navbar-login-btn"
            onClick={handleLinkClick}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="navbar-cta-btn"
            onClick={handleLinkClick}
          >
            Get Started
          </Link>
        </div>

        <button
          className={`navbar-mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`navbar-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="navbar-mobile-content">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`navbar-mobile-link ${activeLink === link.name ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              {link.name}
            </Link>
          ))}
          <div className="navbar-mobile-actions">
            <Link
              to="/login"
              className="navbar-mobile-login-btn"
              onClick={handleLinkClick}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="navbar-mobile-cta-btn"
              onClick={handleLinkClick}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
