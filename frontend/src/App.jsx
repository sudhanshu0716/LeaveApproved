import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import TripDetail from './components/TripDetail';
import axios from 'axios';
import './index.css';

const REPORT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd44ADuCUXEsldR0sXMZP2Bf3VMz121Qb-WMUw3G-2-i3iT-w/viewform?usp=publish-editor';

function ReportIssueButton() {
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  if (location.pathname === '/admin') return null;

  // Mobile: handled in Dashboard bottom nav
  if (isMobile) return null;

  // Desktop: pill with text
  return (
    <a
      href={REPORT_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed', bottom: '24px', left: '24px', zIndex: 99999,
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '9px 14px',
        background: 'rgba(5,14,9,0.85)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,183,3,0.25)',
        borderRadius: '50px', textDecoration: 'none',
        color: 'rgba(255,183,3,0.8)', fontSize: '0.6rem',
        fontWeight: 900, letterSpacing: '1.5px',
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,183,3,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,183,3,0.6)'; e.currentTarget.style.color = '#ffb703'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,14,9,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,183,3,0.25)'; e.currentTarget.style.color = 'rgba(255,183,3,0.8)'; }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      REPORT ISSUE
    </a>
  );
}

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
      <ReportIssueButton />
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/itineraries" replace />} />
          <Route path="/dashboard/itineraries/:placeId" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/dashboard/:tab" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/trip/:id" element={<TripDetail />} />
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
