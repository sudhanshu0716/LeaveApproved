import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
  return (
    <Router>
      <Heartbeat />
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
