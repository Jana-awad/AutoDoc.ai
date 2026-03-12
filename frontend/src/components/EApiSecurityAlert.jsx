/**
 * EApiSecurityAlert - Security best-practices alert for API keys section.
 */
import "./EApiSecurityAlert.css";

function EApiSecurityAlert() {
  return (
    <div className="e-api-security-alert glass-card">
      <span className="e-api-security-alert__icon" aria-hidden>!</span>
      <div className="e-api-security-alert__content">
        <h4 className="e-api-security-alert__title">Security best practices</h4>
        <p className="e-api-security-alert__text">
          Never share API keys in client-side code or public repos. Rotate keys if exposed.
          Use environment variables and restrict keys by IP when possible.
        </p>
      </div>
    </div>
  );
}

export default EApiSecurityAlert;
