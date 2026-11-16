import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/navbar';
import Home from './pages/homePage';
import Forecast from './pages/forecast';
import Maps from './pages/maps';
import Compare from './pages/compare';
import Assistant from './pages/assistant';
import Reports from './pages/reports';
import Signup from './pages/signup';
import SmartTravelDashboard from './pages/smartTravel/SmartTravelDashboard';
import SmartAgricultureDashboard from './pages/smartAgriculture/SmartAgricultureDashboard';
import { PageContextProvider } from './context/PageContext';
import ChatbotWidget from './component/chatbot/ChatbotWidget';
import './App.css';

const NotFound = () => (
  <div style={{ padding: "80px 20px", color: "#1e293b", textAlign: "center", background: "#f8fafc", minHeight: "80vh" }}>
    <h2 style={{ fontSize: "2rem", marginBottom: "12px", color: "#1e40af" }}>404 - Page Not Found</h2>
    <p style={{ color: "#64748b" }}>The requested page could not be located. Return to <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>home</a>.</p>
  </div>
);

function App() {
  return (
    <Router>
      <PageContextProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/smart-travel/*" element={<SmartTravelDashboard />} />
          <Route path="/smart-agriculture/*" element={<SmartAgricultureDashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotWidget />
      </PageContextProvider>
    </Router>
  );
}

export default App;
