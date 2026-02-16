/**
 * EUnlimitedBadge - Shows "Unlimited Processing" for Enterprise users.
 */
import "./EUnlimitedBadge.css";

function EUnlimitedBadge({ compact = false }) {
  return (
    <div className={`e-unlimited-badge ${compact ? "e-unlimited-badge--compact" : ""}`}>
      <span className="e-unlimited-badge-icon" aria-hidden>∞</span>
      <span className="e-unlimited-badge-text">Unlimited Processing</span>
    </div>
  );
}

export default EUnlimitedBadge;
