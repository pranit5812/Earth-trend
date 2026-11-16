import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const PageContext = createContext(null);

const ROUTE_NAME_MAP = {
  '/': 'Home',
  '/home': 'Home',
  '/forecast': 'Forecast',
  '/maps': 'Maps',
  '/compare': 'Compare',
  '/assistant': 'AI Assistant',
  '/reports': 'Reports',
  '/signup': 'Sign Up',
  '/smart-travel': 'Smart Travel Planner (India)',
  '/smart-travel/best-time': 'Smart Travel - Best Time',
  '/smart-travel/best-dates': 'Smart Travel - Best Dates',
  '/smart-travel/destination-comparison': 'Smart Travel - Destination Comparison',
  '/smart-travel/climate-analysis': 'Smart Travel - Climate Analysis',
  '/smart-travel/travel-calendar': 'Smart Travel - Travel Calendar',
  '/smart-travel/insights': 'Smart Travel - Insights & Weather Risks',
};

const getPageName = (pathname) => {
  if (ROUTE_NAME_MAP[pathname]) return ROUTE_NAME_MAP[pathname];
  for (const [route, name] of Object.entries(ROUTE_NAME_MAP)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return name;
    }
  }
  return 'AstroKites Climate Intelligence';
};

export const PageContextProvider = ({ children }) => {
  const location = useLocation();

  // Generate or retrieve persistent conversation ID across page navigations
  const [conversationId, setConversationId] = useState(() => {
    try {
      const stored = sessionStorage.getItem('astrokites_chat_conv_id');
      if (stored) return stored;
    } catch {
      // ignore
    }
    const newId = 'conv_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    try {
      sessionStorage.setItem('astrokites_chat_conv_id', newId);
    } catch {
      // ignore
    }
    return newId;
  });

  // User's Real-Time GPS / Device Location (accessed on demand)
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ak_user_loc');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      latitude: null,
      longitude: null,
      city: null,
      isDetecting: false,
      error: null
    };
  });

  // Chat window visibility and notification state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Dynamic context for climate intelligence queries
  const [pageContextData, setPageContextData] = useState({
    route: location.pathname,
    page_name: getPageName(location.pathname),
    selected_city: '',
    selected_latitude: null,
    selected_longitude: null,
    selected_variable: 'temperature',
    selected_start_date: '1990-01-01',
    selected_end_date: '2024-12-31',
    selected_temporal_resolution: 'monthly',
    current_trend_results: null,
    current_forecast_results: null,
    selected_comparison_regions: [],
    additional_data: {}
  });

  // Automatically update route and page_name on route changes without wiping active state
  useEffect(() => {
    setPageContextData((prev) => ({
      ...prev,
      route: location.pathname,
      page_name: getPageName(location.pathname),
    }));
  }, [location.pathname]);

  const updatePageContext = useCallback((updates) => {
    setPageContextData((prev) => ({
      ...prev,
      ...updates,
      additional_data: {
        ...(prev.additional_data || {}),
        ...(updates.additional_data || {})
      }
    }));
  }, []);

  // Detect User GPS / Device Location via browser Geolocation API
  const detectUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const errState = {
        latitude: null,
        longitude: null,
        city: null,
        isDetecting: false,
        error: 'Geolocation is not supported by your browser'
      };
      setUserLocation(errState);
      return errState;
    }

    setUserLocation((prev) => ({ ...prev, isDetecting: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          let cityName = '';

          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
              { headers: { 'User-Agent': 'AstroKites-App/1.0' } }
            );
            if (resp.ok) {
              const data = await resp.json();
              cityName =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.state_district ||
                data.address?.state ||
                '';
            }
          } catch (e) {
            console.warn('Reverse geocode fallback:', e);
          }

          const locObj = {
            latitude: lat,
            longitude: lon,
            city: cityName,
            isDetecting: false,
            error: null,
            accessedAt: Date.now()
          };

          try {
            sessionStorage.setItem('ak_user_loc', JSON.stringify(locObj));
          } catch {
            // ignore
          }

          setUserLocation(locObj);
          resolve(locObj);
        },
        (err) => {
          console.warn('Geolocation access failed:', err.message);
          const errObj = {
            latitude: null,
            longitude: null,
            city: null,
            isDetecting: false,
            error: err.message
          };
          setUserLocation(errObj);
          resolve(errObj);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    });
  }, []);

  const clearChatSession = useCallback(() => {
    const freshId = 'conv_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    try {
      sessionStorage.setItem('astrokites_chat_conv_id', freshId);
    } catch {
      // ignore
    }
    setConversationId(freshId);
    setUnreadCount(0);
  }, []);

  const openChatWithPrompt = useCallback((promptText) => {
    setActiveSuggestion(promptText);
    setIsChatOpen(true);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  // Format context payload specifically for FastAPI ChatRequest
  const getContextForApi = useCallback(() => {
    const lat = pageContextData.selected_latitude !== null && pageContextData.selected_latitude !== undefined ? Number(pageContextData.selected_latitude) : undefined;
    const lon = pageContextData.selected_longitude !== null && pageContextData.selected_longitude !== undefined ? Number(pageContextData.selected_longitude) : undefined;

    return {
      route: pageContextData.route,
      page_name: pageContextData.page_name,
      // Page location (both aliases supported)
      selected_location: pageContextData.selected_city || undefined,
      selected_city: pageContextData.selected_city || undefined,
      latitude: lat,
      longitude: lon,
      selected_latitude: lat,
      selected_longitude: lon,

      // User's Real-time GPS location
      user_latitude: userLocation.latitude !== null && userLocation.latitude !== undefined ? Number(userLocation.latitude) : undefined,
      user_longitude: userLocation.longitude !== null && userLocation.longitude !== undefined ? Number(userLocation.longitude) : undefined,
      user_city: userLocation.city || undefined,

      selected_variable: pageContextData.selected_variable || undefined,
      start_date: pageContextData.selected_start_date || undefined,
      end_date: pageContextData.selected_end_date || undefined,
      temporal_resolution: pageContextData.selected_temporal_resolution || undefined,
      trend_data: pageContextData.current_trend_results || undefined,
      current_trend_results: pageContextData.current_trend_results || undefined,
      forecast_data: pageContextData.current_forecast_results || undefined,
      current_forecast_results: pageContextData.current_forecast_results || undefined,
      comparison_regions: pageContextData.selected_comparison_regions?.length ? pageContextData.selected_comparison_regions : undefined,
      additional_data: {
        ...(pageContextData.additional_data || {}),
        active_route: pageContextData.route,
      }
    };
  }, [pageContextData, userLocation]);

  const contextValue = useMemo(() => ({
    pageContext: pageContextData,
    updatePageContext,
    getContextForApi,
    userLocation,
    detectUserLocation,
    conversationId,
    clearChatSession,
    isChatOpen,
    setIsChatOpen,
    toggleChat,
    unreadCount,
    setUnreadCount,
    activeSuggestion,
    setActiveSuggestion,
    openChatWithPrompt,
  }), [
    pageContextData,
    updatePageContext,
    getContextForApi,
    userLocation,
    detectUserLocation,
    conversationId,
    clearChatSession,
    isChatOpen,
    toggleChat,
    unreadCount,
    activeSuggestion,
    openChatWithPrompt
  ]);

  return (
    <PageContext.Provider value={contextValue}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageContextProvider');
  }
  return context;
};

export default PageContext;
