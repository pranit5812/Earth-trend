import React from 'react';
import { Sparkles } from 'lucide-react';

const SUGGESTIONS_BY_ROUTE = {
  '/forecast': [
    'Will it rain tomorrow at this location?',
    'Give me a 7-day weather forecast',
    'What are the maximum temperatures this week?',
    'Check agricultural climate risk',
  ],
  '/maps': [
    'What climate patterns exist across India?',
    'Which states show opposite trends in rainfall?',
    'Identify regions with highest warming',
    'Analyze climate for current map coordinates',
  ],
  '/compare': [
    'Compare rainfall trends between Gujarat and Maharashtra',
    'Which state shows steeper warming?',
    'Are regional differences statistically significant?',
  ],
  '/reports': [
    'Summarize temperature changes across Indian states',
    'Which regions have the strongest drying trends?',
    'What datasets are used in AstroKites reports?',
  ],
  default: [
    'What is the current weather in my area?',
    'What is the historical temperature trend in Ahmedabad?',
    'Compare rainfall trends in Ahmedabad and Mumbai',
    'Will it rain tomorrow in Bengaluru?',
    'Explain the Mann-Kendall test in simple terms',
  ],
};

const ChatSuggestions = ({ route = '/', onSelect = () => {}, isGenerating = false }) => {
  const suggestions = SUGGESTIONS_BY_ROUTE[route] || SUGGESTIONS_BY_ROUTE.default;

  return (
    <div className="ak-chat-suggestions-bar">
      <div className="ak-chat-suggestions-title">
        <Sparkles size={12} className="ak-chat-sparkle-icon" />
        <span>Suggested questions:</span>
      </div>
      <div className="ak-chat-chips-scroll">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="ak-chat-chip"
            onClick={() => !isGenerating && onSelect(suggestion)}
            disabled={isGenerating}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSuggestions;
