import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';
import ChatWindow from './ChatWindow';
import ChatErrorBoundary from './ChatErrorBoundary';
import { usePageContext } from '../../context/PageContext';
import './chatbot.css';

const ChatbotWidget = () => {
  const { isChatOpen, setIsChatOpen, toggleChat, unreadCount, pageContext } = usePageContext();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="astrokites-chatbot-root">
      {/* Active Floating Chat Window */}
      {isChatOpen && (
        <div className={`chatbot-window-wrapper ${isMinimized ? 'window-minimized' : ''}`}>
          <ChatErrorBoundary>
            <ChatWindow
              isMinimized={isMinimized}
              onToggleMinimize={() => setIsMinimized(!isMinimized)}
              onClose={() => {
                setIsChatOpen(false);
                setIsMinimized(false);
              }}
            />
          </ChatErrorBoundary>
        </div>
      )}

      {/* Floating Assistant Launcher Button */}
      <div className="chatbot-launcher-container">
        {!isChatOpen && (
          <div className="chatbot-prompt-bubble" onClick={toggleChat} role="button">
            <span className="bubble-sparkle">✨</span>
            <span className="bubble-text">
              Ask about {pageContext.page_name || 'climate trends'}...
            </span>
          </div>
        )}

        <button
          className={`chatbot-launcher-btn ${isChatOpen ? 'launcher-active' : ''}`}
          onClick={toggleChat}
          aria-label="Open AstroKites AI Climate Assistant"
          title="Open AstroKites AI Assistant"
        >
          {isChatOpen ? (
            <ChevronDown size={24} className="launcher-icon-close" />
          ) : (
            <div className="launcher-icon-box">
              <Bot size={26} className="launcher-bot-icon" />
              <Sparkles size={14} className="launcher-sparkle-icon" />
            </div>
          )}

          {unreadCount > 0 && !isChatOpen && (
            <span className="chatbot-badge">{unreadCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget;
