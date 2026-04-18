import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Users, Map, Plus, Trash2, Edit2,
  ShieldAlert, Lock, Zap, Star, MessageSquare, FileText,
  CheckCircle, BarChart2, Navigation, Clock, DollarSign,
  RefreshCw, Menu, X, TrendingUp, Globe, Activity,
  Database, Cpu, Heart, MessageCircle, MapPin, Calendar,
  Package, Wifi, WifiOff, Timer, ArrowUp, ArrowDown
} from 'lucide-react';
import FlowBuilder from './FlowBuilder';

const BAD_WORDS = ['spam', 'fake', 'bad', 'scam', 'toxic', 'fuck', 'shit'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState([]);
  const [places, setPlaces] = useState([]);
  const [moderationReviews, setModerationReviews] = useState([]);
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [form, setForm] = useState({
    from: '', name: '', description: '', budgetRange: 'under 5000 rupees', days: '2 day', distance: 'under 250km'
  });
  const [editingId, setEditingId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [socialStats, setSocialStats] = useState({ bestPlaces: [], latestReviews: [] });

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState('groq');
  const [contributions, setContributions] = useState([]);
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [uptime, setUptime] = useState(null);
  const [uptimeLoading, setUptimeLoading] = useState(true);

  // Poll live visitor count every 30s when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchLive = () => axios.get('/api/active-users').then(r => setLiveVisitors(r.data.count)).catch(() => {});
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch UptimeRobot data every 5 min
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUptime = () => {
      setUptimeLoading(true);
      axios.get('/api/admin/uptime')
        .then(r => {
          if (r.data.error) { setUptime({ error: r.data.error }); }
          else { setUptime(r.data); }
        })
        .catch(e => setUptime({ error: e.message }))
        .finally(() => setUptimeLoading(false));
    };
    fetchUptime();
    const interval = setInterval(fetchUptime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      fetchPlaces();
      fetchSocialStats();
      fetchModerationReviews();
      fetchContributions();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try { const res = await axios.get('/api/analytics'); setAnalytics(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchPlaces = async () => {
    try { const res = await axios.get('/api/admin/places'); setPlaces(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchSocialStats = async () => {
    try { const res = await axios.get('/api/admin/social-stats'); setSocialStats(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchModerationReviews = async () => {
    try { const res = await axios.get('/api/admin/all-reviews'); setModerationReviews(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchContributions = async () => {
    try { const res = await axios.get('/api/admin/contributions'); setContributions(res.data); }
    catch (err) { console.error(err); }
  };

  const deleteContribution = async (id) => {
    try {
      await axios.delete(`/api/admin/contributions/${id}`);
      fetchContributions();
    } catch (err) { console.error(err); }
  };

  const synthesizeContribution = async (contribution) => {
    try {
      await axios.put(`/api/admin/contributions/${contribution._id}`);
      fetchContributions();
    } catch (err) { console.error(err); }
    setAiInput(contribution.text);
    setActiveTab('addPlace');
    generateTripAI(contribution.text);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', credentials);
      if (res.data.success) setIsAuthenticated(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    const payload = { ...form, nodes, edges };
    try {
      if (editingId) {
        await axios.put(`/api/admin/places/${editingId}`, payload);
      } else {
        await axios.post('/api/admin/places', payload);
      }
      resetForm();
      fetchPlaces();
      setActiveTab('places');
    } catch (err) { alert('Save failed. Please try again.'); }
  };

  const deletePlace = async (id) => {
    if (window.confirm('Delete this trip? This cannot be undone.')) {
      await axios.delete(`/api/admin/places/${id}`);
      fetchPlaces();
    }
  };

  const editPlace = (place) => {
    setEditingId(place._id);
    setForm({
      from: place.from || '',
      name: place.name || '',
      description: place.description || '',
      budgetRange: place.budgetRange || 'under 5000',
      days: place.days || '2 day',
      distance: place.distance || 'under 250km'
    });
    setNodes(place.nodes || []);
    setEdges(place.edges || []);
    setActiveTab('addPlace');
    setMobileMenuOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ from: '', name: '', description: '', budgetRange: 'under 5000 rupees', days: '2 day', distance: 'under 250km' });
    setNodes([]);
    setEdges([]);
  };

  const deleteReview = async (placeId, reviewId) => {
    if (window.confirm('Delete this review?')) {
      try {
        await axios.delete(`/api/admin/reviews/${placeId}/${reviewId}`);
        fetchModerationReviews();
      } catch (err) {}
    }
  };

  const generateTripAI = async (overrideText) => {
    const inputText = (typeof overrideText === 'string' ? overrideText : null) || aiInput;
    if (!inputText) return alert('Please enter a trip description first.');
    setIsAiLoading(true);
    try {
      const prompt = `You are a Master Travel Architect. Parse the following traveler's message into a high-fidelity Mission Blueprint (JSON).

Input text: "${inputText}"

REQUIRED JSON STRUCTURE (fill all fields with real extracted data from the input above):
{
  "from": "Origin city where the journey starts",
  "name": "Main destination city of the trip",
  "description": "2-3 sentence description with specific real details from the input",
  "days": "1 day" | "2 day" | "3 day" | "3+ days",
  "budgetRange": "under 1000 rupees" | "under 2000 rupees" | "under 5000 rupees" | "over 5000 rupees",
  "distance": "under 100km" | "under 250km" | "under 500km" | "over 500km",
  "nodes": [
    {
      "id": "unique-id",
      "type": "cityNode",
      "position": {"x": 100, "y": 150},
      "data": {
        "label": "Actual city or stop name from the text",
        "markerDay": "Day 1",
        "arrivalTime": "actual arrival time from text in HH:MM",
        "departureTime": "actual departure time from text in HH:MM",
        "rooms": "exact accommodation name from text",
        "food": "exact food items or restaurant names from text",
        "activity": "exact activities mentioned in text for this stop",
        "color": "#1b4332"
      }
    }
  ],
  "edges": [
    { "id": "unique-id", "source": "node-id", "target": "node-id", "type": "customEdge", "data": {"transport": "BUS|TRAIN|CAB|FLIGHT", "color": "#1b4332"} }
  ]
}

CRITICAL RULES:
- Create one node per major city or stop (e.g. Bangalore, Madurai, Munnar = 3 nodes)
- Extract REAL names from the text — no generic words like "Budget Hotel", "Local cuisine", or "Sightseeing"
- Node positions: x starts at 100 and increases by 850 per node; y alternates 150 and 400
- The "from" = starting city, "name" = main/final destination
- For "days": count the Day 1, Day 2, Day 3 mentions and use "3+ days" if 3 or more
- For "budgetRange": add all costs mentioned and pick the closest bracket
- For edges "transport": pick BUS, TRAIN, CAB, or FLIGHT based on what the text says
- Return ONLY raw JSON with no markdown or explanation.`;

      const response = await axios.post('/api/ai/generate', { prompt, model: aiModel });
      let rawText = response.data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response. Raw: ' + rawText.slice(0, 200));
      const parsed = JSON.parse(jsonMatch[0]);

      const fromVal     = parsed.from        || parsed.origin       || parsed.start        || parsed.from_city     || '';
      const nameVal     = parsed.name        || parsed.destination  || parsed.to           || parsed.dest          || parsed.destination_city || 'Unknown Destination';
      const descVal     = parsed.description || parsed.summary      || parsed.overview     || '';
      const daysVal     = parsed.days        || parsed.duration     || '2 day';
      const budgetVal   = parsed.budgetRange || parsed.budget       || parsed.budget_range || 'under 5000 rupees';
      const distanceVal = parsed.distance    || parsed.radius       || parsed.distance_range || 'under 500km';

      setForm({ from: fromVal, name: nameVal, description: descVal, days: daysVal, budgetRange: budgetVal, distance: distanceVal });

      if (parsed.nodes && parsed.nodes.length > 0) {
        const staggeredNodes = parsed.nodes.map((n, idx) => ({
          ...n,
          position: { x: 100 + idx * 850, y: 150 + (idx % 2 === 0 ? 0 : 250) }
        }));
        setNodes(staggeredNodes);
      }
      if (parsed.edges) setEdges(parsed.edges);
      alert('AI synthesis complete! Review the generated details below.');
    } catch (err) {
      console.error('AI Synthesis Error:', err);
      alert('AI synthesis failed: ' + err.message + '\n\nCheck browser console for details.');
    }
    setIsAiLoading(false);
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#081c15', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <video src="/MUNNAR.mp4" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, filter: 'grayscale(1) brightness(0.5)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, rgba(8,28,21,1))' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(216,243,220,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(216,243,220,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ padding: '60px 50px', maxWidth: '440px', width: '100%', textAlign: 'center', background: 'rgba(15,30,25,0.9)', backdropFilter: 'blur(40px)', border: '1px solid rgba(216,243,220,0.15)', borderRadius: '40px', position: 'relative', zIndex: 10, boxShadow: '0 50px 150px rgba(0,0,0,0.8)' }}
        >
          <div style={{ position: 'relative', marginBottom: '36px' }}>
            <div style={{ background: 'rgba(216,243,220,0.05)', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid rgba(216,243,220,0.1)' }}>
              <Lock size={36} color="#ffb703" style={{ opacity: 0.9 }} />
            </div>
            <div style={{ position: 'absolute', inset: '-10px', border: '1px dashed #ffb703', borderRadius: '50%', opacity: 0.2, animation: 'rotating 10s linear infinite' }} />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703', letterSpacing: '4px', display: 'block', marginBottom: '8px', opacity: 0.8 }}>ADMIN ACCESS</span>
            <h2 className="title" style={{ fontSize: '2rem', color: 'white', margin: 0 }}>Sign In</h2>
            <p style={{ color: 'rgba(216,243,220,0.4)', fontSize: '0.85rem', marginTop: '8px' }}>LeaveApproved Admin Panel</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px' }}>
              <span style={{ position: 'absolute', top: '-16px', left: 0, fontSize: '0.55rem', fontWeight: 900, color: 'rgba(216,243,220,0.4)', letterSpacing: '2px' }}>USERNAME</span>
              <input style={{ background: 'transparent', border: 'none', width: '100%', padding: '10px 0', color: 'white', fontSize: '1.05rem', outline: 'none', fontFamily: 'inherit' }} placeholder="Enter username" value={credentials.username} onChange={e => setCredentials({ ...credentials, username: e.target.value })} required />
            </div>
            <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px' }}>
              <span style={{ position: 'absolute', top: '-16px', left: 0, fontSize: '0.55rem', fontWeight: 900, color: 'rgba(216,243,220,0.4)', letterSpacing: '2px' }}>PASSWORD</span>
              <input type="password" style={{ background: 'transparent', border: 'none', width: '100%', padding: '10px 0', color: 'white', fontSize: '1.05rem', outline: 'none', fontFamily: 'inherit' }} placeholder="Enter password" value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} required />
            </div>
            <button type="submit" style={{ justifyContent: 'center', background: 'rgba(255,183,3,0.1)', border: '1px solid #ffb703', color: '#ffb703', padding: '20px', borderRadius: '16px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '2px', cursor: 'pointer', marginTop: '8px', transition: 'all 0.2s' }}>
              Sign In
            </button>
          </form>

          <a href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(216,243,220,0.6)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(216,243,220,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(216,243,220,0.6)'; }}
          >
            ← Login as User
          </a>
        </motion.div>

        <style>{`
          @keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ─── TABS CONFIG ─────────────────────────────────────────────────────────────
  const pendingCount = contributions.filter(c => c.status === 'pending').length;
  const tabs = [
    { id: 'analytics',     icon: <BarChart2 size={17} />,   label: 'Analytics' },
    { id: 'places',        icon: <Map size={17} />,          label: 'Trips' },
    { id: 'addPlace',      icon: <Plus size={17} />,         label: editingId ? 'Edit Trip' : 'Add Trip' },
    { id: 'moderation',    icon: <ShieldAlert size={17} />,  label: 'Reviews' },
    { id: 'contributions', icon: <FileText size={17} />,     label: `Submissions${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
  ];

  const goToTab = (id) => {
    setActiveTab(id);
    if (id !== 'addPlace') resetForm();
    setMobileMenuOpen(false);
  };

  // ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f0f4f2', position: 'relative' }}>
      <div className="app-bg" />
      <div className="video-bg">
        <video autoPlay loop muted playsInline><source src="/MUNNAR.mp4" type="video/mp4" /></video>
      </div>

      {/* ── NAV ── */}
      <nav className="glass-panel" style={{ position: 'sticky', top: '16px', margin: '0 16px', zIndex: 1000, padding: '12px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#1b4332', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} color="white" />
          </div>
          <div>
            <h2 className="title" style={{ fontSize: '1rem', margin: 0, color: '#081c15' }}>Admin Panel</h2>
            <span style={{ fontSize: '0.6rem', color: '#999', fontWeight: 600 }}>LeaveApproved</span>
          </div>
        </div>

        {/* Desktop tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} className="admin-desktop-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => goToTab(tab.id)}
              style={{ padding: '9px 16px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: activeTab === tab.id ? '#1b4332' : 'transparent', color: activeTab === tab.id ? 'white' : '#1b4332', transition: 'all 0.2s' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
          <button
            onClick={() => setIsAuthenticated(false)}
            style={{ padding: '9px 16px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(174,32,18,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#ae2012', transition: 'all 0.2s' }}
          >
            <Lock size={15} /> Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="admin-mobile-menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332', padding: '8px' }}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'fixed', top: '90px', left: '16px', right: '16px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 999, padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => goToTab(tab.id)} style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === tab.id ? '#1b4332' : '#f8fdf9', color: activeTab === tab.id ? 'white' : '#1b4332', textAlign: 'left' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
            <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 0' }} />
            <button onClick={() => { setIsAuthenticated(false); setMobileMenuOpen(false); }} style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(174,32,18,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff5f5', color: '#ae2012', textAlign: 'left' }}>
              <Lock size={17} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ position: 'relative', zIndex: 10, padding: '28px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">

          {/* ── ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#081c15', margin: 0 }}>Analytics</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Overview of your platform activity</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div style={{ padding: '24px', background: '#081c15', borderRadius: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb703' }} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#ffb703', letterSpacing: '1px' }}>LIVE</span>
                  </div>
                  <Globe size={20} color="rgba(216,243,220,0.5)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d8f3dc', lineHeight: 1 }}>{liveVisitors}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(216,243,220,0.6)', marginTop: '6px', fontWeight: 700 }}>Live Visitors</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(216,243,220,0.3)', marginTop: '4px' }}>Active in last 2 min</div>
                </div>

                <div style={{ padding: '24px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <Package size={20} color="#1b4332" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#081c15', lineHeight: 1 }}>{places.length}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '6px', fontWeight: 700 }}>Published Trips</div>
                </div>

                <div style={{ padding: '24px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <Activity size={20} color="#1b4332" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#081c15', lineHeight: 1 }}>{analytics.length}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '6px', fontWeight: 700 }}>Registered Users</div>
                </div>

                <div style={{ padding: '24px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <Users size={20} color="#1b4332" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#081c15', lineHeight: 1 }}>{new Set(analytics.map(a => a.company)).size}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '6px', fontWeight: 700 }}>Companies</div>
                </div>
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {/* Top companies */}
                <div style={{ padding: '28px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <TrendingUp size={18} color="#1b4332" />
                    <h4 style={{ margin: 0, fontWeight: 900, color: '#081c15', fontSize: '0.9rem' }}>Users by Company</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(analytics.reduce((acc, curr) => {
                      acc[curr.company] = (acc[curr.company] || 0) + 1;
                      return acc;
                    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([company, count]) => (
                      <div key={company}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#081c15', fontSize: '0.8rem' }}>{company}</span>
                          <span style={{ fontWeight: 900, color: '#1b4332', fontSize: '0.8rem' }}>{count} users</span>
                        </div>
                        <div style={{ background: '#f0f4f2', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #1b4332, #52b788)', height: '100%', width: `${analytics.length ? (count / analytics.length) * 100 : 0}%`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly chart */}
                <div style={{ padding: '28px', background: '#1b4332', borderRadius: '20px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="#ffb703" />
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem' }}>Hourly Activity</h4>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Visits per hour of day</p>
                    </div>
                  </div>
                  <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const count = analytics.filter(log => new Date(log.createdAt).getHours() === hour).length;
                      const maxCount = Math.max(...Array.from({ length: 24 }).map((_, h) => analytics.filter(log => new Date(log.createdAt).getHours() === h).length), 1);
                      const h = (count / maxCount) * 100;
                      return (
                        <div key={hour} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', height: `${Math.max(h, 4)}%`, background: h > 70 ? '#ffb703' : 'rgba(216,243,220,0.35)', borderRadius: '2px', transition: 'all 0.5s' }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                    <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
                  </div>
                </div>
              </div>

              {/* UptimeRobot Live Status */}
              <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '28px' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={18} color="#1b4332" />
                    <h4 style={{ margin: 0, fontWeight: 900, color: '#081c15', fontSize: '0.9rem' }}>Website Status</h4>
                  </div>
                  {uptime && (
                    <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600 }}>
                      {uptime.url}
                    </span>
                  )}
                </div>

                {uptimeLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontWeight: 700, fontSize: '0.85rem' }}>
                    Loading status...
                  </div>
                ) : (!uptime || uptime.error) ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#e63946', fontWeight: 700, fontSize: '0.85rem' }}>
                    {uptime?.error || 'Could not fetch status data.'}
                  </div>
                ) : (
                  <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

                    {/* Column 1: Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%',
                          background: uptime.status === 2 ? '#52b788' : '#e63946',
                          boxShadow: uptime.status === 2 ? '0 0 0 4px rgba(82,183,136,0.25)' : '0 0 0 4px rgba(230,57,70,0.25)'
                        }} />
                        <span style={{ fontWeight: 900, fontSize: '1.3rem', color: uptime.status === 2 ? '#1b4332' : '#e63946' }}>
                          {uptime.statusText}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: uptime.status === 2 ? 'rgba(82,183,136,0.08)' : 'rgba(230,57,70,0.08)', borderRadius: '10px' }}>
                        {uptime.status === 2 ? <Wifi size={15} color="#52b788" /> : <WifiOff size={15} color="#e63946" />}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: uptime.status === 2 ? '#2d6a4f' : '#e63946' }}>
                          {uptime.name}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Uptime % */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uptime</div>
                      {[
                        { label: '24h', value: uptime.uptime24h },
                        { label: '7d', value: uptime.uptime7d },
                        { label: '30d', value: uptime.uptime30d },
                      ].map(u => (
                        <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#aaa', width: '28px' }}>{u.label}</span>
                          <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.value}%`, background: parseFloat(u.value) >= 99 ? '#52b788' : parseFloat(u.value) >= 95 ? '#ffb703' : '#e63946', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#081c15', width: '52px', textAlign: 'right' }}>
                            {parseFloat(u.value).toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Column 3: Response Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response Time</div>
                      {[
                        { label: 'Avg', value: uptime.avgResponse, icon: <Timer size={13} color="#2d6a4f" /> },
                        { label: 'Min', value: uptime.minResponse, icon: <ArrowDown size={13} color="#52b788" /> },
                        { label: 'Max', value: uptime.maxResponse, icon: <ArrowUp size={13} color="#e63946" /> },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fdf9', borderRadius: '10px' }}>
                          {r.icon}
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#555', flex: 1 }}>{r.label}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#081c15' }}>
                            {r.value != null ? `${r.value} ms` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>

              {/* Visitors table */}
              <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} color="#1b4332" />
                  <h4 style={{ margin: 0, fontWeight: 900, color: '#081c15', fontSize: '0.9rem' }}>Registered Users</h4>
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fdf9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        {['Username', 'Company', 'Joined At'].map(h => (
                          <th key={h} style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 900, color: '#1b4332', textAlign: 'left', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((log, idx) => (
                        <tr key={log._id} style={{ borderTop: '1px solid #f5f5f5', background: idx % 2 === 0 ? 'transparent' : 'rgba(216,243,220,0.08)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: 800, color: '#081c15', fontSize: '0.88rem' }}>{log.username}</td>
                          <td style={{ padding: '14px 20px', color: '#2d6a4f', fontWeight: 700, fontSize: '0.85rem' }}>{log.company}</td>
                          <td style={{ padding: '14px 20px', color: '#aaa', fontSize: '0.78rem', fontWeight: 600 }}>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TRIPS DIRECTORY ── */}
          {activeTab === 'places' && (
            <motion.div key="places" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#081c15', margin: 0 }}>Trip Directory</h2>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>{places.length} published itineraries</p>
                </div>
                <button onClick={() => goToTab('addPlace')} style={{ padding: '12px 22px', background: '#1b4332', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> Add New Trip
                </button>
              </div>

              {places.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <MapPin size={52} color="#d8f3dc" style={{ marginBottom: '16px' }} />
                  <h4 style={{ margin: 0, color: '#999', fontWeight: 800 }}>No trips yet</h4>
                  <p style={{ color: '#bbb', fontSize: '0.85rem', marginTop: '8px' }}>Add your first trip to get started.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {places.map(place => (
                    <motion.div key={place._id} whileHover={{ y: -4 }} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', transition: 'box-shadow 0.2s' }}>
                      {/* Card header */}
                      <div style={{ background: 'linear-gradient(135deg, #081c15 0%, #1b4332 60%, #2d6a4f 100%)', padding: '24px 20px 20px', position: 'relative', minHeight: '100px' }}>
                        {place.from && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(216,243,220,0.7)', textTransform: 'uppercase' }}>{place.from}</span>
                            <Navigation size={12} color="#ffb703" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(216,243,220,0.7)', textTransform: 'uppercase' }}>{place.name}</span>
                          </div>
                        )}
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>{place.name}</h3>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => editPlace(place)} style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}><Edit2 size={15} /></button>
                          <button onClick={() => deletePlace(place._id)} style={{ width: '34px', height: '34px', background: 'rgba(174,32,18,0.2)', border: 'none', borderRadius: '10px', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}><Trash2 size={15} /></button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '18px 20px' }}>
                        {place.description && (
                          <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.55, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{place.description}</p>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {place.days && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#f0f9f4', color: '#1b4332', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                              <Calendar size={11} /> {place.days}
                            </span>
                          )}
                          {place.budgetRange && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#fffbeb', color: '#92400e', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                              <DollarSign size={11} /> {place.budgetRange}
                            </span>
                          )}
                          {place.distance && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                              <Navigation size={11} /> {place.distance}
                            </span>
                          )}
                          {place.nodes?.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#f5f3ff', color: '#6d28d9', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                              <MapPin size={11} /> {place.nodes.length} stops
                            </span>
                          )}
                        </div>

                        {(place.likedBy?.length > 0 || place.comments?.length > 0) && (
                          <div style={{ display: 'flex', gap: '14px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f5f5f5' }}>
                            {place.likedBy?.length > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#888', fontWeight: 700 }}>
                                <Heart size={13} color="#e74c3c" fill="#e74c3c" /> {place.likedBy.length}
                              </span>
                            )}
                            {place.comments?.length > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#888', fontWeight: 700 }}>
                                <MessageCircle size={13} /> {place.comments.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ADD / EDIT TRIP ── */}
          {activeTab === 'addPlace' && (
            <motion.div key="addPlace" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#081c15', margin: 0 }}>{editingId ? 'Edit Trip' : 'Add New Trip'}</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Fill in the details manually or use AI to generate from a description.</p>
              </div>

              {/* AI Generator card */}
              <div style={{ background: '#081c15', borderRadius: '24px', padding: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,183,3,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={20} color="#ffb703" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>AI Generator</h3>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Paste a trip description and let AI build the itinerary</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'groq', label: 'Groq', sub: 'Fast' },
                      { id: 'gemini', label: 'Gemini', sub: 'Accurate' },
                    ].map(m => (
                      <button key={m.id} onClick={() => setAiModel(m.id)} style={{ padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', background: aiModel === m.id ? (m.id === 'gemini' ? 'rgba(66,133,244,0.2)' : 'rgba(255,183,3,0.15)') : 'rgba(255,255,255,0.04)', border: aiModel === m.id ? `1.5px solid ${m.id === 'gemini' ? '#4285f4' : '#ffb703'}` : '1.5px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px', minWidth: '80px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: aiModel === m.id ? (m.id === 'gemini' ? '#4285f4' : '#ffb703') : 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Describe the trip... e.g. 'Trip from Bangalore to Munnar via Madurai, 3 days, staying at Green Valley Resort, bus to Madurai then cab to Munnar...'"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  style={{ width: '100%', height: '110px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                />

                <button
                  onClick={() => generateTripAI()}
                  disabled={isAiLoading}
                  style={{ width: '100%', marginTop: '14px', padding: '16px', background: isAiLoading ? 'rgba(255,183,3,0.5)' : '#ffb703', border: 'none', borderRadius: '14px', color: '#081c15', fontWeight: 900, fontSize: '0.9rem', cursor: isAiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', letterSpacing: '0.5px' }}
                >
                  {isAiLoading
                    ? <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #081c15', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating via {aiModel === 'groq' ? 'Groq' : 'Gemini'}...</>
                    : <><Zap size={17} /> Generate Itinerary with {aiModel === 'groq' ? 'Groq' : 'Gemini'}</>}
                </button>
              </div>

              {/* Manual form */}
              <div style={{ background: 'white', borderRadius: '24px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#081c15', marginTop: 0, marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                  {editingId ? 'Edit Details' : 'Trip Details'}
                </h3>

                <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* From / To */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>From (Origin)</label>
                      <input className="modern-input" placeholder="e.g. Bangalore" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} style={{ padding: '14px 16px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>To (Destination) *</label>
                      <input className="modern-input" placeholder="e.g. Coorg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: '14px 16px' }} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>Description *</label>
                    <textarea className="modern-input" style={{ height: '100px', padding: '14px 16px', resize: 'none' }} placeholder="Brief description of the trip..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  </div>

                  {/* Duration / Budget / Distance */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>Duration</label>
                      <select className="modern-input" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} style={{ padding: '14px 16px' }}>
                        <option>1 day</option><option>2 day</option><option>3 day</option><option>3+ days</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>Budget Range</label>
                      <select className="modern-input" value={form.budgetRange} onChange={e => setForm({ ...form, budgetRange: e.target.value })} style={{ padding: '14px 16px' }}>
                        <option>under 1000</option><option>under 2000</option><option>under 5000</option><option>over 5000</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '8px' }}>Distance</label>
                      <select className="modern-input" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} style={{ padding: '14px 16px' }}>
                        <option>under 100km</option><option>under 250km</option><option>under 500km</option><option>over 500km</option>
                      </select>
                    </div>
                  </div>

                  {/* Flow builder */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#555', marginBottom: '12px' }}>Route Flow Builder</label>
                    <div style={{ height: '500px', borderRadius: '20px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                      <FlowBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <button type="button" onClick={resetForm} style={{ flex: 1, padding: '16px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" style={{ flex: 2, padding: '16px', background: '#1b4332', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.5px' }}>
                      {editingId ? 'Save Changes' : 'Publish Trip'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── REVIEWS / MODERATION ── */}
          {activeTab === 'moderation' && (
            <motion.div key="moderation" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#081c15', margin: 0 }}>Review Moderation</h2>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Manage user reviews and flag inappropriate content.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setFilterSuspicious(!filterSuspicious)} style={{ padding: '10px 18px', background: filterSuspicious ? '#ffb703' : 'white', color: '#1b4332', border: '1.5px solid ' + (filterSuspicious ? '#ffb703' : '#e0e0e0'), fontWeight: 800, borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {filterSuspicious ? 'Viewing Flagged' : 'Show Flagged Only'}
                  </button>
                  <button
                    onClick={async () => {
                      const flagged = moderationReviews.filter(r => BAD_WORDS.some(w => r.text?.toLowerCase().includes(w)));
                      if (flagged.length === 0) return alert('No flagged reviews found.');
                      if (window.confirm(`Delete all ${flagged.length} flagged reviews?`)) {
                        for (const rev of flagged) await axios.delete(`/api/admin/reviews/${rev.placeId}/${rev._id}`);
                        fetchModerationReviews();
                      }
                    }}
                    style={{ padding: '10px 18px', background: '#ae2012', color: 'white', border: 'none', fontWeight: 800, borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete All Flagged
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(() => {
                  const filtered = moderationReviews.filter(r => !filterSuspicious || BAD_WORDS.some(w => r.text?.toLowerCase().includes(w))).slice(0, 10);
                  return filtered.length > 0 ? filtered.map((rev, idx) => {
                    const isFlagged = BAD_WORDS.some(w => rev.text?.toLowerCase().includes(w));
                    return (
                      <motion.div key={rev._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} style={{ padding: '20px 24px', background: 'white', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderLeft: `5px solid ${isFlagged ? '#ae2012' : '#2d6a4f'}`, boxShadow: '0 3px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 900, color: '#081c15', fontSize: '0.95rem' }}>{rev.user}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#888', background: '#f5f5f5', padding: '3px 8px', borderRadius: '6px' }}>{rev.placeName}</span>
                            {isFlagged && <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ae2012', background: 'rgba(174,32,18,0.08)', padding: '3px 8px', borderRadius: '6px' }}>FLAGGED</span>}
                            <span style={{ fontSize: '0.65rem', color: '#ccc' }}>{new Date(rev.date).toLocaleDateString()}</span>
                          </div>
                          <p style={{ margin: 0, color: '#555', fontSize: '0.95rem', lineHeight: 1.5 }}>"{rev.text}"</p>
                        </div>
                        <button onClick={() => deleteReview(rev.placeId, rev._id)} style={{ width: '42px', height: '42px', background: '#fef2f2', color: '#ae2012', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Trash2 size={17} />
                        </button>
                      </motion.div>
                    );
                  }) : (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                      <ShieldAlert size={52} color="#d8f3dc" style={{ marginBottom: '16px' }} />
                      <h4 style={{ margin: 0, color: '#999', fontWeight: 800 }}>{filterSuspicious ? 'No flagged reviews' : 'No reviews yet'}</h4>
                      <p style={{ color: '#bbb', fontSize: '0.85rem', marginTop: '8px' }}>All content looks clean.</p>
                    </div>
                  );
                })()}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#ccc', marginTop: '24px', fontWeight: 700 }}>Showing up to 10 most recent reviews</p>
            </motion.div>
          )}

          {/* ── CONTRIBUTIONS / SUBMISSIONS ── */}
          {activeTab === 'contributions' && (
            <motion.div key="contributions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#081c15', margin: 0 }}>Community Submissions</h2>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Itineraries submitted by travelers — review and convert to trips.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {pendingCount > 0 && (
                    <span style={{ padding: '6px 16px', background: '#d8f3dc', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, color: '#1b4332' }}>
                      {pendingCount} pending
                    </span>
                  )}
                  <button onClick={fetchContributions} style={{ padding: '10px 18px', background: 'white', color: '#1b4332', border: '1.5px solid #e0e0e0', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {contributions.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <FileText size={52} color="#d8f3dc" style={{ marginBottom: '16px' }} />
                  <h4 style={{ margin: 0, color: '#999', fontWeight: 800 }}>No submissions yet</h4>
                  <p style={{ color: '#bbb', fontSize: '0.85rem', marginTop: '8px' }}>Community submissions will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {contributions.map((contrib, idx) => (
                    <motion.div key={contrib._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} style={{ padding: '24px', background: contrib.status === 'processed' ? '#f8fdf9' : 'white', borderRadius: '16px', border: '1px solid ' + (contrib.status === 'processed' ? '#d8f3dc' : '#f0f0f0'), borderLeft: `5px solid ${contrib.status === 'processed' ? '#2d6a4f' : '#ffb703'}`, boxShadow: '0 3px 15px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 900, color: '#081c15', fontSize: '1rem' }}>{contrib.userName}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px', borderRadius: '50px', background: contrib.status === 'processed' ? '#d8f3dc' : 'rgba(255,183,3,0.12)', color: contrib.status === 'processed' ? '#1b4332' : '#b45309' }}>
                            {contrib.status === 'processed' ? 'Processed' : 'Pending'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#bbb' }}>{new Date(contrib.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: '#555', fontSize: '0.92rem', lineHeight: 1.6 }}>"{contrib.text}"</p>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {contrib.status === 'pending' && (
                          <button onClick={() => synthesizeContribution(contrib)} style={{ padding: '12px 20px', background: '#081c15', color: '#ffb703', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(8,28,21,0.15)' }}>
                            <Zap size={15} /> Convert to Trip
                          </button>
                        )}
                        {contrib.status === 'processed' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2d6a4f', fontSize: '0.78rem', fontWeight: 900 }}>
                            <CheckCircle size={16} /> Done
                          </div>
                        )}
                        <button onClick={() => deleteContribution(contrib._id)} style={{ padding: '10px 14px', background: '#fff0f0', color: '#e63946', border: '1.5px solid #fcd0d3', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`
        @keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .admin-mobile-menu-btn { display: none; }
        .admin-desktop-tabs { display: flex; }
        @media (max-width: 768px) {
          .admin-mobile-menu-btn { display: flex !important; }
          .admin-desktop-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
}
