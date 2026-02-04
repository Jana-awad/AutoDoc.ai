import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar';
import Footer from '../../components/Footer';
import './Pricing.css';

const Pricing = () => {
  const businessFeatures = [
    'Access to global, pre-built document templates',
    'AI-powered document → JSON extraction',
    'Secure API access with encryption',
    'Up to 10 team members',
    'Standard processing priority',
    'Versioned JSON outputs',
    'Audit-friendly structured data',
    'Encrypted document handling',
    'Email support (24-48h response)',
  ];

  const enterpriseFeatures = [
    'Create & manage custom templates',
    'Unlimited team members',
    'Priority & faster processing',
    'Custom schema definitions',
    'Dedicated API rate limits',
    'Enterprise-grade security & privacy',
    'Compliance-ready architecture (SOC2, HIPAA)',
    'Multi-workspace support',
    'Usage analytics & monitoring dashboard',
  ];


  return (
    <>
      <Navbar />
      <main className="pricing-page">
        {/* Hero Section */}
        <section className="pricing-hero">
          <div className="pricing-hero-bg">
            <div className="pricing-hero-shape pricing-hero-shape-1"></div>
            <div className="pricing-hero-shape pricing-hero-shape-2"></div>
            <div className="pricing-hero-shape pricing-hero-shape-3"></div>
          </div>
          <div className="container">
            <div className="pricing-hero-content">
              <h1 className="pricing-hero-title">
                Pricing built for scale, security, and serious businesses.
              </h1>
              <p className="pricing-hero-subtitle">
                API-first document intelligence with enterprise-grade security. 
                Transform any document into structured JSON data — reliably, securely, at scale.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="pricing-cards-section">
          <div className="container">
            <div className="pricing-cards-grid">
              {/* Business Plan */}
              <div className="pricing-card pricing-card-business">
                <div className="pricing-card-badge">Best for Growing Teams</div>
                <div className="pricing-card-header">
                  <h3 className="pricing-card-name">Business</h3>
                  <p className="pricing-card-description">
                    For growing teams and professional use
                  </p>
                </div>
                <div className="pricing-card-price">
                  <span className="pricing-price-currency">$</span>
                  <span className="pricing-price-amount">49</span>
                  <span className="pricing-price-period">/ month</span>
                </div>
                <ul className="pricing-card-features">
                  {businessFeatures.map((feature, index) => (
                    <li key={index} className="pricing-feature-item">
                      <svg className="pricing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?plan=business" className="btn btn-secondary pricing-card-btn">
                  Get Started
                </Link>
                <p className="pricing-card-note">
                  Most cost-effective entry for serious teams
                </p>
              </div>

              {/* Enterprise Plan */}
              <div className="pricing-card pricing-card-enterprise">
                <div className="pricing-card-badge pricing-badge-enterprise">Most Powerful</div>
                <div className="pricing-card-glow"></div>
                <div className="pricing-card-header">
                  <h3 className="pricing-card-name">Enterprise</h3>
                  <p className="pricing-card-description">
                    For organizations that demand full control
                  </p>
                </div>
                <div className="pricing-card-price">
                  <span className="pricing-price-currency">$</span>
                  <span className="pricing-price-amount">99</span>
                  <span className="pricing-price-period">/ month</span>
                </div>
                <ul className="pricing-card-features">
                  {enterpriseFeatures.map((feature, index) => (
                    <li key={index} className="pricing-feature-item">
                      <svg className="pricing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?plan=enterprise" className="btn btn-primary pricing-card-btn">
                  Get Started
                </Link>
                <p className="pricing-card-note">
                  Complete control, unlimited scale, premium support
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="pricing-trust-section">
          <div className="container">
            <div className="pricing-trust-grid">
              <div className="pricing-trust-card">
                <div className="pricing-trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="pricing-trust-title">Security-First Architecture</h3>
                <p className="pricing-trust-text">
                  Designed for organizations that handle sensitive documents. 
                  Your data stays private. Always.
                </p>
              </div>
              <div className="pricing-trust-card">
                <div className="pricing-trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <h3 className="pricing-trust-title">Real-World Workflows</h3>
                <p className="pricing-trust-text">
                  Built for actual document processing needs — invoices, contracts, 
                  medical records, legal filings.
                </p>
              </div>
              <div className="pricing-trust-card">
                <div className="pricing-trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 className="pricing-trust-title">Reliable & Predictable</h3>
                <p className="pricing-trust-text">
                  Consistent JSON output you can depend on. 
                  Build automations that work, every time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pricing-cta-section">
          <div className="pricing-cta-bg">
            <div className="pricing-cta-glow"></div>
          </div>
          <div className="container">
            <div className="pricing-cta-container">
              <h2 className="pricing-cta-title">
                Start Building with AutoDoc AI
              </h2>
              <p className="pricing-cta-subtitle">
                Upgrade your document intelligence. Transform documents into structured data today.
              </p>
              <div className="pricing-cta-buttons">
                <Link to="/signup" className="btn btn-primary pricing-cta-btn">
                  Get Started
                </Link>
                <button className="btn btn-secondary pricing-cta-btn">
                  Contact Sales
                </button>
              </div>
              <p className="pricing-cta-note">
                Empowering projects with intelligent document processing
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Pricing;
