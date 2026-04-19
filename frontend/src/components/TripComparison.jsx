import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { ArrowRight, Plane, Loader, MapPin, ChefHat, AlertTriangle, Bus, Landmark, UserCheck, ShoppingBag, CheckCircle, Moon, Mountain, Wallet, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const show = (msg, type = 'success') => {
    clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

export default function TripComparison() {
  const [origin, setOrigin] = useState('');
  const [dest1, setDest1] = useState('');
  const [dest2, setDest2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { toast, show: showToast } = useToast();

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!origin || !dest1 || !dest2) { showToast('Please fill all fields', 'error'); return; }

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
      showToast('Failed to generate AI comparison. Try again.', 'error');
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
  const inputStyle = {
    boxSizing: 'border-box', width: '100%', padding: '14px 16px',
    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.4)', color: 'white', marginTop: '10px',
    outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
    transition: 'all 0.25s ease',
  };

  const ToastUI = () => toast ? createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ position: 'fixed', bottom: '32px',
          left: '16px', right: '16px', margin: '0 auto',
          width: 'fit-content', maxWidth: 'calc(100vw - 32px)',
          zIndex: 99999, padding: '14px 24px', borderRadius: '16px',
          fontWeight: 800, fontSize: '0.9rem',
          background: toast.type === 'error' ? '#e63946' : '#1b4332',
          color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          textAlign: 'center' }}>
        {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div style={{ width: '100%', maxWidth: '860px', padding: isMobile ? '0 12px 80px' : '0 20px 20px', minHeight: isMobile ? 'calc(100svh - 160px)' : 'auto' }}>
      <ToastUI />

      {/* HUD Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{ width: '28px', height: '2px', background: 'linear-gradient(90deg, transparent, #ffb703)' }} />
        <span style={{ color: '#ffb703', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif" }}>AI COMPARISON</span>
        <div style={{ width: '28px', height: '2px', background: 'linear-gradient(-90deg, transparent, #ffb703)' }} />
      </div>

      {!result && !loading && (
        <motion.form onSubmit={handleCompare} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: isMobile ? '20px 16px' : '36px', borderRadius: '24px', background: 'rgba(14,26,21,0.85)',
            backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#ffb703', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              YOUR STARTING POINT
            </label>
            <input value={origin} onChange={e => setOrigin(e.target.value)} required
              placeholder="Origin city (e.g. Bangalore)"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,183,3,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,183,3,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Destination inputs — stack on mobile */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'stretch' : 'end', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#ffb703', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>DESTINATION 1</label>
              <input value={dest1} onChange={e => setDest1(e.target.value)} required
                placeholder="e.g. Goa"
                style={{ ...inputStyle, borderColor: 'rgba(255,183,3,0.2)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,183,3,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,183,3,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,183,3,0.2)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={{ width: isMobile ? '100%' : '40px', height: isMobile ? '28px' : '40px', borderRadius: isMobile ? '8px' : '50%',
              background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffb703', fontWeight: 900, fontSize: '0.65rem', flexShrink: 0,
              fontFamily: "'DM Sans', sans-serif", alignSelf: isMobile ? 'auto' : 'flex-end', marginBottom: isMobile ? 0 : '10px' }}>VS</div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#4cc9f0', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>DESTINATION 2</label>
              <input value={dest2} onChange={e => setDest2(e.target.value)} required
                placeholder="e.g. Manali"
                style={{ ...inputStyle, borderColor: 'rgba(76,201,240,0.2)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(76,201,240,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,201,240,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(76,201,240,0.2)'; e.target.style.boxShadow = 'none'; }} />
            </div>
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%', padding: isMobile ? '14px' : '17px', fontSize: '0.9rem', borderRadius: '14px' }}>
            <Plane size={16} /> ANALYZE WITH AI
          </button>
        </motion.form>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ width: '60px', height: '60px', margin: '0 auto 24px', border: '3px solid rgba(255,183,3,0.15)', borderTopColor: '#ffb703', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif", color: 'white', marginBottom: '8px' }}>Analysing destinations...</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>AI is scoring {dest1} vs {dest2} across 11 categories.</p>
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '36px', borderRadius: '28px', background: 'rgba(14,26,21,0.85)',
            backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <button onClick={() => setResult(null)}
            className="btn-ghost" style={{ marginBottom: '28px', padding: '9px 18px', fontSize: '0.7rem' }}>
            ← Compare Again
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', textAlign: 'center', marginBottom: '36px', alignItems: 'center' }}>
            <div style={{ padding: '16px', background: 'rgba(255,183,3,0.06)', borderRadius: '16px', border: '1px solid rgba(255,183,3,0.15)' }}>
              <h3 style={{ fontSize: '1.6rem', color: '#ffb703', margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>{result.dest1Name.toUpperCase()}</h3>
              <span style={{ fontSize: '0.55rem', color: 'rgba(255,183,3,0.5)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>DESTINATION 1</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 900, fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>VS</span>
            <div style={{ padding: '16px', background: 'rgba(76,201,240,0.06)', borderRadius: '16px', border: '1px solid rgba(76,201,240,0.15)' }}>
              <h3 style={{ fontSize: '1.6rem', color: '#4cc9f0', margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>{result.dest2Name.toUpperCase()}</h3>
              <span style={{ fontSize: '0.55rem', color: 'rgba(76,201,240,0.5)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>DESTINATION 2</span>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
            {result.metrics.map((m, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginBottom: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1.5px', fontFamily: "'DM Sans', sans-serif" }}>
                  {getIcon(m.category)} {m.category.toUpperCase()}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ffb703', fontWeight: 800, fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", width: '28px', textAlign: 'right', flexShrink: 0 }}>{m.dest1Score}</span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Number(m.dest1Score) * 10}%` }}
                        transition={{ duration: 1, type: 'spring', bounce: 0.2, delay: i * 0.05 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, rgba(255,183,3,0.4), #ffb703)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ width: '2px', height: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '1px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Number(m.dest2Score) * 10}%` }}
                        transition={{ duration: 1, type: 'spring', bounce: 0.2, delay: i * 0.05 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, rgba(76,201,240,0.4), #4cc9f0)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ color: '#4cc9f0', fontWeight: 800, fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", width: '28px', flexShrink: 0 }}>{m.dest2Score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,183,3,0.06)', padding: '24px', borderRadius: '20px', borderLeft: '3px solid #ffb703', border: '1px solid rgba(255,183,3,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle size={18} color="#ffb703" />
              <span style={{ color: '#ffb703', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>AI RECOMMENDATION</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>{result.resolution}</p>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
