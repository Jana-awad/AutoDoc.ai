import { Link } from 'react-router-dom';
import './CTA.css';

const CTA = () => {

  return (
    <section className="cta section" id="contact">
      <div className="cta-background">
        <div className="cta-glow"></div>
      </div>

      <div className="container">
        <div className="cta-container">
          <h2 className="cta-title">
            Start Automating Your Documents Today
          </h2>
          <p className="cta-subtitle">
            Join thousands of teams processing millions of documents with AutoDoc AI
          </p>

          <div className="cta-form">
            <Link to="/signup" className="btn btn-primary cta-submit">
              Get Started
            </Link>
          </div>

          <p className="cta-disclaimer">
            Join thousands of teams already transforming their document workflows
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
