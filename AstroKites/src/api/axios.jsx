import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
export const baseURL = (rawBaseURL || '').replace(/\/+$/, '');
export const apiBase = baseURL;

// Create axios instance with base configuration
const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Generic helper to unwrap response
const unwrap = (resp) => (resp && resp.data ? resp.data : resp);
const toErrorPayload = (err) => {
    if (err?.response) {
        return { ok: false, status: err.response.status, error: err.response.data || err.message };
    }
    if (err?.request) {
        return { ok: false, status: 0, error: 'No response from server' };
    }
    return { ok: false, status: 0, error: err?.message || 'Unknown error' };
};

const postSafe = async (url, payload) => {
    try {
        const res = await api.post(url, payload);
        return { ok: true, status: res.status, data: unwrap(res) };
    } catch (err) {
        return toErrorPayload(err);
    }
};

const getSafe = async (url, params = {}) => {
    try {
        const res = await api.get(url, { params });
        return { ok: true, status: res.status, data: unwrap(res) };
    } catch (err) {
        return toErrorPayload(err);
    }
};

// ==========================================
// Existing Legacy Endpoints (Fully Preserved)
// ==========================================

export const postPowerData = async ({ lat, lon, start = null, end = null, parameters = ['T2M', 'PRECTOT', 'WS2M'], token = null, timeout = 60 }) => {
    const payload = { lat, lon, start, end, parameters, token, timeout };
    return await postSafe('/api/power-data', payload);
};

export const postForecast = async ({ lat, lon, start = null, end = null, parameters = ['T2M', 'PRECTOT', 'WS2M'], window = 7, token = null, timeout = 60 }) => {
    const payload = { lat, lon, start, end, parameters, window, token, timeout };
    return await postSafe('/api/forecast', payload);
};

export const getForecastData = async (lat, lon) => {
    return await postSafe('/api/forecast', { lat, lon });
};

export const postForecastSimple = async ({ lat, lon, date, ndays = 7, parameters = ['T2M', 'PRECTOT', 'WS2M'], window = 7, token = null, timeout = 60 }) => {
    const payload = { lat, lon, date, ndays, parameters, window, token, timeout };
    return await postSafe('/api/forecast-simple', payload);
};

export const postCheckDate = async ({ lat, lon, date, ndays = 30, window = 7, thresholds = null, token = null, timeout = 30 }) => {
    const payload = { lat, lon, date, ndays, window, thresholds, token, timeout };
    return await postSafe('/api/check-date', payload);
};

export const postStateSevenDayForecast = async ({ states, phone = null, send_sms = false, hot_threshold_c = 38.0, heavy_rain_threshold_mm = 50.0, openweather_api_key = null }) => {
    const payload = { states, phone, send_sms, hot_threshold_c, heavy_rain_threshold_mm, openweather_api_key };
    return await postSafe('/api/state-7day-forecast', payload);
};

export const postSendSms = async ({ phone, body }) => {
    const payload = { phone, body };
    return await postSafe('/api/send-sms', payload);
};

export const postSendEmail = async ({ email, subject, body, location }) => {
    const payload = { email, subject, body, location };
    return await postSafe('/api/send-email', payload);
};

// ==========================================
// EarthTrend India v1 Scientific Endpoints
// ==========================================

export const getVariables = async () => getSafe('/api/v1/variables');
export const getDatasets = async () => getSafe('/api/v1/datasets');
export const getIndianStates = async () => getSafe('/api/v1/regions/states');
export const getIndianDistricts = async (state) => getSafe('/api/v1/regions/districts', { state });

export const getTimeSeries = async ({ region = 'IN-MH', variable = 'temperature', start_year = null, end_year = 2024 }) => {
    return getSafe('/api/v1/data/series', { region, variable, start_year, end_year });
};

export const analyzeTrends = async ({ region_id = 'IN-MH', variable = 'temperature', start_year = null, end_year = 2024, prewhiten = true, alpha = 0.05 }) => {
    return postSafe('/api/v1/trends/analyze', { region_id, variable, start_year, end_year, prewhiten, alpha });
};

export const getTrendsMap = async (variable = 'temperature') => {
    return getSafe('/api/v1/trends/map', { variable });
};

export const compareRegions = async ({ region_ids = ['IN-MH', 'IN-RJ'], variable = 'temperature' }) => {
    return postSafe('/api/v1/compare', { region_ids, variable });
};

export const compareRegionYears = async ({ region = 'Goa', variable = 'temperature', year1 = 2026, year2 = 2020 }) => {
    return postSafe('/api/v1/compare/years', { region, variable, year1, year2 });
};

export const getOppositeTrends = async (variable = 'temperature') => {
    return getSafe('/api/v1/trends/opposite', { variable });
};

export const getBivariateCorrelation = async ({ region_id = 'IN-MH', variable_1 = 'rainfall', variable_2 = 'vegetation' }) => {
    return postSafe('/api/v1/correlation', { region_id, variable_1, variable_2 });
};

export const getCorrelationMatrix = async (region = 'IN-MH') => {
    return getSafe('/api/v1/correlation/matrix', { region });
};

export const detectAnomalies = async ({ region_id = 'IN-MH', variable = 'temperature', start_year = null, end_year = 2024 }) => {
    return postSafe('/api/v1/anomalies', { region_id, variable, start_year, end_year });
};

export const getDataQuality = async () => getSafe('/api/v1/data-quality');

export const askScientificAssistant = async (question) => {
    return postSafe('/api/v1/assistant/explain', { question });
};

export const createPdfReport = async ({ region_id = 'IN-MH', variable = 'temperature' }) => {
    return postSafe('/api/v1/reports', { region_id, variable });
};

export const getReportsList = async () => getSafe('/api/v1/reports');

// ==========================================
// Smart Travel Planner (India Only) Endpoints
// ==========================================

export const getTravelDestinations = async (query = null, travel_type = null) => {
    return getSafe('/api/travel/destinations', { query, travel_type });
};

export const getTravelClimateAnalysis = async ({ destination, start_year = 2015, end_year = 2024, latitude = null, longitude = null }) => {
    return postSafe('/api/travel/climate-analysis', { destination, start_year, end_year, latitude, longitude });
};

export const getBestTimeToTravel = async ({ destination, travel_type = 'general', start_year = 2015, end_year = 2024, latitude = null, longitude = null }) => {
    return postSafe('/api/travel/best-time', { destination, travel_type, start_year, end_year, latitude, longitude });
};

export const getBestTravelDates = async ({ destination, travel_type = 'general', duration_days = 7, date_preference = 'flexible', target_month = null, start_date = null, end_date = null, start_year = 2015, end_year = 2024 }) => {
    return postSafe('/api/travel/best-dates', { destination, travel_type, duration_days, date_preference, target_month, start_date, end_date, start_year, end_year });
};

export const compareTravelDestinations = async ({ destinations, travel_type = 'general', travel_month = 10, duration_days = 7, start_year = 2015, end_year = 2024 }) => {
    return postSafe('/api/travel/destination-comparison', { destinations, travel_type, travel_month, duration_days, start_year, end_year });
};

export const getTravelComfortCalendar = async ({ destination, travel_type = 'general', start_year = 2015, end_year = 2024 }) => {
    return postSafe('/api/travel/travel-calendar', { destination, travel_type, start_year, end_year });
};

export const getTravelRiskAnalysis = async ({ destination, travel_month = null, travel_type = 'general', start_year = 2015, end_year = 2024 }) => {
    return postSafe('/api/travel/risk-analysis', { destination, travel_month, travel_type, start_year, end_year });
};

export const getTravelInsights = async ({ destination, travel_month = null, travel_type = 'general', start_year = 2015, end_year = 2024 }) => {
    return postSafe('/api/travel/travel-insights', { destination, travel_month, travel_type, start_year, end_year });
};


export const sendChatMessage = async ({ message, context = null, conversation_id = null }) => {
    return postSafe('/api/chat', { message, context, conversation_id });
};

export const getChatHistory = async (conversation_id) => {
    return getSafe(`/api/chat/history/${conversation_id}`);
};

export const clearChatHistory = async (conversation_id) => {
    try {
        const res = await api.delete(`/api/chat/history/${conversation_id}`);
        return { ok: true, status: res.status, data: unwrap(res) };
    } catch (err) {
        return toErrorPayload(err);
    }
};

export const sendChatFeedback = async ({ conversation_id, message_id = null, rating, feedback = null }) => {
    return postSafe('/api/chat/feedback', { conversation_id, message_id, rating, feedback });
};

export const streamChatMessage = async ({
    message,
    context = null,
    conversation_id = null,
    onDelta = () => {},
    onComplete = () => {},
    onError = () => {}
}) => {
    try {
        const targetUrl = `${baseURL}/api/chat/stream`;
        const resp = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream'
            },
            body: JSON.stringify({ message, context, conversation_id })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${errText}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // Retain incomplete line

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.error) {
                            onError(new Error(parsed.error));
                            return;
                        }
                        if (parsed.delta) {
                            onDelta(parsed.delta);
                        }
                        if (parsed.done) {
                            onComplete(parsed);
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE line:', jsonStr, e);
                    }
                }
            }
        }
    } catch (err) {
        onError(err);
    }
};

// ==========================================
// Smart Agriculture API Endpoints
// ==========================================

export const getAgriLocations = async () => {
    return await getSafe('/api/agriculture/locations');
};

export const getAgriCrops = async (category = null) => {
    const params = category ? { category } : {};
    return await getSafe('/api/agriculture/crops', params);
};

export const getAgriCrop = async (cropId) => {
    return await getSafe(`/api/agriculture/crop/${encodeURIComponent(cropId)}`);
};

export const getAgriWeather = async (params) => {
    return await getSafe('/api/agriculture/weather', params);
};

export const getAgriMarketPrices = async (params = {}) => {
    return await getSafe('/api/agriculture/market-prices', params);
};

export const getAgriNearbyMandis = async (params) => {
    return await getSafe('/api/agriculture/markets/nearby', params);
};

export const getAgriMarketTrends = async (params) => {
    return await getSafe('/api/agriculture/market-trends', params);
};

export const postAgriRecommendations = async (payload) => {
    return await postSafe('/api/agriculture/recommendations', payload);
};

export const getAgriAlerts = async (params = {}) => {
    return await getSafe('/api/agriculture/alerts', params);
};

export const postAgriRainfallAnalysis = async (payload) => {
    return await postSafe('/api/agriculture/rainfall-analysis', payload);
};

export const postAgriSoilAnalysis = async (payload) => {
    return await postSafe('/api/agriculture/soil-analysis', payload);
};

export const postAgriPrediction = async (payload) => {
    return await postSafe('/api/agriculture/prediction', payload);
};

export const postAgriCalendar = async (payload) => {
    return await postSafe('/api/agriculture/crop-calendar', payload);
};

export const postAgriCompare = async (payload) => {
    return await postSafe('/api/agriculture/compare', payload);
};

export const postAgriInsights = async (payload) => {
    return await postSafe('/api/agriculture/insights', payload);
};

// ==========================================
// Official IMD Climate Alerts & Forecast Warnings
// ==========================================

export const getClimateAlerts = async (params = {}) => {
    return await getSafe('/api/v1/alerts', params);
};



