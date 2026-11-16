import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Sparkles,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Crosshair,
  Loader2
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSuggestions from './ChatSuggestions';
import ChatLoadingIndicator from './ChatLoadingIndicator';
import { usePageContext } from '../../context/PageContext';
import { sendChatMessage, clearChatHistory } from '../../api/axios';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `### Welcome to AstroKites Climate Intelligence Assistant

I am an evidence-grounded scientific AI agent powered by OpenRouter and integrated with the AstroKites earth system engines.

**What I can do for you:**
- **Historical Climate Trends**: Calculate Sen's slope and Mann-Kendall statistical significance using NASA POWER observations (1990–2024).
- **Regional Comparisons**: Compare warming or precipitation trends across Indian states and cities.
- **Weather Forecasts**: Retrieve live high-resolution numerical forecasts and rain probability.
- **User Location Access**: Ask *"What is the weather in my area?"* or *"What are the climate trends here?"* and I will automatically access your location to analyze empirical records!
- **Page Context Awareness**: I automatically inspect your active page, selected coordinates, and displayed charts to answer questions about what you are currently viewing!

*Every numerical result is computed by real backend APIs with zero fabrication.*`,
  sources: ['NASA POWER API', 'NASA GPM IMERG', "Theil-Sen Robust Linear Trend Engine", 'Open-Meteo Weather API'],
  timestamp: new Date().toISOString()
};

const ChatWindow = ({ isMinimized, onToggleMinimize, onClose }) => {
  const {
    pageContext,
    getContextForApi,
    userLocation,
    detectUserLocation,
    conversationId,
    clearChatSession,
    activeSuggestion,
    setActiveSuggestion
  } = usePageContext();

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [activeStepText, setActiveStepText] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Handle active suggestion sent from external page
  useEffect(() => {
    if (activeSuggestion) {
      handleSendMessage(activeSuggestion);
      setActiveSuggestion(null);
    }
  }, [activeSuggestion]);

  const handleClearHistory = async () => {
    if (loading) return;
    try {
      await clearChatHistory(conversationId);
    } catch {
      // Non-blocking
    }
    clearChatSession();
    setMessages([WELCOME_MESSAGE]);
    setErrorMessage(null);
  };

  const handleSendMessage = async (text) => {
    if (!text || loading) return;

    const userMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setErrorMessage(null);

    // If user question refers to their own area / location, attempt to access geolocation
    const isAskingArea = /\b(here|my area|this area|that area|my location|current location|where i am|weather now|around here|near me|nearby)\b/i.test(text);

    if (isAskingArea && (!userLocation.latitude || !userLocation.longitude)) {
      setActiveStepText('Accessing your current location coordinates...');
      try {
        await detectUserLocation();
      } catch (e) {
        console.warn('Geolocation detection note:', e);
      }
    }

    setActiveStepText('Querying backend climate services...');

    const apiContext = getContextForApi();

    try {
      const res = await sendChatMessage({
        message: text,
        context: apiContext,
        conversation_id: conversationId
      });

      if (res.ok && res.data) {
        const payload = res.data;
        const assistantMessage = {
          id: 'msg_res_' + Date.now(),
          role: 'assistant',
          content: payload.message || 'No response generated.',
          sources: payload.sources || [],
          metrics: payload.metrics || null,
          evidence_data: payload.evidence_data || null,
          visualization_type: payload.visualization_type || null,
          tool_calls_executed: payload.tool_calls_executed || [],
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errMsg = res.error?.detail || res.error?.message || 'The climate data service is temporarily unreachable.';
        setErrorMessage(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg_err_' + Date.now(),
            role: 'assistant',
            content: `⚠️ **Data Retrieval Notice**: I could not retrieve the required climate data from the backend.\n\n*Error details*: ${errMsg}\n\nPlease verify that the backend API is online and try again.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred while communicating with the climate assistant.');
    } finally {
      setLoading(false);
      setActiveStepText(null);
    }
  };

  // Build readable context pill
  const contextPillText = (() => {
    const parts = [pageContext.page_name || 'AstroKites'];
    if (pageContext.selected_city) {
      parts.push(pageContext.selected_city);
    } else if (pageContext.selected_latitude && pageContext.selected_longitude) {
      parts.push(`${pageContext.selected_latitude.toFixed(2)}°N, ${pageContext.selected_longitude.toFixed(2)}°E`);
    }
    if (pageContext.selected_variable) {
      const varMap = {
        temperature: 'Temp',
        rainfall: 'Rainfall',
        soil_moisture: 'Soil',
        vegetation: 'NDVI',
        wind_speed: 'Wind',
        humidity: 'RH'
      };
      parts.push(varMap[pageContext.selected_variable] || pageContext.selected_variable);
    }
    return parts.join(' • ');
  })();

  return (
    <div className={`ak-chat-window ${isExpanded ? 'ak-window-expanded' : ''} ${isMinimized ? 'ak-window-minimized' : ''}`}>
      {/* Header */}
      <div className="ak-chat-header">
        <div className="ak-header-brand">
          <div className="ak-header-avatar">
            <Bot size={20} className="ak-header-icon" />
          </div>
          <div className="ak-header-info">
            <div className="ak-title-row">
              <span className="ak-header-title">AstroKites Intelligence</span>
              <span className="ak-badge-verified" title="Grounded OpenRouter LLM Architecture">
                <ShieldCheck size={11} /> Real Earth Data
              </span>
            </div>
            <div className="ak-context-tag" title="Live Website Context awareness">
              <MapPin size={11} className="ak-pin-icon" />
              <span>{contextPillText}</span>
            </div>
          </div>
        </div>

        <div className="ak-header-btns">
          <button
            className="ak-hbtn"
            onClick={handleClearHistory}
            title="Reset conversation session"
            disabled={loading}
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="ak-hbtn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore window size' : 'Expand window'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            className="ak-hbtn"
            onClick={onToggleMinimize}
            title="Minimize chat panel"
          >
            <Minimize2 size={14} />
          </button>
          <button
            className="ak-hbtn ak-hbtn-close"
            onClick={onClose}
            title="Close chat window"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* User Location Bar */}
      <div className="ak-location-bar">
        {userLocation.latitude ? (
          <div className="ak-loc-active" title="User GPS coordinates accessed">
            <Crosshair size={12} className="ak-loc-icon-green" />
            <span className="ak-loc-text">
              <strong>Your Location:</strong>{' '}
              {userLocation.city ? `${userLocation.city} ` : ''}
              ({userLocation.latitude.toFixed(2)}°N, {userLocation.longitude.toFixed(2)}°E)
            </span>
            <button
              className="ak-loc-refresh-btn"
              onClick={detectUserLocation}
              disabled={userLocation.isDetecting}
              title="Refresh GPS coordinates"
            >
              {userLocation.isDetecting ? <Loader2 size={11} className="ak-spin" /> : 'Update'}
            </button>
          </div>
        ) : (
          <button
            className="ak-loc-request-btn"
            onClick={detectUserLocation}
            disabled={userLocation.isDetecting}
          >
            {userLocation.isDetecting ? (
              <>
                <Loader2 size={12} className="ak-spin" />
                <span>Accessing your location...</span>
              </>
            ) : (
              <>
                <Crosshair size={12} className="ak-loc-icon-blue" />
                <span>Access My Location for Local Climate & Weather</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="ak-chat-body">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} conversationId={conversationId} />
        ))}

        {loading && <ChatLoadingIndicator activeStep={activeStepText} />}

        {errorMessage && (
          <div className="ak-chat-error-box">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <ChatSuggestions
        route={pageContext.route}
        onSelect={handleSendMessage}
        isGenerating={loading}
      />

      {/* Input Area */}
      <div className="ak-input-wrapper">
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
};

export default ChatWindow;
