import './HowItWorks.css';

const steps = [
  {
    number: 1,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    title: 'Upload Document',
    description: 'Scan your document using physical scanner and send it through apis',
  },
  {
    number: 2,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    title: 'AI Analysis',
    description: 'Our models analyze structure, text, and context',
  },
  {
    number: 3,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    title: 'Template Detection',
    description: 'Auto-match to known formats or create new templates',
  },
  {
    number: 4,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
    title: 'Structured Output',
    description: 'Receive clean JSON ready for your systems',
  },
];

const HowItWorks = () => {
  return (
    <section className="how-it-works section" id="how-it-works">
      <div className="container">
        <div className="how-it-works-header">
          <span className="how-it-works-label">Workflow</span>
          <h2 className="how-it-works-title">How It Works</h2>
          <p className="how-it-works-subtitle">
            From document to data in four simple steps
          </p>
        </div>

        <div className="workflow-container">
          {steps.map((step, index) => (
            <div className="workflow-step" key={index}>
              <div className="workflow-number">{step.number}</div>
              <div className="workflow-icon">{step.icon}</div>
              <h3 className="workflow-title">{step.title}</h3>
              <p className="workflow-description">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="workflow-connector"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
