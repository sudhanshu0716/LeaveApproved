import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import axios from 'axios';
import './index.css';

// Generate or retrieve a stable session ID for this browser tab
function getSessionId() {
  let id = sessionStorage.getItem('_la_sid');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_la_sid', id);
  }
  return id;
}

function Heartbeat() {
  const location = useLocation();
  useEffect(() => {
    // Don't count admin page visits
    if (location.pathname === '/admin') return;
    const sessionId = getSessionId();
    const ping = () => axios.post('/api/heartbeat', { sessionId }).catch(() => {});
    ping(); // immediate ping on mount / route change
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);
  return null;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('la_darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('la_darkMode', darkMode ? 'true' : 'false');
    document.body.style.background = darkMode ? '' : '#f8f5ee';
    document.body.style.color = darkMode ? '' : '#081c15';
  }, [darkMode]);

  return (
    <Router>
      <Heartbeat />
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/itineraries" replace />} />
          <Route path="/dashboard/itineraries/:placeId" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/dashboard/:tab" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050e09', color: 'white', fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: '8rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive", color: '#ffb703', lineHeight: 1 }}>404</div>
              <div style={{ fontSize: '1.2rem', opacity: 0.6, marginBottom: '32px' }}>This destination doesn't exist.</div>
              <a href="/" style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #ffb703, #ff8c00)', color: '#081c15', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', letterSpacing: '1px' }}>← GO HOME</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
