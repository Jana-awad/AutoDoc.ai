import { Link } from 'react-router-dom';
import './Hero.css';
import heroImage from '../assets/hero-illustration.png';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="hero-particles">
          <div className="hero-particle"></div>
          <div className="hero-particle"></div>
          <div className="hero-particle"></div>
          <div className="hero-particle"></div>
          <div className="hero-particle"></div>
          <div className="hero-particle"></div>
        </div>
      </div>

      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>Enterprise AI Platform</span>
          </div>

          <h1 className="hero-title">
            Turn Documents Into{' '}
            <span className="hero-title-highlight">Intelligence</span>
          </h1>

          <p className="hero-description">
            Transform unstructured documents into structured, actionable data 
            with enterprise-grade AI. Process invoices, contracts, and forms 
            in seconds with 99.9% accuracy.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary hero-cta-primary">
              Get Started
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-container">
            <img 
              src={heroImage} 
              alt="AI Document Processing Visualization" 
              className="hero-image"
            />
            
            <div className="hero-floating-card hero-floating-card-1">
              <div className="hero-floating-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="hero-floating-card-text">Invoice Processed</div>
              <div className="hero-floating-card-subtext">Extracted 24 fields</div>
            </div>

            <div className="hero-floating-card hero-floating-card-2">
              <div className="hero-floating-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="hero-floating-card-text">99.9% Accuracy</div>
              <div className="hero-floating-card-subtext">Enterprise grade</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
