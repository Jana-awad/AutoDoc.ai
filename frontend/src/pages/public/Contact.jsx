import { useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/Footer';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    subject: '',
    message: '',
    documentVolume: '',
    useCase: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.companyName || !formData.message) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      setSubmitted(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  if (submitted) {
    return (
      <div className="contact-page">
        <Navbar />
        <main className="contact-main">
          <div className="contact-success">
            <div className="success-icon">
              <CheckIcon />
            </div>
            <h1 className="success-title">Message Sent</h1>
            <p className="success-message">
              Thank you for contacting AutoDoc.ai. Our team will respond within 24 hours.
            </p>
            <a href="/" className="success-button">Return to Home</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="contact-page">
      <Navbar />
      
      <main className="contact-main">
        {/* Hero Section */}
        <section className="contact-hero">
          <div className="contact-hero-background">
            <div className="contact-hero-glow"></div>
          </div>
          <div className="container">
            <div className="contact-hero-content">
              <h1 className="contact-hero-title">
                Let's talk about your document intelligence needs
              </h1>
              <p className="contact-hero-subtitle">
                Enterprise-grade security, unlimited scale, and compliance-ready infrastructure. 
                Connect with our team to discuss your requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact-form" className="contact-form-section">
          <div className="container">
            <div className="contact-form-wrapper">
              <div className="contact-form-card">
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName" className="form-label">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Work Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="companyName" className="form-label">
                        Company Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        className="form-input"
                        placeholder="Your Company"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject" className="form-label">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        className="form-input"
                        value={formData.subject}
                        onChange={handleInputChange}
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="enterprise">Enterprise Integration</option>
                        <option value="security">Security & Compliance</option>
                        <option value="pricing">Pricing & Plans</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership Opportunity</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="documentVolume" className="form-label">
                        Estimated Document Volume
                      </label>
                      <select
                        id="documentVolume"
                        name="documentVolume"
                        className="form-input"
                        value={formData.documentVolume}
                        onChange={handleInputChange}
                      >
                        <option value="">Select volume</option>
                        <option value="low">1 - 1,000 documents/month</option>
                        <option value="medium">1,000 - 10,000 documents/month</option>
                        <option value="high">10,000 - 100,000 documents/month</option>
                        <option value="enterprise">100,000+ documents/month</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="useCase" className="form-label">
                        Primary Use Case
                      </label>
                      <input
                        type="text"
                        id="useCase"
                        name="useCase"
                        className="form-input"
                        placeholder="e.g., Invoice processing, Contract analysis"
                        value={formData.useCase}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      Message <span className="required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className="form-textarea"
                      rows="6"
                      placeholder="Tell us about your document processing needs, security requirements, or any specific questions..."
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>

                  {error && (
                    <div className="form-error">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className={`contact-submit-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* Trust Layer */}
              <div className="contact-trust">
                <div className="trust-item">
                  <div className="trust-icon">
                    <ClockIcon />
                  </div>
                  <div className="trust-content">
                    <h3 className="trust-title">24-Hour Response</h3>
                    <p className="trust-text">We respond to all inquiries within 24 hours</p>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon">
                    <LockIcon />
                  </div>
                  <div className="trust-content">
                    <h3 className="trust-title">Enterprise-First Communication</h3>
                    <p className="trust-text">Your information remains private and secure</p>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon">
                    <ShieldIcon />
                  </div>
                  <div className="trust-content">
                    <h3 className="trust-title">Compliance-Ready</h3>
                    <p className="trust-text">SOC 2, GDPR, and HIPAA compliant infrastructure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Support Section */}
        <section className="contact-enterprise">
          <div className="container">
            <div className="enterprise-card">
              <div className="enterprise-content">
                <h2 className="enterprise-title">
                  Enterprise Integrations & Custom Deployments
                </h2>
                <p className="enterprise-description">
                  For enterprise integrations, security reviews, custom deployments, or dedicated infrastructure, 
                  our team is ready to assist with your specific requirements.
                </p>
                <a 
                  href="#contact-form" 
                  className="enterprise-button"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact-form')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }}
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
