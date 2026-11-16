import React, { useState, useRef, useEffect, useCallback } from "react";
import "./assistant.css";
import { Bot, RotateCcw, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import ChatMessage from "../component/chatbot/ChatMessage";
import ChatInput from "../component/chatbot/ChatInput";
import ChatSuggestions from "../component/chatbot/ChatSuggestions";
import ChatLoadingIndicator from "../component/chatbot/ChatLoadingIndicator";
import ChatErrorBoundary from "../component/chatbot/ChatErrorBoundary";
import { usePageContext } from "../context/PageContext";
import { sendChatMessage, clearChatHistory } from "../api/axios";

const ASSISTANT_WELCOME = {
  id: "welcome_page",
  role: "assistant",
  content: `### AstroKites AI Climate Intelligence Assistant

Welcome to your dedicated full-page Earth Systems intelligence terminal.

**Real Data Grounding:**
- **NASA POWER & GPM IMERG**: 1990–2024 meteorological surface observations and satellite precipitation.
- **Mann-Kendall & Sen's Slope**: Non-parametric trend direction, slope magnitude (°C/year, mm/year), and p-value statistical significance.
- **Open-Meteo Weather Forecasts**: Live 7-day high-resolution numerical forecasts.
- **Bivariate Correlation**: Pearson r and R² calculations between soil moisture, rainfall, NDVI vegetation, and surface temperatures.

Ask any specific climate or forecasting question below.`,
  sources: [
    "NASA POWER API",
    "NASA GPM IMERG",
    "Theil-Sen Robust Linear Trend Engine",
    "Open-Meteo Weather API"
  ],
  timestamp: new Date().toISOString()
};

const AssistantPage = () => {
  const {
    pageContext,
    getContextForApi,
    userLocation,
    detectUserLocation,
    conversationId,
    clearChatSession
  } = usePageContext();

  const [messages, setMessages] = useState([ASSISTANT_WELCOME]);
  const [loading, setLoading] = useState(false);
  const [activeStepText, setActiveStepText] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleClear = async () => {
    if (loading) return;
    try {
      await clearChatHistory(conversationId);
    } catch {
      // ignore
    }
    clearChatSession();
    setMessages([ASSISTANT_WELCOME]);
    setErrorMessage(null);
  };

  const handleSend = async (queryText) => {
    const q = (queryText || "").trim();
    if (!q || loading) return;

    const userMsg = {
      id: "usr_" + Date.now(),
      role: "user",
      content: q,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setErrorMessage(null);

    // If query asks about local area, detect user location
    const isAskingArea = /\b(here|my area|this area|that area|my location|current location|where i am|weather now|around here|near me)\b/i.test(q);
    if (isAskingArea && (!userLocation.latitude || !userLocation.longitude)) {
      setActiveStepText("Accessing your device location...");
      try {
        await detectUserLocation();
      } catch (e) {
        console.warn("Location detection note:", e);
      }
    }

    setActiveStepText("Querying real Earth system models & NASA observations...");

    const apiContext = getContextForApi();

    try {
      const res = await sendChatMessage({
        message: q,
        context: apiContext,
        conversation_id: conversationId
      });

      if (res.ok && res.data) {
        const payload = res.data;
        const assistantMsg = {
          id: "ast_" + Date.now(),
          role: "assistant",
          content: payload.message || "No response generated.",
          sources: payload.sources || [],
          metrics: payload.metrics || null,
          evidence_data: payload.evidence_data || null,
          visualization_type: payload.visualization_type || null,
          tool_calls_executed: payload.tool_calls_executed || [],
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errDetail = res.error?.detail || res.error?.message || "Failed to communicate with climate intelligence service.";
        setErrorMessage(errDetail);
        setMessages((prev) => [
          ...prev,
          {
            id: "err_" + Date.now(),
            role: "assistant",
            content: `⚠️ **Data Retrieval Notice**: Could not complete query.\n\n*Details*: ${errDetail}`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      setErrorMessage(err.message || "Unexpected network error.");
    } finally {
      setLoading(false);
      setActiveStepText(null);
    }
  };

  return (
    <div className="fs-container assistant-full-page">
      <header className="fs-header">
        <div>
          <h1 className="page-title">
            AI Climate Intelligence <span className="highlight">Assistant</span>
          </h1>
          <p className="muted">
            Evidence-grounded conversational agent powered by OpenRouter, NASA POWER observations, and statistical trend modeling
          </p>
        </div>
        <div className="header-badge-group">
          <div className="header-badge">
            <ShieldCheck size={16} className="badge-shield-icon" />
            <span className="badge-tag">Zero Fabrication</span>
            <span className="badge-sub">Real Backend APIs</span>
          </div>
          <button
            className="assistant-page-reset-btn"
            onClick={handleClear}
            disabled={loading}
            title="Reset conversation session"
          >
            <RotateCcw size={15} />
            <span>Reset Session</span>
          </button>
        </div>
      </header>

      {/* Suggested prompts */}
      <ChatSuggestions
        route="/assistant"
        onSelect={handleSend}
        isGenerating={loading}
      />

      {/* Main Chat Area */}
      <ChatErrorBoundary>
        <div className="chat-window-card assistant-main-card">
          <div className="messages-stream">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} conversationId={conversationId} />
            ))}

            {loading && <ChatLoadingIndicator activeStep={activeStepText} />}

            {errorMessage && (
              <div className="chat-error-banner">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="assistant-input-container">
            <ChatInput onSend={handleSend} disabled={loading} />
          </div>
        </div>
      </ChatErrorBoundary>
    </div>
  );
};

export default AssistantPage;
