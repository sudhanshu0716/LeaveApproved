import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import AdminDashboard from './components/AdminDashboard';
import { PlaneTakeoff, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

function AdminTrigger() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
      setVisible(scrolledToBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname === '/admin') return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="admin-trigger-fixed"
        >
          <Link to="/admin">
            <Settings size={16} /> Admin Console
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper" style={{ position: 'relative', zIndex: 10 }}>
        <nav className="main-nav" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.8rem', border: 'var(--border-thick)', boxShadow: '4px 4px 0px #000' }}>
              <PlaneTakeoff size={32} color="white" />
            </div>
            <span className="title nav-logo-text" style={{ fontSize: '1.8rem', color: 'var(--text-dark)', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>LeaveApproved</span>
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <AdminTrigger />
      </div>
    </Router>
  );
}

export default App;
