import { Link } from 'react-router-dom';
import Navbar from "../../components/navbar";
import Footer from "../../components/Footer";

import './about.css';

const About = () => {
  const missionItems = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      title: 'Eliminate Manual Work',
      text: 'Automate repetitive document processing tasks and free your team for higher-value work.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'Reduce Human Error',
      text: 'AI-powered extraction ensures consistent accuracy across all document types.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      ),
      title: 'Scale with Confidence',
      text: 'Process thousands of documents with the same precision as one.'
    }
  ];

  const securityItems = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: 'Data Encryption',
      text: 'End-to-end encryption for all documents in transit and at rest.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Privacy First',
      text: 'Your data is never used for training. Complete data isolation guaranteed.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Access Control',
      text: 'Role-based permissions and audit logs for complete visibility.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: 'Compliance Ready',
      text: 'Built for SOC 2, GDPR, HIPAA, and enterprise compliance standards.'
    }
  ];

  const visionItems = [
    'AI-powered intelligent document workflows',
    'Seamless integration with existing systems',
    'Real-time processing at enterprise scale',
    'Continuous learning and improvement'
  ];

  const trustLogos = ['Enterprise Co.', 'TechCorp', 'DataFlow', 'SecureInc', 'ScalePro'];

  return (
    <div className="about-page">
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">
              Building Trust Through Intelligent Document Processing
            </h1>
            <p className="about-hero-description">
              AutoDoc AI helps organizations transform documents into structured, secure, 
              and reliable data using advanced AI technology.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-badge">Our Purpose</span>
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-section-subtitle">
              We exist to make document intelligence accessible, secure, and scalable for every organization.
            </p>
          </div>
          <div className="mission-grid">
            {missionItems.map((item, index) => (
              <div className="mission-card" key={index}>
                <div className="mission-icon">{item.icon}</div>
                <h3 className="mission-card-title">{item.title}</h3>
                <p className="mission-card-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="about-security">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-badge">Enterprise Grade</span>
            <h2 className="about-section-title">Security & Privacy First</h2>
            <p className="about-section-subtitle">
              Data privacy is not just a feature—it's our core principle. Every document is processed 
              with enterprise-level security and complete confidentiality.
            </p>
          </div>
          <div className="security-grid">
            {securityItems.map((item, index) => (
              <div className="security-card" key={index}>
                <div className="security-icon">{item.icon}</div>
                <h3 className="security-card-title">{item.title}</h3>
                <p className="security-card-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-vision">
        <div className="container">
          <div className="vision-content">
            <div className="vision-text">
              <h2>Our Vision</h2>
              <p>
                We're building the foundation for a future where document processing 
                is invisible, intelligent, and instantaneous. No more manual data entry. 
                No more operational friction. Just seamless automation.
              </p>
              <p>
                Our vision is to enable every organization—from startups to enterprises—
                to make smarter decisions faster by unlocking the data trapped in their documents.
              </p>
              <div className="vision-list">
                {visionItems.map((item, index) => (
                  <div className="vision-list-item" key={index}>
                    <span className="vision-list-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="vision-visual">
              <div className="vision-graphic">
                <div className="vision-circle vision-circle-1"></div>
                <div className="vision-circle vision-circle-2"></div>
                <div className="vision-circle vision-circle-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="about-trust">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-title">Trusted by Teams That Value Precision</h2>
            <p className="about-section-subtitle">
              Built for enterprises, startups, and developers who need reliable, scalable document processing.
            </p>
          </div>
          <div className="trust-logos">
            {trustLogos.map((logo, index) => (
              <div className="trust-logo" key={index}>{logo}</div>
            ))}
          </div>
          <div className="trust-testimonial">
            <p className="trust-quote">
              "AutoDoc AI transformed how we handle invoices. What used to take days now happens in minutes, 
              with accuracy we couldn't achieve manually."
            </p>
            <p className="trust-author">
              <strong>Head of Operations</strong> — Enterprise Customer
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container about-cta-container">
          <div className="about-cta-card">
            <div className="about-cta-content">
              <h2 className="about-cta-title">Build Smarter Document Workflows</h2>
              <p className="about-cta-text">
                Start transforming documents into structured data today.
              </p>
              <Link to="/signup" className="about-cta-button">
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

    