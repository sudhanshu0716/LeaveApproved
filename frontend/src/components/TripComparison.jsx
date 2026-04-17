import React, { useState } from 'react';
import axios from 'axios';
import { ArrowRight, Plane, Loader, MapPin, ChefHat, AlertTriangle, Bus, Landmark, UserCheck, ShoppingBag, CheckCircle, Moon, Mountain, Wallet, CloudSun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TripComparison() {
  const [origin, setOrigin] = useState('');
  const [dest1, setDest1] = useState('');
  const [dest2, setDest2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!origin || !dest1 || !dest2) return alert("Please fill all fields");

    setLoading(true);
    try {
      const prompt = `Compare a trip from ${origin} to ${dest1} versus a trip from ${origin} to ${dest2}.
Return ONLY a valid JSON object with no markdown formatting. The JSON must exactly match this structure:
{
  "dest1Name": "${dest1}",
  "dest2Name": "${dest2}",
  "metrics": [
    { "category": "Fast Travel Time", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Food & Dining", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Peaceful Environment", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Public Transit Quality", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Attractions & Sights", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Solo Travel Safety", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Shopping Options", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "High Affordability", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Nightlife Action", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Adventure Thrills", "dest1Score": <1-10>, "dest2Score": <1-10> },
    { "category": "Pleasant Weather", "dest1Score": <1-10>, "dest2Score": <1-10> }
  ],
  "resolution": "A short paragraph explaining which destination is better overall and why."
}`;

      const res = await axios.post('/api/ai/generate', { prompt });
      const rawText = res.data.candidates[0].content.parts[0].text;
      
      // Robust JSON extraction matching first { to last }
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      
      setResult(JSON.parse(jsonMatch[0]));

    } catch (err) {
      console.error(err);
      alert("Failed to generate AI comparison. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category) => {
    switch(category) {
      case "Fast Travel Time": return <MapPin size={16} />;
      case "Food & Dining": return <ChefHat size={16} />;
      case "Peaceful Environment": return <AlertTriangle size={16} />;
      case "Public Transit Quality": return <Bus size={16} />;
      case "Attractions & Sights": return <Landmark size={16} />;
      case "Solo Travel Safety": return <UserCheck size={16} />;
      case "Shopping Options": return <ShoppingBag size={16} />;
      case "High Affordability": return <Wallet size={16} />;
      case "Nightlife Action": return <Moon size={16} />;
      case "Adventure Thrills": return <Mountain size={16} />;
      case "Pleasant Weather": return <CloudSun size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  const getHint = (category) => {
    switch(category) {
      case "Fast Travel Time": return "Higher score means faster commute/closer";
      case "Food & Dining": return "Higher score means better regional cuisine";
      case "Peaceful Environment": return "Higher score means less crowded & chaotic";
      case "Public Transit Quality": return "Higher score means accessible buses/trains";
      case "Attractions & Sights": return "Higher score means more monuments to explore";
      case "Solo Travel Safety": return "Higher score means safer for single travelers";
      case "Shopping Options": return "Higher score means better local markets/malls";
      case "High Affordability": return "Higher score means cheaper overall budget";
      case "Nightlife Action": return "Higher score means vibrant late-night entertainment";
      case "Adventure Thrills": return "Higher score means more extreme activities";
      case "Pleasant Weather": return "Higher score means comfortable climate";
      default: return "Higher score is better";
    }
  };
  return (
    <div style={{ width: '100%', maxWidth: '900px', padding: '20px' }}>
      
      {!result && !loading && (
        <form onSubmit={handleCompare} className="glass-panel" style={{ padding: '40px', borderRadius: '30px', background: 'rgba(20, 35, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', marginBottom: '30px', textAlign: 'center', fontSize: '2rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive" }}>AI TRIP COMPARISON</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ color: '#ffb703', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>ORIGIN CITY</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} required placeholder="Where are you starting from?" style={{ boxSizing: 'border-box', width: '100%', padding: '15px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', marginTop: '10px', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <label style={{ color: '#d8f3dc', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>OPTION A</label>
                <input value={dest1} onChange={e => setDest1(e.target.value)} required placeholder="First Destination" style={{ boxSizing: 'border-box', width: '100%', padding: '15px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', marginTop: '10px', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb703', fontWeight: 900, fontSize: '0.7rem', marginTop: '25px', boxShadow: '0 0 15px rgba(255,183,3,0.1)' }}>VS</div>
              <div>
                <label style={{ color: '#d8f3dc', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>OPTION B</label>
                <input value={dest2} onChange={e => setDest2(e.target.value)} required placeholder="Second Destination" style={{ boxSizing: 'border-box', width: '100%', padding: '15px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', marginTop: '10px', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '20px', borderRadius: '15px', background: '#ffb703', border: 'none', marginTop: '40px', fontWeight: 900, color: '#081c15', cursor: 'pointer', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif" }}>
            <Plane size={20} /> ANALYZE NOW
          </button>
        </form>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#ffb703' }}>
          <Loader size={50} className="spin" style={{ margin: '0 auto 20px', display: 'block', animation: 'spin 2s linear infinite' }} />
          <h3 style={{ fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>Comparing your destinations...</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>This usually takes a few seconds.</p>
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '40px', borderRadius: '30px', background: 'rgba(20, 35, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setResult(null)} style={{ background: 'transparent', border: 'none', color: '#ffb703', cursor: 'pointer', marginBottom: '20px', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>← Compare Again</button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', textAlign: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#ffb703', margin: 0, fontFamily: "'Bebas Neue', cursive" }}>{result.dest1Name.toUpperCase()}</h3>
            <span style={{ opacity: 0.5, alignSelf: 'center', fontWeight: 900 }}>VS</span>
            <h3 style={{ fontSize: '1.8rem', color: '#d8f3dc', margin: 0, fontFamily: "'Bebas Neue', cursive" }}>{result.dest2Name.toUpperCase()}</h3>
          </div>

          {/* Metrics Graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
            {result.metrics.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                    {getIcon(m.category)} {m.category.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#ffb703', opacity: 0.7, marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    * {getHint(m.category)} *
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {/* Left Bar (Dest 1) - Fills right to left visually by using flex-direction row-reverse */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                     <span style={{ color: '#ffb703', fontWeight: 900, width: '35px', textAlign: 'right' }}>{m.dest1Score}/10</span>
                     <div style={{ position: 'relative', width: '80%', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                       <div style={{ position: 'absolute', width: '100%', height: '2px', top: '11px', background: 'transparent', borderBottom: '2px dotted rgba(255,183,3,0.3)' }} />
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${Number(m.dest1Score) * 10}%` }} 
                         transition={{ duration: 1.5, type: 'spring', bounce: 0.3, delay: i * 0.1 }}
                         style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'row-reverse' }}
                       >
                         <div style={{ position: 'absolute', right: 0, left: '15px', top: '10px', height: '4px', background: 'linear-gradient(-90deg, transparent, rgba(255,183,3,0.6))', borderRadius: '3px' }} />
                         <Plane size={18} color="#ffb703" style={{ position: 'absolute', left: '-5px', transform: 'rotate(-135deg)' }} strokeWidth={2} />
                       </motion.div>
                     </div>
                  </div>

                  <div style={{ width: '4px', height: '20px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px', margin: '0 5px' }} />

                  {/* Right Bar (Dest 2) */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ position: 'relative', width: '80%', height: '24px', display: 'flex', alignItems: 'center' }}>
                       <div style={{ position: 'absolute', width: '100%', height: '2px', top: '11px', background: 'transparent', borderBottom: '2px dotted rgba(216,243,220,0.3)' }} />
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${Number(m.dest2Score) * 10}%` }} 
                         transition={{ duration: 1.5, type: 'spring', bounce: 0.3, delay: i * 0.1 }}
                         style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                       >
                         <div style={{ position: 'absolute', left: 0, right: '15px', top: '10px', height: '4px', background: 'linear-gradient(90deg, transparent, rgba(216,243,220,0.6))', borderRadius: '3px' }} />
                         <Plane size={18} color="#d8f3dc" style={{ position: 'absolute', right: '-5px', transform: 'rotate(45deg)' }} strokeWidth={2} />
                       </motion.div>
                     </div>
                     <span style={{ color: '#d8f3dc', fontWeight: 900, width: '35px' }}>{m.dest2Score}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,183,3,0.1)', padding: '25px', borderRadius: '20px', borderLeft: '4px solid #ffb703' }}>
            <h4 style={{ color: '#ffb703', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif" }}><CheckCircle size={20}/> OUR RECOMMENDATION</h4>
            <p style={{ color: 'white', lineHeight: '1.6', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result.resolution}</p>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
