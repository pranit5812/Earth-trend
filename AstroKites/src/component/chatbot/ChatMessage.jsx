import React, { useState } from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, Info } from 'lucide-react';
import ChatSourceReferences from './ChatSourceReferences';
import ChatDataVisualization from './ChatDataVisualization';
import { sendChatFeedback } from '../../api/axios';

// Fast inline markdown parser for scientific text
const renderInline = (str) => {
  if (!str) return str;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="ak-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }
  return parts.length > 0 ? parts : str;
};

// Block markdown renderer
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="ak-table-scroll-wrapper">
          <table className="ak-markdown-table">
            <thead>
              <tr>
                {tableRows[0].map((cell, cIdx) => (
                  <th key={cIdx}>{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Markdown Table detection: | Col 1 | Col 2 |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.some((c) => /^:?-+:?$/.test(c))) {
        continue;
      }
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable(idx);
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="ak-md-h4">
          {renderInline(line.replace('### ', ''))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="ak-md-h3">
          {renderInline(line.replace('## ', ''))}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={idx} className="ak-md-quote">
          {renderInline(line.replace('> ', ''))}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      const content = line.replace(/^[-•*]\s*/, '');
      elements.push(
        <li key={idx} className="ak-md-li">
          {renderInline(content)}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s*/, '');
      elements.push(
        <li key={idx} className="ak-md-ol-li">
          {renderInline(content)}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="ak-md-spacer" />);
    } else {
      elements.push(
        <p key={idx} className="ak-md-p">
          {renderInline(line)}
        </p>
      );
    }
  }

  if (inTable) {
    flushTable('final');
  }

  return elements;
};

const ChatMessage = ({ message, conversationId }) => {
  const isAssistant = message.role === 'assistant';
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating) => {
    if (feedback !== null) return;
    setFeedback(rating);
    try {
      await sendChatFeedback({
        conversation_id: conversationId,
        message_id: message.id || null,
        rating
      });
    } catch {
      // Non-critical
    }
  };

  return (
    <div className={`ak-msg-row ${isAssistant ? 'ak-msg-assistant' : 'ak-msg-user'}`}>
      <div className="ak-msg-avatar">
        {isAssistant ? (
          <div className="ak-avatar-bot" title="AstroKites AI Agent">
            <Bot size={17} />
          </div>
        ) : (
          <div className="ak-avatar-user" title="You">
            <User size={17} />
          </div>
        )}
      </div>

      <div className="ak-msg-bubble">
        {/* Author / Timestamp header */}
        <div className="ak-msg-header">
          <span className="ak-author-name">
            {isAssistant ? 'AstroKites Climate Intelligence' : 'You'}
          </span>
          {message.timestamp && (
            <span className="ak-timestamp">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="ak-msg-body">
          {isAssistant
            ? renderMarkdown(typeof message.content === 'string' ? message.content : JSON.stringify(message.content || ''))
            : String(message.content || '')}
        </div>

        {/* Interactive Data Visualizations (Metrics, Tables, Sparklines) */}
        {isAssistant && (message.metrics || message.evidence_data) && (
          <ChatDataVisualization
            metrics={message.metrics}
            evidenceData={message.evidence_data}
            visualizationType={message.visualization_type}
          />
        )}

        {/* Verified Data Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <ChatSourceReferences sources={message.sources} />
        )}

        {/* Assistant Actions Bar */}
        {isAssistant && (
          <div className="ak-msg-actions">
            <button
              className="ak-action-btn"
              onClick={handleCopy}
              title={copied ? 'Copied to clipboard' : 'Copy response'}
            >
              {copied ? <Check size={12} className="ak-copied-check" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <div className="ak-feedback-group">
              <button
                className={`ak-action-btn ${feedback === 'helpful' ? 'ak-feedback-pos' : ''}`}
                onClick={() => handleFeedback('helpful')}
                title="Helpful scientific response"
                disabled={feedback !== null}
              >
                <ThumbsUp size={12} />
              </button>
              <button
                className={`ak-action-btn ${feedback === 'unhelpful' ? 'ak-feedback-neg' : ''}`}
                onClick={() => handleFeedback('unhelpful')}
                title="Unhelpful response"
                disabled={feedback !== null}
              >
                <ThumbsDown size={12} />
              </button>
            </div>

            {message.tool_calls_executed && message.tool_calls_executed.length > 0 && (
              <span className="ak-tools-pill" title={`Executed tools: ${message.tool_calls_executed.join(', ')}`}>
                <Info size={11} /> {message.tool_calls_executed.length} tool{message.tool_calls_executed.length > 1 ? 's' : ''} called
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
