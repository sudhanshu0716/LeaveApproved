import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Scissors, User, Plane, Compass, Settings
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [isCutting, setIsCutting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState({ name: '', company: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const savedUser = localStorage.getItem('travel_user');
    if (savedUser) {
      navigate('/dashboard');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleInitSubmit = async (e) => {
    e.preventDefault();
    if (!user.name || !user.company || isCutting) return;
    
    setIsCutting(true);
    try {
      // Generate a temporary ID (will be used only if new user)
      const tempUid = `VOY-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Request Identity Verification from Central Command
      const res = await axios.post('/api/visitors', { ...user, uid: tempUid });
      
      // Lock in the verified identity (Legacy or New)
      const verifiedUser = {
        name: res.data.name,
        company: res.data.company,
        uid: res.data.uid || tempUid
      };
      
      localStorage.setItem('travel_user', JSON.stringify(verifiedUser));

      setTimeout(() => {
        setIsCutting(false);
        navigate('/dashboard');
      }, 1800);
    } catch (err) {
      // Emergency Mode: Allow entry via local backup if server is unreachable
      localStorage.setItem('travel_user', JSON.stringify({ ...user, uid: 'VOY-LOCAL-TEMP' }));
      setTimeout(() => {
        setIsCutting(false);
        navigate('/dashboard');
      }, 1800);
    }
  };

  return (
    <div className="safari-portal-theme" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Immersive Video Background - EXACT FILTER MATCH */}
      <div className="video-bg" style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'black' }}>
        <video 
           key={isMobile ? 'mobile' : 'desktop'} 
           src={isMobile ? "/videos/koluk.mp4" : "/MUNNAR.mp4"} 
           autoPlay loop muted playsInline preload="auto"
           style={{ 
             width: '100%', 
             height: '100%', 
             objectFit: 'cover',
             filter: 'saturate(1.2) contrast(1.1) brightness(0.8)' 
           }}
        />
      </div>

      {/* Global Brand Header - Top Left Corner */}
      <div style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '15px' }}>
         <div style={{ background: 'rgba(216, 243, 220, 0.1)', padding: '10px', borderRadius: '14px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Compass size={28} color="#ffb703" style={{ filter: 'drop-shadow(0 0 10px rgba(255,183,3,0.4))' }} />
         </div>
         <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, letterSpacing: '3px', color: 'white', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            LEAVE<span style={{ color: '#d8f3dc' }}>APPROVED</span>
         </h1>
      </div>

      <div style={{ position: 'fixed', top: '24px', right: isMobile ? '60px' : '24px', zIndex: 1000 }}>
        <Link to="/admin" className="glass-btn" style={{ 
          padding: '10px 16px', 
          fontSize: '0.65rem', 
          textDecoration: 'none', 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
          color: 'white',
          fontWeight: 900,
          letterSpacing: '1px'
        }}>
           <Settings size={14} /> {isMobile ? '' : 'AUTHORITY'}
        </Link>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
        >
               <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  width: '1050px', 
                  minHeight: '360px', 
                  position: 'relative',
                  filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.6))',
                  transform: isMobile ? `scale(${(window.innerWidth - 100) / 1050})` : 'none',
                  transformOrigin: 'center',
                  flexShrink: 0
                }}>
                
                <AnimatePresence>
                  {isCutting && (
                    <motion.div 
                      key="scissors"
                      initial={{ y: -120, opacity: 0, left: '66.6%', x: '-50%' }}
                      animate={{ y: 500, opacity: 1, scale: [1, 1.25, 1], rotate: [90, 80, 100, 90] }}
                      transition={{ y: { duration: 2, ease: "linear" }, scale: { repeat: 10, duration: 0.2 }, rotate: { repeat: 10, duration: 0.15 } }}
                      style={{ position: 'absolute', zIndex: 1000, color: 'white' }}
                    >
                       <Scissors size={54} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className="glass-panel gold-shimmer-panel"
                  animate={isCutting ? { x: -10, filter: 'brightness(1.1)' } : {}}
                  style={{ 
                    flex: '2', 
                    padding: '40px', 
                    borderRight: '4px dashed rgba(255,255,255,0.1)', 
                    borderTopRightRadius: 0, 
                    borderBottomRightRadius: 0,
                    position: 'relative',
                    zIndex: 10,
                    background: 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <Plane size={20} color="rgba(216, 243, 220, 0.4)" />
                       <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '4px', color: 'rgba(255,255,255,0.6)' }}>TURBO AIRLINE</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, border: '1px solid #d8f3dc', padding: '4px 12px', borderRadius: '50px', color: '#d8f3dc' }}>PRIORITY SYNTHESIS</span>
                      <button 
                        type="button" 
                        onClick={() => { setUser({ name: '', company: '' }); localStorage.removeItem('travel_user'); }}
                        className="glass-btn" 
                        style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '50px', color: 'white', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', marginLeft: '10px' }}
                      >
                        <User size={12} /> SWITCH
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '48px', marginBottom: '32px', color: 'white' }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffffff' }}>FROM</div>
                       <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>CORP TOWER</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.3 }}>
                       <div style={{ width: '40px', height: '1px', background: 'white' }} />
                       <Plane size={16} />
                       <div style={{ width: '40px', height: '1px', background: 'white' }} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                       <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffffff' }}>TO</div>
                       <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>VIRTUAL EXPEDITION</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#ffffff' }}>FLIGHT</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>TR-2024</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#ffffff' }}>BOARDING</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ffb703' }}>NOW</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#ffffff' }}>CLASS</div>
                       <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>EXECUTIVE</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#ffffff' }}>GATE</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>B-12</div>
                    </div>
                  </div>

                  <form onSubmit={handleInitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-15px', fontSize: '10px', color: '#ffffff', fontWeight: 800 }}>PASSENGER IDENTIFIER</span>
                        <input className="modern-input" style={{ background: 'none', padding: 0, borderRadius: 0, border: 'none', fontSize: '1.2rem', color: '#ffffff', fontWeight: 800, width: '100%', outline: 'none' }} placeholder="Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} required />
                      </div>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-15px', fontSize: '10px', color: '#ffffff', fontWeight: 800 }}>ORIGIN POINT</span>
                        <input className="modern-input" style={{ background: 'none', padding: 0, borderRadius: 0, border: 'none', fontSize: '1.2rem', color: '#ffffff', fontWeight: 800, width: '100%', outline: 'none' }} placeholder="Company Name" value={user.company} onChange={e => setUser({...user, company: e.target.value})} required />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="glass-btn" 
                      style={{ 
                        marginTop: '20px', 
                        justifyContent: 'center', 
                        background: 'rgba(255, 255, 255, 0.12)', 
                        color: 'white', 
                        fontSize: '1.1rem', 
                        padding: '24px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                       {isCutting ? 'PROCESSING...' : 'INITIALIZE VOYAGE'} {isCutting ? null : <ArrowRight size={22} />}
                    </button>
                  </form>
                </motion.div>

                <motion.div 
                   className="glass-panel"
                   animate={isCutting ? { x: [0, 20, 100], y: [0, 40, 800], rotate: [0, 15, 60], scale: [1, 0.95, 0.8], opacity: [1, 1, 0], transition: { delay: 0.8, duration: 2, ease: "anticipate" } } : {}}
                  style={{ 
                    flex: '1', 
                    padding: '32px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderLeft: 'none', 
                    borderTopLeftRadius: 0, 
                    borderBottomLeftRadius: 0,
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 5 
                  }}
                >
                    <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                       <span style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, letterSpacing: '4px' }}>STUB // TURBO-24</span>
                       <div style={{ margin: '20px 0', border: '2px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>SEAT</span>
                          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>SA-07</span>
                       </div>
                       
                       <div style={{ width: '100%', display: 'flex', gap: '2px', height: '40px', opacity: 0.5, marginBottom: '24px' }}>
                          {[...Array(20)].map((_, i) => (
                             <div key={i} style={{ flex: Math.random() > 0.5 ? 2 : 1, background: 'white' }} />
                          ))}
                       </div>

                       <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>FLIGHT SYNC</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>VALIDATED</div>
                       </div>
                    </div>
                </motion.div>
                
                {isCutting && (
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: '100%' }}
                    transition={{ duration: 1.8, ease: "linear" }}
                    style={{ position: 'absolute', left: '66.6%', width: '2px', background: 'linear-gradient(to bottom, transparent, #d8f3dc, transparent)', filter: 'blur(4px)', zIndex: 100 }} 
                  />
                )}
              </div>
        </motion.div>
      </div>
    </div>
  );
}
