import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuperBreadcrumbs from './SuperBreadcrumbs';
import './SuperNav.css';

const LogoMark = () => (
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5ba3e0" />
        <stop offset="100%" stopColor="#1e3a5f" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="24" height="24" rx="8" fill="url(#logoGradient)" />
    <path
      d="M9 11.5h10M9 16.5h7"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TemplateIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5" />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z" />
  </svg>
);

const PipelineIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 5h6v6H5zM13 13h6v6h-6z" />
    <path d="M11 8h2v8h-2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClientsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0z" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const BillingIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16v12H4z" />
    <path d="M4 10h16" />
  </svg>
);

const MonitorIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 4h18v12H3z" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M21 21l-4.3-4.3"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

const defaultMegaMenus = {
  dashboard: {
    title: 'Dashboard',
    description: 'Super admin home and key metrics.',
    columns: [
      {
        heading: 'Pages',
        items: [
          { title: 'Dashboard', description: 'Overview and key metrics.', path: '/super', icon: <DashboardIcon /> },
          { title: 'Operations hub', description: 'Platform flags, audit, exports, health.', path: '/super/operations', icon: <MonitorIcon /> },
        ],
      },
    ],
  },
  templates: {
    title: 'Template & AI',
    description: 'Design, manage, and deploy extraction templates.',
    columns: [
      {
        heading: 'Pages',
        items: [
          { title: 'Templates overview', description: 'Overview of templates and AI extraction.', path: '/super/templates-ai', icon: <TemplateIcon /> },
          { title: 'Template builder', description: 'Create and configure AI extraction templates.', path: '/super/templates-ai/builder', icon: <PipelineIcon /> },
          { title: 'AI overview', description: 'OpenAI, Vision OCR, API keys, webhooks, usage.', path: '/super/templates-ai/ai-overview', icon: <SparkIcon /> },
        ],
      },
    ],
  },
  clients: {
    title: 'Clients & Plans',
    description: 'Manage accounts, subscriptions, and success.',
    columns: [
      {
        heading: 'Client Management',
        items: [
          { title: 'Client Directory', description: 'View and segment client accounts.', path: '/super/clients-plans', icon: <ClientsIcon /> },
          { title: 'Team Access', description: 'Invite admins and manage roles.', path: '/super/clients-plans', icon: <ShieldIcon /> },
          { title: 'Usage Insights', description: 'Track adoption at a glance.', path: '/super/clients-plans', icon: <MonitorIcon /> },
        ],
      },
      {
        heading: 'Plans',
        items: [
          { title: 'Plan Builder', description: 'Configure tiers and limits.', path: '/super/clients-plans', icon: <BillingIcon /> },
          { title: 'Billing Controls', description: 'Manage renewals and invoices.', path: '/super/clients-plans', icon: <BillingIcon /> },
          { title: 'Entitlements', description: 'Define feature access by plan.', path: '/super/clients-plans', icon: <ShieldIcon /> },
        ],
      },
      {
        heading: 'Success',
        items: [
          { title: 'Onboarding', description: 'Guide new customers quickly.', path: '/super/clients-plans', icon: <PipelineIcon /> },
          { title: 'Health Scores', description: 'Spot churn risks early.', path: '/super/clients-plans', icon: <MonitorIcon /> },
          { title: 'Support Queue', description: 'Escalate issues instantly.', path: '/super/clients-plans', icon: <ShieldIcon /> },
        ],
      },
    ],
  },
};

function buildCommandDestinations(navLinks) {
  const list = [];
  Object.values(defaultMegaMenus).forEach((m) => {
    m.columns.forEach((col) => {
      col.items.forEach((item) => {
        list.push({
          path: item.path,
          title: item.title,
          hay: `${item.title} ${item.description}`.toLowerCase(),
        });
      });
    });
  });
  navLinks.forEach((link) => {
    list.push({ path: link.path, title: link.name, hay: link.name.toLowerCase() });
  });
  list.push({
    path: '/super/operations',
    title: 'Operations hub',
    hay: 'operations platform flags audit kill switch exports activity',
  });
  return list;
}

const SuperNav = ({
  userName = 'User',
  userEmail = 'user@autodoc.ai',
  onLogout,
  onSearch,
  onSettings,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const searchRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);
  const [openMega, setOpenMega] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isMac, setIsMac] = useState(false);

  const navLinks = useMemo(
    () => [
      { name: 'Dashboard', path: '/super', mega: 'dashboard' },
      { name: 'Template & AI', path: '/super/templates-ai', mega: 'templates' },
      { name: 'Clients & Plans', path: '/super/clients-plans', mega: 'clients' },
      { name: 'Operations', path: '/super/operations' },
      { name: 'Monitoring', path: '/super/monitoring' },
    ],
    []
  );

  const commandDestinations = useMemo(() => buildCommandDestinations(navLinks), [navLinks]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prefersMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    setIsMac(prefersMac);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let lastScroll = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setIsSolid(current > 8);
      setIsShrunk(current > 32);
      if (current > lastScroll && current > 96) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScroll = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchFocused(true);
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setOpenMega(null);
        setIsMobileOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setOpenMega(null);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const isActive = (path) => {
    if (path === '/super') {
      return location.pathname === '/super';
    }
    return location.pathname.startsWith(path);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const q = searchValue.trim().toLowerCase();
    if (q) {
      const hit = commandDestinations.find(
        (d) => d.hay.includes(q) || d.title.toLowerCase().includes(q)
      );
      if (hit) {
        navigate(hit.path);
        setSearchValue('');
        setIsSearchFocused(false);
        return;
      }
    }
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleProfileBlur = () => {
    requestAnimationFrame(() => {
      if (!navRef.current?.contains(document.activeElement)) {
        setIsProfileOpen(false);
      }
    });
  };

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    }
  };

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={[
        'supernav',
        mounted ? 'supernav--mounted' : '',
        isHidden ? 'supernav--hidden' : '',
        isSolid ? 'supernav--solid' : '',
        isShrunk ? 'supernav--shrunk' : '',
      ].join(' ')}
      ref={navRef}
    >
      <a href="#main-content" className="supernav-skip-link">
        Skip to main content
      </a>
      <div className="supernav-inner">
        <div className="supernav-left">
          <Link to="/super" className="supernav-logo" aria-label="AutoDoc AI">
            <span className="supernav-logo-mark">
              <LogoMark />
            </span>
            <span className="supernav-logo-text">AutoDoc AI</span>
          </Link>

          <nav className="supernav-links" aria-label="Primary">
            {navLinks.map((link) => {
              const hasMega = Boolean(link.mega);
              const isOpen = openMega === link.mega;
              return (
                <div
                  key={link.name}
                  className="supernav-link-wrapper"
                  data-mega={link.mega || undefined}
                  onMouseEnter={() => hasMega && setOpenMega(link.mega)}
                  onMouseLeave={() => hasMega && setOpenMega(null)}
                  onFocus={() => hasMega && setOpenMega(link.mega)}
                  onBlur={() => hasMega && setOpenMega(null)}
                >
                  <Link
                    to={link.path}
                    className={`supernav-link ${isActive(link.path) ? 'active' : ''} ${hasMega ? 'has-mega' : ''}`}
                    aria-haspopup={hasMega ? 'true' : undefined}
                    aria-expanded={hasMega ? isOpen : undefined}
                  >
                    {link.name}
                  </Link>

                  {hasMega && (
                    <div className={`supernav-mega ${isOpen ? 'open' : ''}`} role="menu">
                      <div className="supernav-mega-header">
                        <h3>{defaultMegaMenus[link.mega].title}</h3>
                        <p>{defaultMegaMenus[link.mega].description}</p>
                      </div>
                      <div className="supernav-mega-grid">
                        {defaultMegaMenus[link.mega].columns.map((column, columnIndex) => (
                          <div key={column.heading} className="supernav-mega-column">
                            <span className="supernav-mega-heading">{column.heading}</span>
                            {column.items.map((item, itemIndex) => (
                              <Link
                                key={item.title}
                                to={item.path}
                                className="supernav-mega-item"
                                role="menuitem"
                                style={{ '--stagger': `${(columnIndex * 3 + itemIndex) * 60}ms` }}
                              >
                                <span className="supernav-mega-icon">{item.icon}</span>
                                <span className="supernav-mega-text">
                                  <span className="supernav-mega-title">{item.title}</span>
                                  <span className="supernav-mega-desc">{item.description}</span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="supernav-right">
          <form className={`supernav-search ${isSearchFocused ? 'focused' : ''}`} onSubmit={handleSearchSubmit}>
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search"
            />
            <span className="supernav-search-hint" aria-hidden="true">
              <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
              <kbd>K</kbd>
            </span>
          </form>

          <button className="supernav-theme-toggle" type="button" onClick={handleThemeToggle} aria-label="Toggle theme">
            <span className="theme-icon sun"><SunIcon /></span>
            <span className="theme-icon moon"><MoonIcon /></span>
          </button>

          <button
            className="supernav-logout"
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogoutIcon />
          </button>

          <div className="supernav-profile" onBlur={handleProfileBlur}>
            <button
              className="supernav-avatar"
              type="button"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <span>{initials}</span>
            </button>
            <div className={`supernav-profile-menu ${isProfileOpen ? 'open' : ''}`} role="menu">
              <div className="supernav-profile-header">
                <div>
                  <strong>{userName}</strong>
                  <span>{userEmail}</span>
                </div>
              </div>
              <button type="button" role="menuitem" onClick={handleSettings}>
                Settings
              </button>
              <button type="button" role="menuitem" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          <button
            className={`supernav-mobile-toggle ${isMobileOpen ? 'open' : ''}`}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <SuperBreadcrumbs />

      <div className={`supernav-mobile ${isMobileOpen ? 'open' : ''}`} aria-hidden={!isMobileOpen}>
        <div className="supernav-mobile-header">
          <Link to="/super" className="supernav-logo" aria-label="AutoDoc AI">
            <span className="supernav-logo-mark">
              <LogoMark />
            </span>
            <span className="supernav-logo-text">AutoDoc AI</span>
          </Link>
          <button
            className="supernav-mobile-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileOpen(false)}
          >
            <span />
            <span />
          </button>
        </div>

        <div className="supernav-mobile-content">
          {navLinks.map((link) => {
            if (link.mega) {
              const isOpen = mobileSection === link.mega;
              return (
                <div key={link.name} className="supernav-mobile-section">
                  <button
                    type="button"
                    className="supernav-mobile-link"
                    aria-expanded={isOpen}
                    onClick={() => setMobileSection(isOpen ? null : link.mega)}
                  >
                    <span>{link.name}</span>
                    <span className={`chevron ${isOpen ? 'open' : ''}`} />
                  </button>
                  <div className={`supernav-mobile-submenu ${isOpen ? 'open' : ''}`}>
                    {defaultMegaMenus[link.mega].columns.flatMap((column) => column.items).map((item) => (
                      <Link key={item.title} to={item.path} className="supernav-mobile-item">
                        <span className="supernav-mega-icon">{item.icon}</span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link key={link.name} to={link.path} className="supernav-mobile-link">
                {link.name}
              </Link>
            );
          })}

          <div className="supernav-mobile-actions">
            <button type="button" className="supernav-mobile-action" onClick={handleSettings}>
              Settings
            </button>
            <button type="button" className="supernav-mobile-action" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperNav;
