import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, MapPin, Compass, Calendar, Briefcase, 
  ChevronRight, Award, Heart, Settings, LogOut,
  Plane, PlaneTakeoff, Scan, Scissors, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ItineraryFlow from './ItineraryFlow';

gsap.registerPlugin(ScrollTrigger);

const getQuotes = (name, company) => {
  const n = name || 'You';
  const c = company || 'The Office';
  return [
    `"Manager is buried in reports, while ${n} from ${c} is buried in tea gardens at Munnar."`,
    `"Boss is stuck in traffic, ${n} is stuck choosing dosas in Chennai."`,
    `"Manager is chasing deadlines, ${n} from ${c} is chasing clouds in Ooty."`,
    `"Boss is reviewing budgets, ${n} is reviewing palace walls in Mysuru."`,
    `"Manager is stuck in presentations, ${n} from ${c} is stuck exploring ruins at Hampi."`,
    `"Boss is busy with meetings, ${n} is busy tasting seafood in Udupi."`,
    `"Manager is working overtime, ${n} from ${c} is working on treks in Wayanad."`,
    `"Boss is stuck in spreadsheets, ${n} is stuck watching sunsets at Kochi."`,
    `"Manager said: ‘We need focus.’ — ${n} said: ‘I’m focusing on the horizon at Kanyakumari.’"`,
    `"Boss is chasing KPIs, ${n} from ${c} is chasing rivers on the Netravathi trek."`,
    `"Manager is stuck in office calls, ${n} is stuck under Dudhsagar waterfalls."`,
    `"Boss is reviewing strategy, ${n} from ${c} is reviewing beaches at Gokarna."`,
    `"Manager is stuck in office chairs, ${n} is stuck on temple steps at Murdeshwar."`,
    `"Boss is counting hours, ${n} from ${c} is counting caves at Yana."`,
    `"Manager is chasing numbers, ${n} is chasing misty mornings in Kodaikanal."`,
    `"Boss is stuck in deadlines, ${n} from ${c} is stuck climbing Kolukkumalai."`,
    `"Manager is buried in tasks, ${n} is buried in silence at Adiyogi in Coimbatore."`,
    `"Boss is stuck in reviews, ${n} from ${c} is stuck enjoying paddy fields in Palakkad."`,
    `"Manager said: ‘We need more productivity.’ — ${n} said: ‘Travel is my productivity hack at Kochi backwaters.’"`,
    `"Boss is working late, ${n} from ${c} is watching stars over Kanyakumari’s ocean."`
  ];
};

export default function Landing() {
  const [step, setStep] = useState(0); 
  const [isCutting, setIsCutting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [user, setUser] = useState({ name: '', company: '' });
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const scrollContainerRef = useRef(null);
  const horizontalRef = useRef(null);

  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % 20);
    }, 4400);
    return () => clearInterval(qInterval);
  }, []);

  useEffect(() => {
    if (step === 1 && horizontalRef.current) {
      setTimeout(() => {
        const panels = gsap.utils.toArray('.horizontal-panel');
        let ctx = gsap.context(() => {
          gsap.to(panels, {
            xPercent: -100 * (panels.length - 1),
            ease: "none",
            scrollTrigger: {
              trigger: scrollContainerRef.current,
              pin: true,
              scrub: 1,
              snap: 1 / (panels.length - 1),
              start: "top top",
              end: () => "+=" + horizontalRef.current.offsetWidth
            }
          });
        }, horizontalRef);
        return () => ctx.revert();
      }, 500);
    }
  }, [step]);

  const levels = [
    { name: 'Novice Nomad', xp: 0, icon: '🌱' },
    { name: 'Occasional Backpacker', xp: 100, icon: '🎒' },
    { name: 'Seasoned Traveler', xp: 200, icon: '🌍' },
    { name: 'Global Voyager', xp: 300, icon: '🚢' },
    { name: 'Master Explorer', xp: 400, icon: '👑' }
  ];

  const currentLevelName = levels[Math.min(level - 1, levels.length - 1)].name;

  useEffect(() => {
    const savedUser = localStorage.getItem('travel_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setStep(1);
    }
  }, []);

  const activeQuote = getQuotes(user.name, user.company)[quoteIndex];

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (newXp >= 100) {
        setLevel(l => l + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        return newXp - 100;
      }
      return newXp;
    });
  };

  const handleInitSubmit = async (e) => {
    e.preventDefault();
    if (!user.name || !user.company || isCutting) return;
    
    setIsCutting(true);
    try { await axios.post('/api/visitors', user); } catch (err) {}
    localStorage.setItem('travel_user', JSON.stringify(user));

    setTimeout(() => {
      setStep(1);
      setIsCutting(false);
    }, 1800);
  };

  const handleSelection = async (type, value) => {
    addXp(35);
    try {
      const res = await axios.get(`/api/places?type=${type}&value=${value}`);
      setPlaces(res.data);
    } catch (err) { setPlaces([]); }
    setStep(2);
  };

  const logout = () => {
    localStorage.removeItem('travel_user');
    setUser({ name: '', company: '' });
    setStep(0);
  };

  return (
    <div className="safari-portal-theme" style={{ width: '100%', minHeight: '100vh', position: 'relative', overflowX: 'hidden', overflowY: step === 0 ? 'hidden' : 'auto' }}>
      
      {/* Immersive Video Background Only */}
      <div className="video-bg">
        <video 
           key={isMobile ? 'mobile' : 'desktop'} 
           src={isMobile ? "/videos/koluk.mp4" : "/MUNNAR.mp4"} 
           autoPlay 
           loop 
           muted 
           playsInline 
           preload="auto"
           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ position: 'fixed', top: '24px', right: isMobile ? '60px' : '24px', zIndex: 1000 }}>
        <Link to="/admin" className="glass-btn" style={{ 
          padding: '10px 16px', 
          fontSize: '0.65rem', 
          textDecoration: 'none', 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
        {step > 0 && step < 3 && (
          <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', width: '90%', textAlign: 'center', pointerEvents: 'none', zIndex: 100 }}>
            <div style={{ position: 'absolute', inset: '-100px 0', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)', pointerEvents: 'none', zIndex: -1 }} />
            <AnimatePresence mode="wait">
              <motion.h2
                key={quoteIndex}
                initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ 
                  fontFamily: '"Bodoni Moda", serif', 
                  fontStyle: 'italic', 
                  fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', 
                  color: 'white', 
                  maxWidth: '1200px', 
                  margin: '0 auto', 
                  lineHeight: '1.4', 
                  textShadow: '0 5px 20px rgba(0,0,0,0.8)',
                  opacity: 0.8
                }}
              >
                {activeQuote}
              </motion.h2>
            </AnimatePresence>
          </div>
        )}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0" 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
              transition={{ duration: 0.8 }}
              className="container"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
            >
               {/* Digital Boarding Pass - Precise Physical Dimensions */}
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
                
                {/* Scissors Mechanical Animation - Centered on Perforation */}
                <AnimatePresence>
                  {isCutting && (
                    <motion.div 
                      key="scissors"
                      initial={{ y: -120, opacity: 0, left: '66.6%', x: '-50%' }}
                      animate={{ 
                        y: 500, 
                        opacity: 1,
                        scale: [1, 1.25, 1],
                        rotate: [90, 80, 100, 90]
                      }}
                      transition={{ 
                        y: { duration: 2, ease: "linear" },
                        scale: { repeat: 10, duration: 0.2 },
                        rotate: { repeat: 10, duration: 0.15 }
                      }}
                      style={{ position: 'absolute', zIndex: 1000, color: 'white' }}
                    >
                       <Scissors size={54} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Main Pass Section (Left Half) */}
                <motion.div 
                  className="glass-panel"
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <Plane size={24} color="#d8f3dc" />
                       <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '4px', opacity: 0.8 }}>TURBO AIRLINE</span>
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
                       <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)' }}>FROM</div>
                       <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>CORP TOWER</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.3 }}>
                       <div style={{ width: '40px', height: '1px', background: 'white' }} />
                       <Plane size={16} />
                       <div style={{ width: '40px', height: '1px', background: 'white' }} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                       <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)' }}>TO</div>
                       <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>VIRTUAL EXPEDITION</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>FLIGHT</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>TR-2024</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>BOARDING</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-gold)' }}>NOW</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>CLASS</div>
                       <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>EXECUTIVE</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                       <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>GATE</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>B-12</div>
                    </div>
                  </div>

                  <form onSubmit={handleInitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-15px', fontSize: '10px', color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>PASSENGER IDENTIFIER</span>
                        <input className="modern-input" style={{ background: 'none', padding: 0, borderRadius: 0, border: 'none', fontSize: '1.2rem', color: 'white' }} placeholder="Your Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} required />
                      </div>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-15px', fontSize: '10px', color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>ORIGIN POINT</span>
                        <input className="modern-input" style={{ background: 'none', padding: 0, borderRadius: 0, border: 'none', fontSize: '1.2rem', color: 'white' }} placeholder="Tech Corp" value={user.company} onChange={e => setUser({...user, company: e.target.value})} required />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="glass-btn" 
                      style={{ 
                        marginTop: '20px', 
                        justifyContent: 'center', 
                        background: isCutting ? 'rgba(216, 243, 220, 0.2)' : 'rgba(255, 255, 255, 0.12)', 
                        backdropFilter: 'blur(10px)',
                        color: 'white', 
                        fontSize: '1.1rem', 
                        padding: '24px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.4s ease'
                      }}
                    >
                       {isCutting ? 'PROCESSING...' : 'INITIALIZE VOYAGE'} {isCutting ? <Scissors size={20} className="spin" /> : <ArrowRight size={22} />}
                    </button>
                  </form>
                </motion.div>

                {/* Physical Ticket Stub (Right Half) */}
                <motion.div 
                   className="glass-panel"
                   animate={isCutting ? { 
                    x: [0, 20, 100], 
                    y: [0, 40, 800], 
                    rotate: [0, 15, 60], 
                    scale: [1, 0.95, 0.8],
                    opacity: [1, 1, 0],
                    transition: { delay: 0.8, duration: 2, ease: "anticipate" }
                  } : {}}
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
                       
                       {/* Digital Barcode Simulation */}
                       <div style={{ width: '100%', display: 'flex', gap: '2px', height: '40px', opacity: 0.5, marginBottom: '24px' }}>
                          {[...Array(20)].map((_, i) => (
                             <div key={i} style={{ flex: Math.random() > 0.5 ? 2 : 1, background: 'white' }} />
                          ))}
                       </div>

                       <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>FLIGHT SYNC</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>VALIDATED</div>
                       </div>
                    </div>
                </motion.div>
                
                {/* Perforation Light Effect */}
                {isCutting && (
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: '100%' }}
                    transition={{ duration: 1.8, ease: "linear" }}
                    style={{ 
                      position: 'absolute', 
                      left: '66.6%', 
                      width: '2px', 
                      background: 'linear-gradient(to bottom, transparent, #d8f3dc, transparent)', 
                      filter: 'blur(4px)',
                      zIndex: 100
                    }} 
                  />
                )}
              </div>
        {step > 0 && step < 3 && (
          <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', width: '90%', textAlign: 'center', pointerEvents: 'none', zIndex: 100 }}>
            <div style={{ position: 'absolute', inset: '-100px 0', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)', pointerEvents: 'none', zIndex: -1 }} />
            <AnimatePresence mode="wait">
              <motion.h2
                key={quoteIndex}
                initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ 
                  fontFamily: '"Bodoni Moda", serif', 
                  fontStyle: 'italic', 
                  fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', 
                  color: 'white', 
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px'
                }}
              >
                {activeQuote}
              </motion.h2>
            </AnimatePresence>
          </div>
        )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '100vh', width: '100%' }}>
              
              {/* Animated Background Quotes - Consistent Atmospheric Glow */}
              <div style={{ position: 'fixed', top: '22%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '90%', zIndex: 5, pointerEvents: 'none' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 0.4, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    style={{ 
                      fontFamily: '"Bodoni Moda", serif', 
                      fontStyle: 'italic', 
                      fontSize: 'clamp(1rem, 4vw, 2.5rem)', 
                      color: 'white',
                      letterSpacing: '1px'
                    }}
                  >
                    {activeQuote.toUpperCase()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Persistent Header */}
              <div style={{ position: 'fixed', top: '24px', right: isMobile ? '70px' : '150px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '6px 6px 6px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.95)', border: '1px solid white' }}>
                  <span className="title" style={{ fontSize: '0.7rem', color: '#1b4332' }}>{isMobile ? '' : user.name}</span>
                  <button onClick={logout} className="glass-btn" style={{ background: '#1b4332', color: 'white', border: 'none', borderRadius: '50px', padding: '6px 14px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isMobile ? <User size={12} /> : 'SWITCH'}
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Interface */}
              <div ref={scrollContainerRef} className="horizontal-scroll-section" style={{ height: '300vh', position: 'relative' }}>
                <div ref={horizontalRef} className="horizontal-content" style={{ display: 'flex', width: '300%', height: '100vh', position: 'sticky', top: 0, alignItems: 'center', willChange: 'transform' }}>
                  {[
                    { title: 'BUDGET ALLOCATION', icon: <Briefcase size={32} />, options: ['under 50k', 'under 100k', 'under 200k', 'over 200k'], type: 'budget' },
                    { title: 'DISCOVERY DURATION', icon: <Calendar size={32} />, options: ['1-2 days', '3-5 days', '1 week', 'over 1 week'], type: 'days' },
                    { title: 'PROXIMITY RADIUS', icon: <MapPin size={32} />, options: ['within 250km', 'within 500km', 'within 1000km', 'Anywhere'], type: 'distance' }
                  ].map((cat, i) => (
                    <section key={i} className="horizontal-panel" style={{ width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 20px' }}>
                      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '60px 40px', textAlign: 'center', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.3))' }}>
                        <div style={{ background: 'var(--accent-mint)', width: '70px', height: '70px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', color: 'var(--primary-green)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                          {cat.icon}
                        </div>
                        <h3 className="title" style={{ fontSize: '1.8rem', marginBottom: '40px', letterSpacing: '-1px' }}>{cat.title}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          {cat.options.map(opt => (
                            <button key={opt} onClick={() => handleSelection(cat.type, opt)} className="premium-card" style={{ border: 'none', padding: '24px 20px', fontWeight: '900', borderRadius: '20px', transition: 'all 0.3s ease' }}>
                              {opt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <div style={{ marginTop: '40px', fontSize: '0.8rem', opacity: 0.4, fontWeight: 900 }}>
                           SCROLL TO EXPLORE PARAMETERS <ArrowRight size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-panel" style={{ padding: '8px 8px 8px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.95)', border: '1px solid white' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1px' }}>EXPLORER</span>
                     <span className="title" style={{ fontSize: '0.9rem' }}>{user.name}</span>
                  </div>
                  <button onClick={logout} style={{ background: '#9e2a2b', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '40px', color: 'white', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    SWITCH EXPLORER <User size={14} />
                  </button>
                </div>
                <button onClick={() => setStep(1)} className="glass-btn" style={{ background: 'white', color: 'var(--primary-green)', border: '1px solid #ddd', borderRadius: '50px' }}>
                   ADJUST PARAMETERS
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
                {places.length > 0 ? places.map((place) => (
                  <motion.div 
                    key={place._id} 
                    whileHover={{ scale: 1.02 }}
                    className="premium-card" 
                    onClick={() => { setSelectedPlace(place); setStep(3); }}
                  >
                    <div style={{ padding: '32px' }}>
                      <h3 className="title" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>{place.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '24px' }}>{place.description}</p>
                      <button className="glass-btn">VIEW PATH</button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', background: 'white' }}>
                    <Compass size={48} color="#9e2a2b" style={{ marginBottom: '20px' }} />
                    <h3 className="title">NO MATCHING PATHS FOUND</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Try adjusting your parameters for a more expansive synthesis.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && selectedPlace && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                <button onClick={() => setStep(2)} className="glass-btn" style={{ background: 'white', color: 'var(--primary-green)', border: '1px solid #ddd', borderRadius: '50px' }}>
                   BACK TO BLUEPRINTS
                </button>
                <div className="glass-panel" style={{ padding: '8px 8px 8px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.95)', border: '1px solid white' }}>
                  <span className="title" style={{ fontSize: '0.9rem' }}>{user.name}</span>
                  <button onClick={logout} style={{ background: '#9e2a2b', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '40px', color: 'white', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    SWITCH USER <User size={14} />
                  </button>
                </div>
              </div>
              <div className="glass-panel" style={{ background: 'white', padding: '10px', borderRadius: '32px' }}>
                <ItineraryFlow place={selectedPlace} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step > 0 && user.name && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="glass-panel"
          style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', zIndex: 2000, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.9)' }}
          onClick={() => setShowLevelInfo(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <Award size={28} color="var(--primary-green)" />
             <div>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-muted)' }}>{currentLevelName.toUpperCase()}</div>
                <div className="title" style={{ fontSize: '1.1rem' }}>RANK {level}</div>
             </div>
          </div>
          <div style={{ flex: 1, maxWidth: '400px', marginLeft: '24px' }}>
            <div style={{ background: 'rgba(0,0,0,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${xp}%` }} style={{ height: '100%', background: 'var(--primary-green)' }} />
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showLevelInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowLevelInfo(false)}
          >
            <motion.div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '90%', background: 'white' }} onClick={e => e.stopPropagation()}>
              <h3 className="title" style={{ marginBottom: '24px' }}>EXPLORER RANKS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {levels.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: level > i ? 1 : 0.4 }}>
                    <span style={{ fontSize: '1.4rem' }}>{l.icon}</span>
                    <span style={{ fontWeight: 800 }}>{l.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
