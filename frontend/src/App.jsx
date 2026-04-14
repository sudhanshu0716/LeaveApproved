import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Landing from './components/Landing';
import AdminDashboard from './components/AdminDashboard';
import { PlaneTakeoff } from 'lucide-react';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="main-nav" style={{ padding: '24px 40px', display: 'flex', justifyContent: 'flex-start', position: 'absolute', width: '100%', zIndex: 50, pointerEvents: 'none' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', pointerEvents: 'auto' }}>
            <div className="nav-logo-icon" style={{ background: 'var(--primary-green)', padding: '10px', borderRadius: '14px', boxShadow: '0 8px 25px rgba(27, 67, 50, 0.4)' }}>
              <PlaneTakeoff size={28} color="white" />
            </div>
            <span className="nav-logo-text" style={{ fontSize: '1.4rem', color: 'white', letterSpacing: '-1.5px', fontWeight: 850, fontFamily: '"Montserrat", sans-serif' }}>LEAVE APPROVED.</span>
          </Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
