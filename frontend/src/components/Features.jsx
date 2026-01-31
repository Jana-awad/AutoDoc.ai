import './Features.css';

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 13a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-4z" />
      </svg>
    ),
    title: 'AI Document Parsing',
    description: 'Advanced OCR and LLM extract data from any document type with human-level accuracy.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Template Recognition',
    description: 'Auto-detect document layouts and apply intelligent templates for consistent extraction.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        <path d="M15 5l4 4" />
      </svg>
    ),
    title: 'Structured JSON Output',
    description: 'Clean, standardized JSON output ready for your APIs, databases, or workflows.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Enterprise Security',
    description: ' End-to-end encryption. Your data never leaves your control.',
  },
];

const Features = () => {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="features-header">
          <span className="features-label">Core Features</span>
          <h2 className="features-title">
            <span className="features-title-word">Intelligent </span>
            <span className="features-title-word">Document </span>
            <span className="features-title-word">Processing </span>
            <span className="features-title-word">Engine</span>
          </h2>
          
          <p className="features-subtitle">
            Powered by state-of-the-art AI models 
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              className="feature-card" 
              key={index}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-card-glow"></div>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
