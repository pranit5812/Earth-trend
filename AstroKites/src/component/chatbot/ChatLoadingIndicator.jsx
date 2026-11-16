import React, { useState, useEffect } from 'react';
import { Loader2, Globe2 } from 'lucide-react';

const STATUS_STEPS = [
  'Inspecting website context...',
  'Connecting to NASA POWER API & backend services...',
  'Computing Mann-Kendall statistics & Sen’s slope...',
  'Verifying empirical observations against climate records...',
  'Formulating evidence-grounded response...'
];

const ChatLoadingIndicator = ({ activeStep = null }) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (activeStep) return;
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % STATUS_STEPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [activeStep]);

  const displayStatus = activeStep || STATUS_STEPS[stepIdx];

  return (
    <div className="chat-loading-wrapper">
      <div className="chat-loading-bubble">
        <div className="chat-loading-header">
          <Loader2 size={16} className="chat-loading-spinner" />
          <Globe2 size={14} className="chat-loading-globe" />
          <span className="chat-loading-text">{displayStatus}</span>
        </div>
        <div className="chat-loading-dots">
          <span className="dot dot-1"></span>
          <span className="dot dot-2"></span>
          <span className="dot dot-3"></span>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingIndicator;
