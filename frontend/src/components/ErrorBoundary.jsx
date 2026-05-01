import { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Catches uncaught render errors in any subtree so a single broken card does
 * not nuke the whole user shell. Pass `fallback` for custom UI; otherwise
 * a friendly inline message + Retry button is shown.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info);
    }
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, info?.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
    if (typeof this.props.onRetry === "function") this.props.onRetry();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.handleRetry);

    return (
      <div className="errboundary" role="alert">
        <div className="errboundary__icon" aria-hidden>!</div>
        <div className="errboundary__body">
          <p className="errboundary__title">Something went wrong</p>
          <p className="errboundary__message">
            {this.state.error?.message || "An unexpected error stopped this section from loading."}
          </p>
          <button type="button" className="errboundary__retry" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
