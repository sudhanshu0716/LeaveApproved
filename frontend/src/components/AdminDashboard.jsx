import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Users, Map, Lock, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowBuilder from './FlowBuilder';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const [activeTab, setActiveTab] = useState('places'); 
  const [analytics, setAnalytics] = useState([]);
  const [places, setPlaces] = useState([]);
  
  // States for Flow Builder
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '', description: '', budgetRange: 'under 5000', days: '2 day', distance: 'under 250km'
  });

  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const generateTripAI = async () => {
    if (!aiInput) return alert('Paste a trip description first!');
    
    setIsAiLoading(true);
    try {
       const prompt = `You are a travel parser. Parse this unstructured trip plan into a structured JSON. 
Return ONLY valid raw JSON (no markdown formatting, no backticks).
Input text: ${aiInput}
Required format:
{
  "name": "Trip name",
  "budgetRange": "under X", // options: under 1000, under 2000, under 5000, over 5000
  "days": "N days", // options: 1 day, 2 day, 3 day, 4 days, 1 week
  "distance": "under Xkm", // options: under 250km, under 500km, under 1000km, over 1000km
  "nodes": [
     { "id": "cityNode1", "type": "cityNode", "position": { "x": 50, "y": 150 }, "data": { "label": "Origin", "arrivalTime": "09:00", "departureTime": "12:00", "rooms": "N/A", "food": "Cafes", "activity": "Walking" } }
  ],
  "edges": [
     { "id": "e1", "source": "cityNode1", "target": "cityNode2", "data": { "transport": "Bus", "transportDetails": "Express", "direction": "Outbound" } }
  ]
}
Make sure 'position' uses x spaced out horizontally for each node.`;

       const response = await axios.post('/api/ai/generate', { prompt });
       const aiData = response.data;
       
       if (aiData.error) {
         throw new Error(aiData.error.message || 'AI generation failed');
       }
       
       const rawText = aiData.candidates[0].content.parts[0].text;
       const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
       const parsed = JSON.parse(cleanJson);
       
       setForm(prev => ({ ...prev, name: parsed.name || prev.name, budgetRange: parsed.budgetRange || prev.budgetRange, days: parsed.days || prev.days, distance: parsed.distance || prev.distance }));
       
       // Process nodes to intelligently assign unique IDs and enforce native layout spacing
       const idMap = {};
       const newNodes = (parsed.nodes || []).map((n, index) => {
           const safeId = `aiNode-${index}-${Date.now()}`;
           idMap[n.id] = safeId;
           return { 
               ...n, 
               id: safeId,
               position: { x: 50 + (index * 1000), y: 150 },
               data: { ...n.data } 
           };
       });
       setNodes(newNodes);
       
       const connectionCounts = {};
       const newEdges = (parsed.edges || []).map((e, idx) => {
           const safeSource = idMap[e.source] || e.source;
           const safeTarget = idMap[e.target] || e.target;
           
           // Count overlapping edges to generate the bezier spread index natively
           const connectionKey = [safeSource, safeTarget].sort().join('-vs-');
           connectionCounts[connectionKey] = (connectionCounts[connectionKey] || 0) + 1;
           const newEdgeIndex = connectionCounts[connectionKey] - 1;
           
           return { 
               ...e, 
               id: `aiEdge-${idx}-${Date.now()}`,
               source: safeSource,
               target: safeTarget,
               type: 'customEdge',
               data: { ...e.data, edgeIndex: newEdgeIndex }
           };
       });
       setEdges(newEdges);
       
       alert('Trip synthesized successfully!');
    } catch(err) {
       console.error("AI Gen Error: ", err);
       alert('Failed: ' + err.message);
    }
    setIsAiLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', credentials);
      if (res.data.success) {
        setIsAuthenticated(true);
        fetchAnalytics();
        fetchPlaces();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unauthorized Access Attempt');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/analytics');
      setAnalytics(res.data);
    } catch(err) {}
  };

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/admin/places');
      setPlaces(res.data);
    } catch(err) {}
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    
    // Prepare nodes and edges for saving without non-serializable react functions
    const cleanNodes = nodes.map(n => {
       const clone = { ...n, data: { ...n.data } };
       delete clone.data.onChangeField;
       delete clone.data.onDeleteNode;
       return clone;
    });

    const cleanEdges = edges.map(edge => {
       const clone = { ...edge, data: { ...edge.data } };
       delete clone.data.onDataChange;
       delete clone.data.onDeleteEdge;
       return clone;
    });

    const payload = { ...form, nodes: cleanNodes, edges: cleanEdges };

    try {
      if (editingId) {
         await axios.put(`/api/admin/places/${editingId}`, payload);
         alert('Place updated successfully!');
      } else {
         await axios.post('/api/admin/places', payload);
         alert('Place added successfully!');
      }
      
      resetForm();
      fetchPlaces();
      setActiveTab('places');
    } catch (err) {
      alert('Failed to save place.');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', budgetRange: 'under 5000', days: '2 day', distance: 'under 250km' });
    setNodes([]);
    setEdges([]);
    setEditingId(null);
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
    
    // Nodes need to be reconstructed with onChange methods because they get stripped out in the DB
    // I am using setNodes in `FlowBuilder` but the methods won't be there unless injected.
    // However, I actually wrote my FlowBuilder to map updates by ID inside FlowBuilder itself via `updateNodeDataField`, 
    // BUT the data object on initial load must have those methods. FlowBuilder actually injects them when clicking 'Add'.
    // If loading from DB, I must map these nodes to support edits OR make sure FlowBuilder logic applies to all nodes.
    // Instead of relying on data.onChangeField inside CustomNodes, let's just make the custom node call `data.onChangeField` if it exists.
    
    const dbNodes = (place.nodes || []).map((n) => ({
      ...n,
      data: {
        ...n.data,
      }
      // Note: Data onChangeField is added automatically when I modify `addCityNode`, but for DB loaded nodes, 
      // I've updated the `updateNodeDataField` to be passed down or handled. Wait, CustomNode expects `data.onChangeField`.
      // I will inject it here:
    }));

    setNodes(dbNodes);
    setEdges(place.edges || []);
    setActiveTab('addPlace');
  };

  useEffect(() => {
    // Inject the onChange handler for nodes and edges loaded from DB
    if(editingId) {
       if(nodes.length > 0 && !nodes[0].data.onChangeField) {
         const updateNodeDataField = (id, field, value) => {
            setNodes(nds => nds.map(n => {
              if(n.id === id) { 
                return { ...n, data: { ...n.data, [field]: value } }; 
              }
              return n;
            }));
         };
         const deleteNode = (id) => {
           setNodes(nds => nds.filter(n => n.id !== id));
           setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
         };
         setNodes(nds => nds.map(n => ({...n, data: {...n.data, onChangeField: updateNodeDataField, onDeleteNode: deleteNode}})));
       }
       if(edges.length > 0 && !edges[0].data?.onDataChange) {
         const updateEdgeData = (id, field, value) => {
            setEdges(eds => eds.map(e => {
              if(e.id === id) { 
                return { ...e, data: { ...e.data, [field]: value } }; 
              }
              return e;
            }));
         };
         const deleteEdge = (id) => {
           setEdges(eds => eds.filter(e => e.id !== id));
         };
         setEdges(eds => eds.map(e => ({...e, data: {...(e.data||{}), onDataChange: updateEdgeData, onDeleteEdge: deleteEdge}})));
       }
    }
  }, [nodes, edges, editingId]);

  const deletePlace = async (id) => {
    if(window.confirm('Delete this destination?')) {
      try {
        await axios.delete(`/api/admin/places/${id}`);
        fetchPlaces();
      } catch(err) {}
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '4rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Lock size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 className="title" style={{ marginBottom: '2rem' }}>Admin Access</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" className="input-field" placeholder="Username" value={credentials.username} onChange={e => setCredentials({...credentials, username: e.target.value})} />
            <input type="password" className="input-field" placeholder="Password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Verify Override</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container admin-layout">
      {/* Sidebar */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-card admin-sidebar">
        <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="#FF5D73" /> Control Room
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={() => { setActiveTab('places'); resetForm(); }} style={{ padding: '1rem', background: activeTab === 'places' ? 'var(--primary)' : 'transparent', color: '#000', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', transition: 'all 0.3s', fontWeight: 900, border: activeTab === 'places' ? '3px solid #000' : 'none' }}>
            <Map size={22} /> View Routes
          </button>
          <button onClick={() => { setActiveTab('addPlace'); resetForm(); }} style={{ padding: '1rem', background: activeTab === 'addPlace' ? 'var(--tertiary)' : 'transparent', color: '#000', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', transition: 'all 0.3s', fontWeight: 900, border: activeTab === 'addPlace' ? '3px solid #000' : 'none' }}>
            <Plus size={22} /> {editingId ? 'Edit Blueprint' : 'Build Blueprint'}
          </button>
          <button onClick={() => { setActiveTab('analytics'); resetForm(); }} style={{ padding: '1rem', background: activeTab === 'analytics' ? 'var(--secondary)' : 'transparent', color: '#000', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', transition: 'all 0.3s', fontWeight: 900, border: activeTab === 'analytics' ? '3px solid #000' : 'none' }}>
            <Users size={22} /> User Analytics
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="admin-content" style={{ paddingBottom: '5rem' }}>
        <AnimatePresence mode="wait">
        
        {activeTab === 'analytics' && (
          <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="title" style={{ margin: 0, fontSize: '2rem' }}>Traveler Intelligence</h3>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                 <div className="stats-box" style={{ background: '#000', color: '#FFE600', padding: '10px 20px', fontWeight: 900, boxShadow: '4px 4px 0px #FF5D73' }}>
                   TOTAL: {analytics.length}
                 </div>
                 <div className="stats-box" style={{ background: '#000', color: '#90E0EF', padding: '10px 20px', fontWeight: 900, boxShadow: '4px 4px 0px #FF5D73' }}>
                   COMPANIES: {[...new Set(analytics.map(a => a.company))].length}
                 </div>
              </div>
            </div>

            {/* Visual Overview */}
            <div className="mobile-grid intel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
               <div style={{ border: '4px solid #000', background: '#fff', padding: '1.5rem', boxShadow: '6px 6px 0px #000' }}>
                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>Company Concentration</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   {Object.entries(analytics.reduce((acc, curr) => {
                     acc[curr.company] = (acc[curr.company] || 0) + 1;
                     return acc;
                   }, {})).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([company, count]) => (
                     <div key={company} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, fontWeight: 'bold' }}>{company}</div>
                        <div style={{ background: '#FFE600', border: '2px solid #000', height: '10px', width: `${(count/analytics.length)*100}%` }}></div>
                        <div style={{ fontWeight: 900 }}>{count}</div>
                     </div>
                   ))}
                 </div>
               </div>

               <div style={{ border: '4px solid #000', background: '#000', color: '#fff', padding: '1.5rem', boxShadow: '6px 6px 0px #FF90E8' }}>
                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '2px solid #fff', paddingBottom: '0.5rem' }}>Checking Intensity</h4>
                 <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '80px' }}>
                    {(() => {
                      const days = {};
                      analytics.forEach(a => {
                        const d = new Date(a.createdAt).toLocaleDateString();
                        days[d] = (days[d] || 0) + 1;
                      });
                      return Object.entries(days).slice(-10).map(([day, count]) => (
                        <motion.div 
                          initial={{ height: 0 }} 
                          animate={{ height: `${(count / Math.max(...Object.values(days))) * 100}%` }}
                          key={day} 
                          title={`${day}: ${count}`}
                          style={{ flex: 1, background: '#FF90E8', border: '2px solid #fff', minWidth: '15px' }} 
                        />
                      ));
                    })()}
                 </div>
                 <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>Last 10 Active Intervals</p>
               </div>
            </div>

            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>Live Feed</h4>
            {analytics.length === 0 ? <p style={{ fontSize: '1.2rem', color: '#666' }}>No one checking out yet.</p> : (
              <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '400px', border: '3px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#FFE600', borderBottom: '3px solid #000', position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr style={{ color: '#000', fontSize: '1.2rem' }}>
                      <th style={{ padding: '1rem' }}>Name</th>
                      <th style={{ padding: '1rem' }}>Company</th>
                      <th style={{ padding: '1rem' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map(user => (
                      <motion.tr whileHover={{ backgroundColor: '#f0f0f0' }} key={user._id} style={{ borderBottom: '2px solid #000' }}>
                        <td style={{ padding: '1rem', fontWeight: 900 }}>{user.name}</td>
                        <td style={{ padding: '1rem', color: '#FF5D73', fontWeight: 'bold' }}>{user.company}</td>
                        <td style={{ padding: '1rem', color: '#444' }}>{new Date(user.createdAt).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'addPlace' && (
          <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ padding: '3rem' }}>
            <h3 className="title" style={{ marginBottom: '2rem', fontSize: '2rem' }}>
              {editingId ? 'Edit Synthesized Destination' : 'Synthesize Destination Flow'}
            </h3>
            <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 900, color: '#000' }}>Location Campaign Name</label>
                <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 900 }}>Budget Constraint</label>
                   <select className="input-field" value={form.budgetRange} onChange={e => setForm({...form, budgetRange: e.target.value})}>
                     <option>under 1000</option>
                     <option>under 2000</option>
                     <option>under 5000</option>
                     <option>over 5000</option>
                   </select>
                </div>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 900 }}>Time Allocation</label>
                   <select className="input-field" value={form.days} onChange={e => setForm({...form, days: e.target.value})}>
                     <option>1 day</option>
                     <option>2 day</option>
                     <option>3 day</option>
                     <option>4 days</option>
                     <option>1 week</option>
                   </select>
                </div>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 900 }}>Distance Constraint</label>
                   <select className="input-field" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})}>
                     <option>under 250km</option>
                     <option>under 500km</option>
                     <option>under 1000km</option>
                     <option>over 1000km</option>
                   </select>
                </div>
              </div>
              
              {/* AI GENERATOR SECTION */}
              <div style={{ padding: '2rem', border: '4px solid #000', background: '#FFE600', boxShadow: '6px 6px 0px #000', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                 <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>✨ AI AUTO-BUILDER</h4>
                 <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Paste raw text. Let Gemini hallucinate the routing layout for you.</p>
                 
                 <textarea 
                   rows={5} 
                   value={aiInput} 
                   onChange={e => setAiInput(e.target.value)}
                   placeholder={"Example: Trip to Yelagiri, arrival 6:00am, bus from Bangalore, food at XYZ, connect to Jolarpettai."}
                   style={{ border: '3px solid #000', padding: '10px', width: '100%', resize: 'vertical', fontWeight: 'bold' }}
                 />
                 
                 <button type="button" onClick={generateTripAI} disabled={isAiLoading} style={{ background: '#FF5D73', color: '#fff', border: '3px solid #000', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 900, cursor: 'pointer', boxShadow: '4px 4px 0px #000' }}>
                   {isAiLoading ? 'Synthesizing...' : 'GENERATE SKETCH'}
                 </button>
              </div>

              <div style={{ padding: '1rem', border: '4px solid #000', background: '#90E0EF', boxShadow: '4px 4px 0px #000' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 900, color: '#000', fontSize: '1.5rem' }}>Node Injector (Itinerary Sketch)</label>
                <p style={{ fontSize: '1rem', color: '#000', marginBottom: '1rem', fontWeight: 'bold' }}>Drop City Nodes. Connect them. Fill inside node details (Hotels, Food, Activity). Check transport mode onto the edges bridging the cities!</p>
                <FlowBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
              </div>

              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem', padding: '16px 32px' }}>
                {editingId ? 'Save Changes' : 'Publish Blueprint'}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'places' && (
          <motion.div key="3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ padding: '3rem' }}>
             <h3 className="title" style={{ marginBottom: '2rem', fontSize: '2rem' }}>Active Routes Directory</h3>
             <div style={{ display: 'grid', gap: '1.5rem' }}>
                {places.map((place, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={place._id} 
                    className="route-card-mobile"
                    style={{ padding: '1.5rem', background: '#fff', border: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '6px 6px 0px #000', gap: '1rem' }}
                  >
                    <div>
                      <h4 className="title" style={{ fontSize: '1.4rem' }}>{place.name}</h4>
                      <p style={{ fontSize: '1rem', color: '#000', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        <span style={{ background: '#FFE600', padding: '2px 5px', border: '2px solid #000' }}>{place.budgetRange}</span> &nbsp;
                        <span style={{ background: '#FF90E8', padding: '2px 5px', border: '2px solid #000' }}> {place.days} </span>
                      </p>
                    </div>
                    <div className="admin-btn-group" style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => editPlace(place)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Edit2 size={16} /> Edit
                      </button>
                      <button onClick={() => deletePlace(place._id)} style={{ background: '#FF5D73', color: '#fff', padding: '10px 20px', border: '4px solid #000', fontWeight: '900', cursor: 'pointer', boxShadow: '4px 4px 0px #000' }}>Delete</button>
                    </div>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
