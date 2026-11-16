import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend, disabled = false, placeholder = 'Ask about climate trends, NASA observations, weather forecasts...' }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <form className="ak-chat-input-form" onSubmit={handleSubmit}>
      <div className="ak-chat-input-box">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="ak-chat-textarea"
          maxLength={1500}
        />
        <button
          type="submit"
          disabled={disabled || !hasText}
          className={`ak-chat-send-btn ${hasText && !disabled ? 'ak-chat-send-active' : ''}`}
          title={hasText ? 'Send message (Enter)' : 'Type a message to send'}
          aria-label="Send message"
        >
          <Send size={16} className="ak-chat-send-icon" />
        </button>
      </div>
      <div className="ak-chat-input-footer">
        <span className="ak-chat-hint">
          Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
        </span>
        <span className="ak-chat-provenance-note">
          NASA POWER & Live Forecasts
        </span>
      </div>
    </form>
  );
};

export default ChatInput;
