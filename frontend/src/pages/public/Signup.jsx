import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import Navbar from '../../components/navbar';
import Footer from '../../components/Footer';
import './Signup.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const stripePromise = loadStripe('pk_test_your_publishable_key_here');
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0a1628',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};
// Icons
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
// Signup Form Component
const SignupForm = ({ plan, onSwitchPlan }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const isEnterprise = plan === 'enterprise';
  const price = isEnterprise ? 99 : 49;
  const planName = isEnterprise ? 'Enterprise' : 'Business';
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/signup/${isEnterprise ? 'enterprise' : 'business'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_name: formData.companyName,
            company_name: formData.companyName,
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
            client_type: isEnterprise ? 'enterprise' : 'business',
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || 'Unable to create your account. Please try again.');
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return (
      <div className="success-message">
        <div className="success-icon">
          <CheckIcon />
        </div>
        <h2 className="success-title">Welcome to AutoDoc AI!</h2>
        <p className="success-text">
          Your {planName} account has been created successfully.
          Check your email for next steps.
        </p>
        <Link to="/" className="success-button">
          Go to Dashboard
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="plan-badge" data-plan={plan}>
        {isEnterprise ? '★ Enterprise Plan' : 'Business Plan'}
      </div>
      
      <div className="switch-plan-top">
        <button className="switch-link" onClick={onSwitchPlan}>
          {isEnterprise 
            ? <>Signing up as a Business instead? <strong>Switch to Business Plan</strong></>
            : <>Need more power? <strong>Switch to Enterprise Plan</strong></>
          }
        </button>
      </div>
      
      <div className="signup-header">
        <h1 className="signup-title">
          {isEnterprise 
            ? 'Enterprise-grade Document Intelligence'
            : 'Start building with AutoDoc.ai'
          }
        </h1>
        <p className="signup-subtitle">
          {isEnterprise
            ? 'Full control, unlimited scale, maximum security'
            : 'Professional document processing made simple'
          }
        </p>
      </div>
      <div className="price-display">
        <span className="price-amount">${price}</span>
        <span className="price-period">/ month</span>
      </div>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className="form-input"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            {isEnterprise ? 'Work Email' : 'Email'}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength="8"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-input"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            className="form-input"
            placeholder="Your company name"
            value={formData.companyName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="stripe-section">
          <h3 className="stripe-section-title">
            <CreditCardIcon />
            Payment Information (optional)
          </h3>
          <div className="stripe-element-container">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <button
          type="submit"
          className={`submit-button ${isEnterprise ? '' : 'business-btn'} ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          <span className="button-text">
            {loading ? 'Processing...' : `Create ${planName} Account`}
          </span>
        </button>
      </form>
      <div className="signin-link">
        <p className="signin-text">
          Already have an account? <Link to="/login" className="signin-link-text">Sign in</Link>
        </p>
      </div>
    </>
  );
};
// Main Signup Component
const Signup = () => {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const [currentPlan, setCurrentPlan] = useState(
    planFromUrl === 'business' ? 'business' : 'enterprise'
  );

  useEffect(() => {
    if (planFromUrl === 'business' || planFromUrl === 'enterprise') {
      setCurrentPlan(planFromUrl);
    }
  }, [planFromUrl]);

  const handleSwitchPlan = () => {
    setCurrentPlan(prev => prev === 'enterprise' ? 'business' : 'enterprise');
  };
  return (
    <div className="signup-page">
      <Navbar />
      
      <main className="signup-main">
        <div className="signup-container">
          <div className="signup-form-wrapper">
            {/* Enterprise Card */}
            <div className={`signup-card enterprise ${currentPlan === 'enterprise' ? 'active' : 'inactive-left'}`}>
              <Elements stripe={stripePromise}>
                <SignupForm plan="enterprise" onSwitchPlan={handleSwitchPlan} />
              </Elements>
            </div>
            {/* Business Card */}
            <div className={`signup-card business ${currentPlan === 'business' ? 'active' : 'inactive-right'}`}>
              <Elements stripe={stripePromise}>
                <SignupForm plan="business" onSwitchPlan={handleSwitchPlan} />
              </Elements>
            </div>
          </div>
          {/* Trust Indicators */}
          <div className="trust-section">
            <div className="trust-item">
              <LockIcon />
              <span>Secure authentication workflow</span>
            </div>
            <div className="trust-item">
              <ShieldIcon />
              <span>Enterprise-grade encryption</span>
            </div>
            <div className="trust-item">
              <CheckIcon />
              <span>Credentials protected with secure hashing</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Signup;