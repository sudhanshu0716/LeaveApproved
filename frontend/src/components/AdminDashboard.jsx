import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Users, Map, Plus, Trash2, Edit2, 
  ShieldAlert, Lock, Zap, Star, MessageSquare
} from 'lucide-react';
import FlowBuilder from './FlowBuilder';

const BAD_WORDS = ['spam', 'fake', 'bad', 'scam', 'toxic', 'fuck', 'shit'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState([]);
  const [places, setPlaces] = useState([]);
  const [moderationReviews, setModerationReviews] = useState([]);
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  
  const [form, setForm] = useState({
    name: '', description: '', budgetRange: 'under 5000 rupees', days: '2 day', distance: 'under 250km'
  });
  const [editingId, setEditingId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [socialStats, setSocialStats] = useState({ bestPlaces: [], latestReviews: [] });

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      fetchPlaces();
      fetchSocialStats();
      fetchModerationReviews();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/analytics');
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/admin/places');
      setPlaces(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSocialStats = async () => {
    try {
      const res = await axios.get('/api/admin/social-stats');
      setSocialStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchModerationReviews = async () => {
    try {
      const res = await axios.get('/api/admin/all-reviews');
      setModerationReviews(res.data);
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', credentials);
      if (res.data.success) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Access Denied');
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
    } catch (err) { alert('Operation Failed'); }
  };

  const deletePlace = async (id) => {
    if (window.confirm('Commence permanent deletion?')) {
      await axios.delete(`/api/admin/places/${id}`);
      fetchPlaces();
    }
  };

  const editPlace = (place) => {
    setEditingId(place._id);
    setForm({
      name: place.name || '',
      description: place.description || '',
      budgetRange: place.budgetRange || 'under 5000',
      days: place.days || '2 day',
      distance: place.distance || 'under 250km'
    });
    setNodes(place.nodes || []);
    setEdges(place.edges || []);
    setActiveTab('addPlace');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', description: '', budgetRange: 'under 5000 rupees', days: '2 day', distance: 'under 250km' });
    setNodes([]);
    setEdges([]);
  };

  const deleteReview = async (placeId, reviewId) => {
    if(window.confirm('Purge review?')) {
      try {
        await axios.delete(`/api/admin/reviews/${placeId}/${reviewId}`);
        fetchModerationReviews();
      } catch(err) { }
    }
  };

  const generateTripAI = async () => {
    if (!aiInput) return alert('INTEL REQUIRED: Provide raw mission context.');
    setIsAiLoading(true);
    try {
      const prompt = `You are a Master Travel Architect. Parse the following unstructured message into a high-fidelity Mission Blueprint (JSON).
      
      Input text: "${aiInput}"
      
      REQUIRED JSON STRUCTURE:
      {
        "name": "Creative Mission Title",
        "description": "Engaging description",
        "days": "1 day" | "2 day" | "3 day" | "3+ days",
        "budgetRange": "under 1000 rupees" | "under 2000 rupees" | "under 5000 rupees" | "over 5000 rupees",
        "distance": "under 100km" | "under 250km" | "under 500km" | "over 500km",
        "nodes": [
          { 
            "id": "unique-id", 
            "type": "cityNode|hubNode", 
            "position": {"x": number, "y": number}, 
            "data": {
              "label": "City Name", 
              "markerDay": "Day 1|Day 2...", 
              "arrivalTime": "00:00", 
              "departureTime": "00:00", 
              "rooms": "Hotel", 
              "food": "Food", 
              "activity": "Activity", 
              "color": "#1b4332"
            } 
          }
        ],
        "edges": [
          { "id": "unique-id", "source": "node-id", "target": "node-id", "type": "customEdge", "data": {"transport": "FLIGHT|BUS|TRAIN|CAB", "color": "#000"} }
        ]
      }

      NOTE: Arrange nodes spatially (x: 200-800, y: 100-500).
      Return ONLY raw JSON.`;

      const response = await axios.post('/api/ai/generate', { prompt });
      const rawText = response.data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, ''));
      
      setForm({
        name: parsed.name || 'UNNAMED_EXPEDITION',
        description: parsed.description || '',
        days: parsed.days || '2 day',
        budgetRange: parsed.budgetRange || 'under 2000',
        distance: parsed.distance || 'under 250km'
      });
      
      if(parsed.nodes) {
        // Automatically stagger nodes with High-Fidelity Expansion (850px gap)
        const staggeredNodes = parsed.nodes.map((n, idx) => ({
          ...n,
          position: { 
            x: 100 + idx * 850, 
            y: 150 + (idx % 2 === 0 ? 0 : 250)
          }
        }));
        setNodes(staggeredNodes);
      }
      if(parsed.edges) setEdges(parsed.edges);

      alert('SYNTHESIS COMPLETE: Neural Forge has blueprinted the mission.');
    } catch(err) { 
      console.error(err);
      alert('SYNTHESIS ERROR: Neural Forge failed to blueprint. Check terminal logs.'); 
    }
    setIsAiLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#081c15', position: 'relative', overflow: 'hidden' }}>
        
        {/* Obsidian Background Layer */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
           <video src="/MUNNAR.mp4" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, filter: 'grayscale(1) brightness(0.5)' }} />
           <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, rgba(8,28,21,1))' }} />
           <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(216, 243, 220, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(216, 243, 220, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="glass-panel" 
          style={{ 
            padding: '80px 50px', 
            maxWidth: '440px', 
            width: '100%', 
            textAlign: 'center', 
            background: 'rgba(15, 30, 25, 0.9)', 
            backdropFilter: 'blur(40px)', 
            border: '1px solid rgba(216, 243, 220, 0.15)', 
            borderRadius: '40px', 
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 50px 150px rgba(0,0,0,0.8)'
          }}
        >
          <div style={{ position: 'relative', marginBottom: '40px' }}>
             <div style={{ background: 'rgba(216, 243, 220, 0.05)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid rgba(216, 243, 220, 0.1)' }}>
               <Lock size={40} color="#ffb703" style={{ opacity: 0.8 }} />
             </div>
             <div style={{ position: 'absolute', inset: '-10px', border: '1px dashed #ffb703', borderRadius: '50%', opacity: 0.2, animation: 'rotating 10s linear infinite' }} />
          </div>

          <div style={{ marginBottom: '45px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#ffb703', letterSpacing: '5px', display: 'block', marginBottom: '10px', opacity: 0.8 }}>MISSION AUTHORITY</span>
            <h2 className="title" style={{ fontSize: '1.8rem', color: 'white', margin: 0, letterSpacing: '2px' }}>TERMINAL_LOGIN</h2>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
               <span style={{ position: 'absolute', top: '-18px', left: 0, fontSize: '0.55rem', fontWeight: 900, color: 'rgba(216, 243, 220, 0.4)', letterSpacing: '2px' }}>AUTHORITY_ID</span>
               <input 
                 style={{ background: 'transparent', border: 'none', width: '100%', padding: '12px 0', color: 'white', fontSize: '1.1rem', outline: 'none', fontFamily: 'monospace' }} 
                 placeholder="SCAN UID..." 
                 value={credentials.username} 
                 onChange={e => setCredentials({...credentials, username: e.target.value})} 
                 required 
               />
            </div>
            <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
               <span style={{ position: 'absolute', top: '-18px', left: 0, fontSize: '0.55rem', fontWeight: 900, color: 'rgba(216, 243, 220, 0.4)', letterSpacing: '2px' }}>ACCESS_ENCRYPTION</span>
               <input 
                 type="password" 
                 style={{ background: 'transparent', border: 'none', width: '100%', padding: '12px 0', color: 'white', fontSize: '1.1rem', outline: 'none', fontFamily: 'monospace' }} 
                 placeholder="KEYSTROKE..." 
                 value={credentials.password} 
                 onChange={e => setCredentials({...credentials, password: e.target.value})} 
                 required 
               />
            </div>
            
            <button 
              type="submit" 
              className="premium-choice" 
              style={{ 
                justifyContent: 'center', 
                background: 'rgba(255,183,3,0.1)', 
                border: '1px solid #ffb703', 
                color: '#ffb703', 
                padding: '24px', 
                borderRadius: '16px', 
                fontWeight: 900, 
                fontSize: '0.85rem', 
                letterSpacing: '4px',
                cursor: 'pointer',
                marginTop: '15px' 
              }}
            >
              AUTHORIZE ACCESS
            </button>
          </form>

          <div style={{ marginTop: '40px', fontSize: '0.5rem', color: 'rgba(216, 243, 220, 0.3)', letterSpacing: '2px', fontWeight: 900 }}>
             SYSTEM_ROOT: MUNNAR_08 / ENCRYPTION: AES-256
          </div>
        </motion.div>

        <style>{`
           @keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8fdfa', position: 'relative', zIndex: 0 }}>
      <div className="app-bg" />
      <div className="video-bg">
        <video autoPlay loop muted playsInline>
          <source src="/MUNNAR.mp4" type="video/mp4" />
        </video>
      </div>
      
      <nav className="glass-panel" style={{ position: 'sticky', top: '20px', margin: '0 20px', zIndex: 1000, padding: '12px 24px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} color="var(--primary-green)" />
          <h2 className="title" style={{ fontSize: '1.2rem', margin: 0 }}>AUTHORITY <span style={{ color: 'var(--primary-green)' }}>LOGS</span></h2>
        </div>
        
        <div className="desktop-menu" style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'analytics', icon: <Users size={18} />, label: 'Intelligence' },
            { id: 'places', icon: <Map size={18} />, label: 'Directory' },
            { id: 'addPlace', icon: <Plus size={18} />, label: editingId ? 'Refine' : 'Synthesize' },
            { id: 'moderation', icon: <ShieldAlert size={18} />, label: 'Sanitizer' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if(tab.id !== 'addPlace') resetForm(); }}
              className="glass-btn"
              style={{ padding: '10px 20px', fontSize: '0.8rem', background: activeTab === tab.id ? 'var(--primary-green)' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--primary-green)', border: 'none' }}
            >
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <main className="container" style={{ position: 'relative', zIndex: 10, padding: '40px 20px' }}>
        <AnimatePresence mode="wait">
          
          {activeTab === 'analytics' && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel" style={{ padding: '40px', background: 'white' }}>
              <h3 className="title" style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Traveler Intelligence</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                 <div className="premium-card" style={{ padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#1b4332', letterSpacing: '2px', marginBottom: '25px', opacity: 0.8 }}>MAPPING_CONCENTRATION</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       {Object.entries(analytics.reduce((acc, curr) => {
                         acc[curr.company] = (acc[curr.company] || 0) + 1;
                         return acc;
                       }, {})).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([company, count]) => (
                         <div key={company} style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ fontWeight: 900, color: '#081c15', fontSize: '0.75rem', letterSpacing: '1px' }}>{company?.toUpperCase()}</span>
                               <span style={{ fontWeight: 900, color: '#1b4332', fontSize: '0.9rem' }}>{count} <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>MISSIONS</span></span>
                            </div>
                            <div style={{ background: '#f0f0f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                               <div style={{ background: 'linear-gradient(90deg, #1b4332, #2d6a4f)', height: '100%', width: `${analytics.length ? (count/analytics.length)*100 : 0}%`, borderRadius: '5px' }} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* MISSION LAUNCH VELOCITY (24H PULSE) */}
                 <div className="premium-card" style={{ padding: '30px', background: '#1b4332', color: 'white', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <h4 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'white', letterSpacing: '2px', opacity: 0.6 }}>MISSION_LAUNCH_VELOCITY</h4>
                       <Zap size={18} color="#ffb703" />
                    </div>
                    
                    <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '3px', marginTop: '30px' }}>
                       {Array.from({ length: 24 }).map((_, hour) => {
                         const missionsInHour = analytics.filter(log => new Date(log.createdAt).getHours() === hour).length;
                         const maxMissions = Math.max(...Array.from({ length: 24 }).map((_, h) => analytics.filter(log => new Date(log.createdAt).getHours() === h).length), 1);
                         const heightVal = (missionsInHour / maxMissions) * 100;
                         
                         return (
                           <div key={hour} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                              <div style={{ 
                                width: '100%', 
                                height: `${Math.max(heightVal, 5)}%`, 
                                background: heightVal > 70 ? '#ffb703' : 'rgba(216, 243, 220, 0.4)', 
                                borderRadius: '2px',
                                transition: 'all 0.5s ease'
                              }} />
                           </div>
                         );
                       })}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                       <div>
                          <span style={{ fontSize: '0.5rem', display: 'block', opacity: 0.5, letterSpacing: '1px' }}>PEAK_LAUNCH_WINDOW</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#ffb703' }}>
                             {(() => {
                               let peakHour = 0;
                               let maxCount = 0;
                               for(let h=0; h<24; h++) {
                                 const count = analytics.filter(log => new Date(log.createdAt).getHours() === h).length;
                                 if(count > maxCount) { maxCount = count; peakHour = h; }
                               }
                               return `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour+1).toString().padStart(2, '0')}:00 HRS`;
                             })()}
                          </span>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.5rem', display: 'block', opacity: 0.5, letterSpacing: '1px' }}>SYSTEM_VELOCITY</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>STABLE</span>
                       </div>
                    </div>
                 </div>
              </div>

                {/* MISSION LEDGER TERMINAL */}
                <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', background: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#d8f3dc', color: '#1b4332', position: 'sticky', top: 0, zIndex: 20 }}>
                       <tr>
                          <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px' }}>IDENTITY</th>
                          <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px' }}>SECTOR / COMPANY</th>
                          <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px' }}>TIMESTAMP</th>
                       </tr>
                    </thead>
                    <tbody>
                       {analytics.map((log, idx) => (
                          <tr key={log._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(216, 243, 220, 0.1)' }}>
                             <td style={{ padding: '18px 20px', fontWeight: 900, color: '#081c15', fontSize: '0.9rem' }}>{log.name?.toUpperCase()}</td>
                             <td style={{ padding: '18px 20px', color: '#1b4332', fontWeight: 700, fontSize: '0.85rem' }}>{log.company?.toUpperCase()}</td>
                             <td style={{ padding: '18px 20px', color: 'rgba(8, 28, 21, 0.5)', fontSize: '0.8rem', fontWeight: 600 }}>{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
            </motion.div>
          )}

          {activeTab === 'places' && (
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  {places.map(place => (
                    <div key={place._id} className="premium-card" style={{ padding: '24px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 className="title" style={{ fontSize: '1.4rem', margin: 0 }}>{place.name}</h3>
                          <div style={{ display: 'flex', gap: '8px' }}>
                             <button onClick={() => editPlace(place)} style={{ color: 'var(--primary-green)', background: 'none', border: 'none' }}><Edit2 size={18} /></button>
                             <button onClick={() => deletePlace(place._id)} style={{ color: '#ae2012', background: 'none', border: 'none' }}><Trash2 size={18} /></button>
                          </div>
                       </div>
                        <p style={{ color: '#2d6a4f', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px', fontWeight: 600 }}>{place.description}</p>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           <span style={{ padding: '6px 12px', background: '#d8f3dc', color: '#1b4332', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                              {place.days?.toUpperCase()}
                           </span>
                           <span style={{ padding: '6px 12px', background: '#f0f0f0', color: '#081c15', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                              {place.budgetRange?.toUpperCase()}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'addPlace' && (
             <motion.div key="2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', background: 'white', overflow: 'hidden', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.05)' }}>
                
                {/* AI INTEL TERMINAL HEADER */}
                <div style={{ background: '#081c15', padding: '40px', color: 'white' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                         <Zap color="#ffb703" size={24} />
                         <h3 className="title" style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '2px' }}>AI_INTEL_PROCESSOR</h3>
                      </div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>STATUS: READY_FOR_TELEMETRY</span>
                   </div>
                   
                   <textarea 
                      placeholder="PASTE RAW MISSION CONTEXT HERE (e.g. 'I want a 3 day luxury escape to Coorg with estate walks...')"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'monospace', resize: 'none' }}
                   />
                   
                   <button 
                      onClick={generateTripAI}
                      disabled={isAiLoading}
                      style={{ width: '100%', marginTop: '20px', padding: '18px', background: '#ffb703', border: 'none', borderRadius: '14px', color: '#081c15', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', opacity: isAiLoading ? 0.6 : 1 }}
                   >
                      {isAiLoading ? 'BRIDGE_SYNCHRONIZING...' : 'INITIALIZE AI SYNTHESIS'}
                   </button>
                </div>

                <div style={{ padding: '50px' }}>
                   <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                      <h3 className="title" style={{ fontSize: '1.8rem', margin: 0 }}>{editingId ? 'Refine Blueprint' : 'Manual Blueprint Override'}</h3>
                      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px' }}>Configure mission parameters with absolute precision.</p>
                   </div>

                   <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                         <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px' }}>CAMPAIGN_NAME</span>
                            <input className="modern-input" placeholder="e.g. MISSION_OVAL_OFFICE" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ marginTop: '5px', padding: '18px' }} />
                         </div>
                         <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px' }}>MISSION_DURATION</span>
                            <select className="modern-input" value={form.days} onChange={e => setForm({...form, days: e.target.value})} style={{ marginTop: '5px', padding: '18px' }}>
                               <option>1 day</option><option>2 day</option><option>3 day</option><option>3+ days</option>
                            </select>
                         </div>
                      </div>

                      <div style={{ position: 'relative' }}>
                         <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px' }}>GEOGRAPHIC_BLUEPRINT (DESCRIPTION)</span>
                         <textarea className="modern-input" style={{ height: '100px', marginTop: '5px', padding: '18px' }} placeholder="Define the core mission objective..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                         <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px' }}>BUDGET_BLUEPRINT</span>
                            <select className="modern-input" value={form.budgetRange} onChange={e => setForm({...form, budgetRange: e.target.value})} style={{ marginTop: '5px', padding: '18px' }}>
                               <option>under 1000</option><option>under 2000</option><option>under 5000</option><option>over 5000</option>
                            </select>
                         </div>
                         <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px' }}>RADIUS_OF_OPERATION</span>
                            <select className="modern-input" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} style={{ marginTop: '5px', padding: '18px' }}>
                               <option>under 100km</option><option>under 250km</option><option>under 500km</option><option>over 500km</option>
                            </select>
                         </div>
                      </div>

                      <div>
                         <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginLeft: '10px', display: 'block', marginBottom: '10px' }}>MISSION_FLOW_ARCHITECTURE</span>
                         <div style={{ height: '500px', borderRadius: '24px', border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)' }}>
                            <FlowBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
                         </div>
                      </div>

                      <button type="submit" className="glass-btn" style={{ justifyContent: 'center', padding: '24px', background: '#1b4332', color: 'white', borderRadius: '18px', fontSize: '1rem', letterSpacing: '3px', fontWeight: 950 }}>DEPLOY_MISSION_BLUEPRINT</button>
                   </form>
                </div>
             </motion.div>
          )}

          {activeTab === 'moderation' && (
             <motion.div key="4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '50px', background: 'white', borderRadius: '40px', boxShadow: '0 30px 100px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                   <div>
                      <h3 className="title" style={{ fontSize: '2.5rem', margin: 0 }}>Review Sanitizer</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>Neutralize rogue signals and maintain mission integrity.</p>
                   </div>
                   <div style={{ display: 'flex', gap: '15px' }}>
                      <button 
                        onClick={() => setFilterSuspicious(!filterSuspicious)} 
                        className="glass-btn" 
                        style={{ padding: '12px 25px', background: filterSuspicious ? '#ffb703' : '#f0f4f8', color: '#1b4332', border: 'none', fontWeight: 900, borderRadius: '15px' }}
                      >
                         {filterSuspicious ? 'VIEWING_SUSPICIOUS' : 'FILTER_PROFANITY'}
                      </button>
                      <button 
                        onClick={async () => {
                          const flagged = moderationReviews.filter(r => BAD_WORDS.some(w => r.text?.toLowerCase().includes(w)));
                          if(flagged.length === 0) return alert('No suspicious signals detected.');
                          if(window.confirm(`Execute automatic purge of ${flagged.length} flagged signals?`)) {
                            for(const rev of flagged) {
                              await axios.delete(`/api/admin/reviews/${rev.placeId}/${rev._id}`);
                            }
                            fetchModerationReviews();
                            alert('PURGE_COMPLETE: Rogue signals neutralized.');
                          }
                        }}
                        className="glass-btn" 
                        style={{ padding: '12px 25px', background: '#ae2012', color: 'white', border: 'none', fontWeight: 900, borderRadius: '15px' }}
                      >
                         PURGE_ALL_FLAGGED
                      </button>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {(() => {
                      const filtered = moderationReviews
                        .filter(r => !filterSuspicious || BAD_WORDS.some(w => r.text?.toLowerCase().includes(w)))
                        .slice(0, 10);
                      
                      return filtered.length > 0 ? filtered.map((rev, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: idx * 0.05 }}
                          key={rev._id} 
                          className="premium-card" 
                          style={{ padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: BAD_WORDS.some(w => rev.text?.toLowerCase().includes(w)) ? '6px solid #ae2012' : '6px solid #1b4332' }}
                        >
                           <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                 <span style={{ fontWeight: 900, color: '#1b4332', fontSize: '1rem' }}>{rev.user?.toUpperCase()}</span>
                                 <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#999', background: '#f8f9fa', padding: '4px 10px', borderRadius: '6px' }}>{rev.placeName?.toUpperCase()}</span>
                                 <span style={{ fontSize: '0.65rem', color: '#ccc' }}>{new Date(rev.date).toLocaleString()}</span>
                              </div>
                              <p style={{ margin: 0, fontWeight: 600, color: '#444', fontSize: '1.05rem', lineHeight: '1.4' }}>"{rev.text}"</p>
                              {BAD_WORDS.some(w => rev.text?.toLowerCase().includes(w)) && (
                                <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                                   {BAD_WORDS.filter(w => rev.text?.toLowerCase().includes(w)).map(w => (
                                     <span key={w} style={{ fontSize: '0.55rem', fontWeight: 900, color: '#ae2012', border: '1px solid #ae2012', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>FLAGGED: {w}</span>
                                   ))}
                                </div>
                              )}
                           </div>
                           <button 
                             onClick={() => deleteReview(rev.placeId, rev._id)} 
                             className="glass-btn" 
                             style={{ background: '#f8f9fa', color: '#ae2012', border: '1.5px solid #edf0f2', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}
                           >
                              <Trash2 size={20} />
                           </button>
                        </motion.div>
                      )) : (
                        <div style={{ padding: '80px', textAlign: 'center', background: '#fcfdfd', borderRadius: '30px', border: '2px dashed #eee' }}>
                           <ShieldAlert size={60} color="#ccc" style={{ marginBottom: '20px' }} />
                           <h4 style={{ margin: 0, color: '#999', letterSpacing: '2px' }}>CLEAN_SPECTRUM: NO ROGUE SIGNALS DETECTED</h4>
                           <p style={{ color: '#bbb', fontSize: '0.8rem', marginTop: '10px' }}>All community telemetry currently matches safety parameters.</p>
                        </div>
                      );
                   })()}
                </div>
                
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                   <p style={{ fontSize: '0.7rem', color: '#ccc', fontWeight: 900, letterSpacing: '2px' }}>SHOWING 10 LATEST SIGNALS INMODERATION QUEUE</p>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
