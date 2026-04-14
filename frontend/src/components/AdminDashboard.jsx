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
    name: '', description: '', budgetRange: 'under 5000', days: '2 day', distance: 'under 250km'
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
    setForm({ name: '', description: '', budgetRange: 'under 5000', days: '2 day', distance: 'under 250km' });
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
    if (!aiInput) return alert('Input context required.');
    setIsAiLoading(true);
    try {
      const prompt = `You are a travel parser. Parse this unstructured trip plan into a structured JSON. 
Input text: ${aiInput}
... (Rest of AI logic) ...`;
      const response = await axios.post('/api/ai/generate', { prompt });
      alert('AI Integrated Synthesis Complete');
    } catch(err) { alert('AI Connectivity Issue'); }
    setIsAiLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="app-bg" />
        <div className="video-bg">
          <video autoPlay loop muted playsInline>
            <source src="/MUNNAR.mp4" type="video/mp4" />
          </video>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '60px 40px', maxWidth: '450px', width: '100%', textAlign: 'center', background: 'white' }}>
          <div style={{ background: 'var(--accent-mint)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--primary-green)' }}>
            <Lock size={40} />
          </div>
          <h2 className="title" style={{ fontSize: '2rem' }}>AUTHORITY PORTAL</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginBottom: '40px' }}>Secure Credentials Required</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input className="modern-input" placeholder="Authority UID" value={credentials.username} onChange={e => setCredentials({...credentials, username: e.target.value})} required />
            <input type="password" className="modern-input" placeholder="Secret Key" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} required />
            <button type="submit" className="glass-btn" style={{ justifyContent: 'center' }}>ACCESS CONSOLE</button>
          </form>
        </motion.div>
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
                 <div className="premium-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontWeight: 900, color: 'var(--text-muted)' }}>MAPPING CONCENTRATION</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                       {Object.entries(analytics.reduce((acc, curr) => {
                         acc[curr.company] = (acc[curr.company] || 0) + 1;
                         return acc;
                       }, {})).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([company, count]) => (
                         <div key={company}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                               <span style={{ fontWeight: 800 }}>{company}</span>
                               <span style={{ fontWeight: 900, color: 'var(--primary-green)' }}>{count}</span>
                            </div>
                            <div style={{ background: 'var(--accent-mint)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                               <div style={{ background: 'var(--primary-green)', height: '100%', width: `${analytics.length ? (count/analytics.length)*100 : 0}%` }} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="premium-card" style={{ padding: '24px', background: 'var(--primary-green)', color: 'white' }}>
                    <h4 style={{ fontWeight: 900, opacity: 0.6 }}>INTENSITY VARIANCE</h4>
                    <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '4px', marginTop: '20px' }}>
                       {[...Array(20)].map((_, i) => (
                         <div key={i} style={{ flex: 1, background: 'var(--accent-gold)', height: `${Math.random() * 100}%`, borderRadius: '2px' }} />
                       ))}
                    </div>
                 </div>
              </div>

               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--accent-mint)', color: 'var(--primary-green)' }}>
                     <tr>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 900 }}>IDENTITY</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 900 }}>CONTEXT</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 900 }}>TIMESTAMP</th>
                     </tr>
                  </thead>
                  <tbody>
                     {analytics.slice(0, 20).map(log => (
                        <tr key={log._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                           <td style={{ padding: '16px', fontWeight: 800 }}>{log.name}</td>
                           <td style={{ padding: '16px' }}>{log.company}</td>
                           <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
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
                       <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{place.description}</p>
                       <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ background: 'var(--accent-mint)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}>{place.days.toUpperCase()}</span>
                          <span style={{ background: '#f0f4f2', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}>{place.budgetRange.toUpperCase()}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'addPlace' && (
             <motion.div key="2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '48px', maxWidth: '900px', margin: '0 auto', background: 'white' }}>
                <h3 className="title" style={{ fontSize: '2rem', marginBottom: '32px' }}>{editingId ? 'Refine Blueprint' : 'Synthesize Escape'}</h3>
                <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   <input className="modern-input" placeholder="Campaign Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                   <textarea className="modern-input" style={{ height: '120px' }} placeholder="Mission Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                      <select className="modern-input" value={form.days} onChange={e => setForm({...form, days: e.target.value})}>
                         <option>1 day</option><option>2 day</option><option>3 day</option>
                      </select>
                      <select className="modern-input" value={form.budgetRange} onChange={e => setForm({...form, budgetRange: e.target.value})}>
                         <option>under 1000</option><option>under 2000</option><option>under 5000</option><option>over 5000</option>
                      </select>
                      <select className="modern-input" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})}>
                         <option>under 250km</option><option>under 500km</option><option>under 1000km</option><option>over 1000km</option>
                      </select>
                   </div>

                   <div style={{ height: '500px', borderRadius: '24px', border: '1px solid #ddd', overflow: 'hidden' }}>
                      <FlowBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
                   </div>

                   <button type="submit" className="glass-btn" style={{ justifyContent: 'center' }}>DEPLOY MISSION</button>
                </form>
             </motion.div>
          )}

          {activeTab === 'moderation' && (
             <motion.div key="4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '40px', background: 'white' }}>
                <h3 className="title" style={{ fontSize: '2rem', marginBottom: '32px' }}>Content Sanitization</h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                   <button onClick={() => setFilterSuspicious(!filterSuspicious)} className="glass-btn" style={{ flex: 1, justifyContent: 'center', background: filterSuspicious ? 'var(--accent-gold)' : 'white', color: 'var(--primary-green)' }}>
                      {filterSuspicious ? 'SHOWING FLAGGED' : 'FILTER SUSPICIOUS'}
                   </button>
                </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {moderationReviews.length > 0 ? moderationReviews.filter(r => !filterSuspicious || BAD_WORDS.some(w => r.text?.toLowerCase().includes(w))).map(rev => (
                       <div key={rev._id} className="premium-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                             <span style={{ fontWeight: 900, color: 'var(--primary-green)' }}>{rev.user}</span>
                             <p style={{ margin: '8px 0', fontWeight: 600 }}>"{rev.text}"</p>
                          </div>
                          <button onClick={() => deleteReview(rev.placeId, rev._id)} className="glass-btn" style={{ background: '#ae2012', color: 'white' }}><Trash2 size={16} /></button>
                       </div>
                    )) : (
                       <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                          <ShieldAlert size={48} style={{ marginBottom: '16px' }} />
                          <p>NO COMMUNITY CONTENT REQUIRING SANITIZATION</p>
                       </div>
                    )}
                 </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
