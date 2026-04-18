import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Compass, Briefcase, ChevronRight,
  Settings as SettingsIcon, LogOut, User,
  Globe, Zap, Target, CheckCircle, PlaneTakeoff, Heart,
  Users, ArrowRightLeft, Info, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserAuthHeader } from '../utils/auth';
import ItineraryFlow from './ItineraryFlow';
import TravelBuddy from './TravelBuddy';
import TripComparison from './TripComparison';
import About from './About';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('itineraries');
  const [places, setPlaces]       = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [step, setStep]           = useState(1);
  const [currentCard, setCurrentCard] = useState(0);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [user, setUser]           = useState({ name: '', company: '' });
  const [xp, setXp]               = useState(45);
  const [showProfile, setShowProfile]   = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: 'itineraries', label: 'ITINERARIES', icon: <Compass size={16} /> },
    { id: 'buddy',       label: 'BUDDY',       icon: <Users size={16} /> },
    { id: 'comparison',  label: 'COMPARE',     icon: <ArrowRightLeft size={16} /> },
    { id: 'contribute',  label: 'CONTRIBUTE',  icon: <FileText size={16} /> },
    { id: 'about',       label: 'ABOUT',       icon: <Info size={16} /> },
  ];

  const levels = [
    { name: 'Starter' }, { name: 'Explorer' }, { name: 'Adventurer' },
    { name: 'Globetrotter' }, { name: 'Legend' },
  ];
  const currentLevelIndex = Math.floor(xp / 100);
  const currentLevel      = currentLevelIndex + 1;
  const progressXp        = xp % 100;
  const levelData         = levels[Math.min(currentLevelIndex, levels.length - 1)];

  const cards = [
    {
      title: 'Budget\nAllocation', code: 'BGT-04', type: 'budget',
      desc: 'Plan your dream trip with the right budget.',
      sub:  'From budget escapes to luxury getaways',
      options: ['under 1000 rupees', 'under 2000 rupees', 'under 5000 rupees', 'over 5000 rupees'],
      img: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=900&q=85',
    },
    {
      title: 'Trip\nDuration', code: 'DUR-01', type: 'days',
      desc: 'Choose the perfect window for your adventure.',
      sub:  'Day trips to extended expeditions',
      options: ['1 day', '2 day', '3 day', '3+ days'],
      img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=85',
    },
    {
      title: 'Travel\nDistance', code: 'RDU-09', type: 'distance',
      desc: 'Discover destinations near or far from you.',
      sub:  'Local escapes to distant horizons',
      options: ['under 100km', 'under 250km', 'under 500km', 'over 500km'],
      img: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=900&q=85',
    },
  ];

  /* ── hooks ── */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('travel_user');
    if (!saved) { navigate('/'); return; }
    const p = JSON.parse(saved);
    setUser(p);
    if (p.xp !== undefined) setXp(p.xp);
  }, [navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCurrentCard(0);
  }, [step]);

  /* ── handlers ── */
  const handleXpGain = (n) => setXp(p => p + n);

  const handleSelection = async (type, value) => {
    handleXpGain(15);
    try {
      const clean = value.replace(' rupees', '').replace('km', '');
      const res = await axios.get(`/api/places?type=${type}&value=${clean}`);
      setPlaces(res.data);
    } catch { setPlaces([]); }
    setStep(2);
  };

  const logout = () => { localStorage.removeItem('travel_user'); navigate('/'); };

  const handleEmailUpdate = async () => {
    if (!user.email || isUpdatingEmail) return;
    setIsUpdatingEmail(true);
    try {
      const res = await axios.put(`/api/visitors/${user.uid}`, { email: user.email }, { headers: getUserAuthHeader() });
      const u2 = { ...user, email: res.data.email };
      setUser(u2);
      localStorage.setItem('travel_user', JSON.stringify(u2));
    } catch { console.error('Error saving email'); }
    finally { setIsUpdatingEmail(false); }
  };

  /* ────────────────────────────────────────────────
     MOBILE STEP-1  — full-screen image card
  ──────────────────────────────────────────────── */
  const MobileStep1 = () => {
    const cat = cards[currentCard];
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 20, background: '#050e09' }}>

        {/* Background image — crossfade */}
        <AnimatePresence mode="wait">
          <motion.div key={currentCard}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0,
              backgroundImage: `url(${cat.img})`,
              backgroundSize: 'cover', backgroundPosition: 'center top' }} />
        </AnimatePresence>

        {/* Gradient — top transparent, punchy dark from 40% down */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.12) 28%, rgba(5,14,9,0.72) 50%, rgba(5,14,9,0.94) 66%, rgba(5,14,9,1) 80%)' }} />

        {/* ── TOP BAR ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
          padding: 'max(48px, env(safe-area-inset-top)) 20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 30, height: 30, borderRadius: '9px',
              background: 'rgba(255,183,3,0.18)', border: '1.5px solid rgba(255,183,3,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlaneTakeoff size={15} color="#ffb703" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white',
              letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
              LEAVE APPROVED.
            </span>
          </div>
          <button onClick={logout}
            style={{ padding: '7px 16px', borderRadius: '50px',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)',
              fontSize: '0.58rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px',
              fontFamily: "'DM Sans', sans-serif" }}>
            EXIT
          </button>
        </div>

        {/* ── CARD NAV ARROWS (subtle, mid-screen) ── */}
        {currentCard > 0 && (
          <button onClick={() => setCurrentCard(c => c - 1)}
            style={{ position: 'absolute', left: '8px', top: '38%',
              zIndex: 30, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {currentCard < cards.length - 1 && (
          <button onClick={() => setCurrentCard(c => c + 1)}
            style={{ position: 'absolute', right: '8px', top: '38%',
              zIndex: 30, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* ── BOTTOM CONTENT AREA ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25,
          padding: '0 22px calc(80px + max(24px, env(safe-area-inset-bottom)))' }}>

          {/* Animated title block */}
          <AnimatePresence mode="wait">
            <motion.div key={`title-${currentCard}`}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32 }}>

              {/* Code badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginBottom: '10px', padding: '4px 10px', borderRadius: '50px',
                background: 'rgba(255,183,3,0.15)', border: '1px solid rgba(255,183,3,0.4)' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb703',
                  letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>{cat.code}</span>
              </div>

              {/* Big display title */}
              <h2 style={{ fontSize: '3.8rem', fontWeight: 400, color: 'white',
                margin: '0 0 8px', lineHeight: 0.95, whiteSpace: 'pre-line',
                fontFamily: "'Bebas Neue', cursive",
                letterSpacing: '2px',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>
                {cat.title}
              </h2>

              {/* Description */}
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)',
                fontWeight: 400, lineHeight: 1.45, margin: '0 0 6px',
                fontFamily: "'DM Sans', sans-serif" }}>{cat.desc}</p>

              {/* Sub label */}
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,183,3,0.7)',
                fontWeight: 600, margin: '0 0 16px', letterSpacing: '0.5px',
                fontFamily: "'DM Sans', sans-serif" }}>{cat.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Option buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
            {cat.options.map(opt => (
              <button key={opt} onClick={() => handleSelection(cat.type, opt)}
                style={{ padding: '14px 18px', borderRadius: '14px', width: '100%',
                  background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'white', fontWeight: 700, fontSize: '0.82rem',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  letterSpacing: '0.8px', fontFamily: "'DM Sans', sans-serif" }}
                onTouchStart={e => { e.currentTarget.style.background = 'rgba(255,183,3,0.22)'; e.currentTarget.style.borderColor = '#ffb703'; }}
                onTouchEnd={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}>
                {opt.toUpperCase()}
                <ChevronRight size={15} color="rgba(255,255,255,0.45)" />
              </button>
            ))}
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingBottom: '6px' }}>
            {cards.map((_, i) => (
              <div key={i} onClick={() => setCurrentCard(i)}
                style={{ width: i === currentCard ? '24px' : '6px', height: '6px',
                  borderRadius: '3px', transition: 'all 0.3s ease', cursor: 'pointer',
                  background: i === currentCard ? '#ffb703' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────── */
  return (
    <div className="safari-theme" style={{ width: '100%', minHeight: '100vh', background: '#081c15', position: 'relative', overflowX: 'hidden' }}>

      {/* BG VIDEO (desktop) */}
      {!isMobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <video src="/MUNNAR.mp4" autoPlay loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(0.3) brightness(0.6)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, rgba(8,28,21,0.9))' }} />
          <div className="hud-grid" style={{ position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(216,243,220,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(216,243,220,0.05) 1px,transparent 1px)',
            backgroundSize: '60px 60px', pointerEvents: 'none', opacity: 0.4 }} />
        </div>
      )}

      {/* ── DESKTOP NAV ── */}
      {!isMobile && (
        <div style={{ position: 'fixed', top: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>
          <div style={{ padding: '5px', borderRadius: '50px', display: 'flex', gap: '2px',
            background: 'rgba(8,28,21,0.85)', backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,183,3,0.06) inset' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '9px 18px', borderRadius: '40px', border: 'none',
                  background: activeTab === tab.id
                    ? 'rgba(255,183,3,0.15)'
                    : 'transparent',
                  color: activeTab === tab.id ? '#ffb703' : 'rgba(255,255,255,0.45)',
                  fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'all 0.25s ease',
                  boxShadow: activeTab === tab.id ? '0 0 0 1px rgba(255,183,3,0.25) inset' : 'none',
                  letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
          background: 'rgba(4,12,8,0.97)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '8px 4px max(16px,env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'itineraries') setStep(1); }}
                style={{ background: isActive ? 'rgba(255,183,3,0.1)' : 'none',
                  border: isActive ? '1px solid rgba(255,183,3,0.2)' : '1px solid transparent',
                  borderRadius: '14px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '7px 12px', minWidth: '48px',
                  color: isActive ? '#ffb703' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.2s ease', fontFamily: "'DM Sans', sans-serif" }}>
                {tab.icon}
                <span style={{ fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.5px' }}>{tab.label}</span>
              </button>
            );
          })}
          {/* Profile / XP button */}
          <button onClick={() => setShowProfile(true)}
            style={{ background: 'none', border: '1px solid transparent', borderRadius: '14px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '7px 12px', minWidth: '48px', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ position: 'relative', width: '22px', height: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 46 46" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="23" cy="23" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle cx="23" cy="23" r="20" fill="none" stroke="#ffb703" strokeWidth="4"
                  strokeDasharray="125" strokeDashoffset={125 - (125 * progressXp) / 100}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <span style={{ color: '#ffb703', fontWeight: 900, fontSize: '0.55rem', zIndex: 2 }}>{currentLevel}</span>
            </div>
            <span style={{ fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.35)' }}>PROFILE</span>
          </button>
        </div>
      )}

      {/* ── DESKTOP HEADER ── */}
      {!isMobile && activeTab === 'itineraries' && step === 1 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 1100,
          padding: '30px 60px 30px 40px',
          background: 'linear-gradient(to bottom, rgba(8,28,21,0.9), transparent)',
          boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
            <div style={{ background: '#1b4332', padding: '10px', borderRadius: '14px' }}>
              <PlaneTakeoff size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.2rem', color: 'white', letterSpacing: '-1.5px', fontWeight: 850 }}>LEAVE APPROVED.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.6, letterSpacing: '4px' }}>DASHBOARD</span>
              <div className="title" style={{ fontSize: '1.4rem', color: 'white', letterSpacing: '1px' }}>MY PLANNER</div>
              <div style={{ color: '#ffb703', fontSize: '0.65rem', fontWeight: 900, marginTop: '4px', letterSpacing: '1px', opacity: 0.8 }}>
                PLAN YOUR PERFECT TRIP
              </div>
            </div>
            <div style={{ padding: '8px 8px 8px 18px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.5 }}>LOGGED IN</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>
                  {user.name?.split(' ')[0].toUpperCase() || 'VOID'}
                </div>
              </div>
              <button onClick={logout}
                style={{ padding: '12px 24px', borderRadius: '50px', background: 'rgba(255,255,255,0.1)',
                  border: 'none', color: 'white', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px' }}>
                EXIT <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE STEP 1 — full-screen image ── */}
      {isMobile && activeTab === 'itineraries' && step === 1 && <MobileStep1 />}

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 10, paddingBottom: isMobile ? '80px' : '0' }}>
        {activeTab === 'itineraries' ? (
          <AnimatePresence mode="wait">

            {/* DESKTOP STEP 1 */}
            {step === 1 && !isMobile && (
              <motion.div key="step1-desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', padding: '160px 0 100px' }}>
                {currentCard > 0 && (
                  <button onClick={() => setCurrentCard(c => c - 1)}
                    style={{ position: 'fixed', left: '32px', top: '50%', transform: 'translateY(-50%)',
                      zIndex: 500, background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.35)', padding: '12px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                {currentCard < cards.length - 1 && (
                  <button onClick={() => setCurrentCard(c => c + 1)}
                    style={{ position: 'fixed', right: '32px', top: '50%', transform: 'translateY(-50%)',
                      zIndex: 500, background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.35)', padding: '12px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
                <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '8px', zIndex: 500 }}>
                  {cards.map((_, i) => (
                    <div key={i} onClick={() => setCurrentCard(i)}
                      style={{ width: i === currentCard ? '24px' : '8px', height: '8px',
                        borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s',
                        background: i === currentCard ? '#ffb703' : 'rgba(255,255,255,0.25)' }} />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={currentCard}
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}
                    style={{ width: '80vw', maxWidth: '720px' }}>
                    {(() => {
                      const cat = cards[currentCard];
                      return (
                        <div className="luggage-tag" style={{ display: 'flex',
                          background: 'rgba(15,30,25,0.85)', backdropFilter: 'blur(50px)',
                          border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '24px',
                          position: 'relative', overflow: 'hidden',
                          boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
                          clipPath: 'polygon(50px 0%,100% 0%,100% 100%,0% 100%,0% 50px)' }}>
                          <div style={{ position: 'absolute', inset: '10px', pointerEvents: 'none',
                            border: '1px dashed rgba(216,243,220,0.1)', borderRadius: '18px' }} />
                          <div style={{ width: '100px', borderRight: '2px dashed rgba(255,255,255,0.15)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'flex-start', padding: '50px 15px',
                            background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ transform: 'rotate(-90deg) translateY(-40px)',
                              whiteSpace: 'nowrap', color: '#ffb703', fontWeight: 900,
                              fontSize: '0.75rem', letterSpacing: '5px', opacity: 0.9 }}>{cat.code}</div>
                            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.4rem', color: '#d8f3dc', opacity: 0.3, fontWeight: 900 }}>FLIGHT // LF-9932</div>
                              <div style={{ fontSize: '0.4rem', color: '#ffb703', fontWeight: 900 }}>CLASS // ELITE</div>
                            </div>
                          </div>
                          <div style={{ flex: 1, padding: '40px 50px' }}>
                            <div style={{ marginBottom: '25px' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703',
                                letterSpacing: '4px', marginBottom: '8px', opacity: 0.8 }}>
                                STEP 0{currentCard + 1}
                              </div>
                              <h3 className="title" style={{ fontSize: '2.5rem', color: 'white',
                                margin: 0, lineHeight: 1, whiteSpace: 'pre-line' }}>{cat.title}</h3>
                              <p style={{ color: 'rgba(216,243,220,0.6)', fontSize: '0.85rem',
                                fontWeight: 600, marginTop: '12px', maxWidth: '450px' }}>{cat.desc}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                              {cat.options.map(opt => (
                                <button key={opt} onClick={() => handleSelection(cat.type, opt)}
                                  className="premium-choice"
                                  style={{ padding: '18px 20px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                    transition: 'all 0.25s ease', textAlign: 'left',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px' }}>
                                  {opt.toUpperCase()} <ChevronRight size={15} style={{ opacity: 0.35, flexShrink: 0 }} />
                                </button>
                              ))}
                            </div>
                            <div style={{ marginTop: '30px', paddingTop: '25px',
                              borderTop: '2px solid rgba(255,255,255,0.05)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.5rem', color: '#d8f3dc', opacity: 0.2, fontWeight: 900, letterSpacing: '1px' }}>FOR PERSONAL USE ONLY</div>
                                <div style={{ fontSize: '0.5rem', color: '#d8f3dc', opacity: 0.2, fontWeight: 900, letterSpacing: '1px' }}>POWERED BY LEAVE APPROVED</div>
                              </div>
                              <div style={{ height: '30px', width: '130px', opacity: 0.3,
                                background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.15),rgba(255,255,255,0.15) 2px,transparent 2px,transparent 6px)' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 2 — Places */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                style={{ minHeight: '100vh', padding: isMobile ? '90px 16px 100px' : '200px 40px',
                  width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', marginBottom: isMobile ? '24px' : '48px', gap: '16px' }}>
                  <div>
                    <h2 className="title" style={{ fontSize: isMobile ? '2.2rem' : '3rem', color: 'white', marginBottom: '6px', fontFamily: "'Bebas Neue', cursive" }}>
                      PLACES FOR YOU
                    </h2>
                    <p style={{ color: '#d8f3dc', opacity: 0.5, fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
                      {places.length} DESTINATION{places.length !== 1 ? 'S' : ''} FOUND
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="glass-btn"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white', fontSize: isMobile ? '0.65rem' : '0.72rem',
                      padding: isMobile ? '10px 18px' : '12px 22px',
                      borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '1px',
                      alignSelf: isMobile ? 'flex-start' : undefined }}>
                    ← BACK
                  </button>
                </div>

                {places.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: isMobile ? '3rem' : '4.5rem', fontFamily: "'Bebas Neue', cursive", marginBottom: '16px', letterSpacing: '3px', color: 'rgba(255,255,255,0.15)' }}>NO TRIPS FOUND</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>No destinations match those filters.<br/>Try a different budget or distance range.</p>
                    <button onClick={() => setStep(1)} className="btn-gold" style={{ margin: '24px auto 0', width: 'fit-content', padding: '14px 28px', fontSize: '0.8rem' }}>
                      ← BACK
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: isMobile ? '16px' : '28px' }}>
                    {places.map((place, idx) => {
                      const gradients = [
                        'linear-gradient(135deg, #1b4332 0%, #40916c 100%)',
                        'linear-gradient(135deg, #0f3460 0%, #16697a 100%)',
                        'linear-gradient(135deg, #3a1c71 0%, #d76d77 100%)',
                        'linear-gradient(135deg, #2d3561 0%, #4cc9f0 100%)',
                        'linear-gradient(135deg, #4a1942 0%, #c05c7e 100%)',
                        'linear-gradient(135deg, #1a1a2e 0%, #e94560 100%)',
                      ];
                      const grad = gradients[idx % gradients.length];
                      return (
                        <motion.div key={place._id}
                          whileHover={{ y: isMobile ? 0 : -6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedPlace(place); setStep(3); }}
                          style={{
                            borderRadius: isMobile ? '20px' : '24px',
                            overflow: 'hidden', cursor: 'pointer',
                            background: '#101c16',
                            border: '1px solid rgba(255,255,255,0.09)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                          }}>
                          {/* Card top — colorful gradient with destination name */}
                          <div style={{
                            background: grad,
                            padding: isMobile ? '24px 22px 20px' : '30px 28px 24px',
                            position: 'relative', overflow: 'hidden',
                            minHeight: isMobile ? '110px' : '130px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          }}>
                            {/* Decorative circles */}
                            <div style={{ position: 'absolute', right: '-24px', top: '-24px', width: '130px', height: '130px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', right: '40px', bottom: '-40px', width: '90px', height: '90px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', pointerEvents: 'none' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                              <span style={{
                                fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)',
                                letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif",
                                background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '50px',
                              }}>
                                SPOT #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.22)', padding: '4px 10px', borderRadius: '50px' }}>
                                <Heart size={11} fill={place.likedBy?.length > 0 ? '#ff5d73' : 'none'} color="#ff5d73" />
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'white', fontFamily: "'DM Sans', sans-serif" }}>
                                  {place.likedBy?.length || 0}
                                </span>
                              </div>
                            </div>

                            <h3 style={{
                              fontSize: isMobile ? '2rem' : '2.4rem',
                              color: 'white', margin: '12px 0 0',
                              fontFamily: "'Bebas Neue', cursive",
                              letterSpacing: '2px', lineHeight: 1,
                              textShadow: '0 2px 16px rgba(0,0,0,0.35)',
                              position: 'relative', zIndex: 2,
                            }}>
                              {place.name}
                            </h3>
                          </div>

                          {/* Card bottom — description + CTA */}
                          <div style={{ padding: isMobile ? '16px 20px 18px' : '20px 26px 22px' }}>
                            <p style={{
                              color: 'rgba(216,243,220,0.5)', lineHeight: 1.65,
                              fontSize: isMobile ? '0.77rem' : '0.83rem',
                              fontFamily: "'DM Sans', sans-serif",
                              margin: '0 0 16px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {place.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.8)', animation: 'breathe 2s ease-in-out infinite' }} />
                                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '1px' }}>
                                  ITINERARY READY
                                </span>
                              </div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                color: '#ffb703', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px',
                                fontFamily: "'DM Sans', sans-serif",
                                padding: '6px 12px', borderRadius: '50px',
                                background: 'rgba(255,183,3,0.1)',
                                border: '1px solid rgba(255,183,3,0.2)',
                                transition: 'all 0.2s ease',
                              }}>
                                VIEW PLAN <ArrowRight size={12} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 — Itinerary */}
            {step === 3 && selectedPlace && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ minHeight: '100vh', padding: isMobile ? '72px 0 80px' : '150px 40px',
                  width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: isMobile ? '16px' : '32px',
                  padding: isMobile ? '0 14px' : '0' }}>
                  <button onClick={() => setStep(2)}
                    style={{ padding: isMobile ? '9px 16px' : '11px 24px', borderRadius: '50px',
                      color: 'white', background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                      fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px',
                      display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← BACK
                  </button>
                  <div style={{ fontSize: isMobile ? '0.68rem' : '0.85rem', fontWeight: 700,
                    color: '#ffb703', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                    {selectedPlace.name.toUpperCase()}
                  </div>
                </div>
                <div style={{ background: 'white',
                  borderRadius: isMobile ? '20px' : '40px',
                  overflow: 'hidden',
                  margin: isMobile ? '0 10px' : '0',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                  <ItineraryFlow place={selectedPlace} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        ) : (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', paddingTop: isMobile ? '20px' : '120px',
            paddingBottom: isMobile ? '90px' : '100px' }}>
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
                {activeTab === 'buddy'        ? <TravelBuddy user={user} onXpGain={handleXpGain} />
                  : activeTab === 'contribute'  ? <TravelBuddy user={user} onXpGain={handleXpGain} initialView="contribute" />
                  : activeTab === 'comparison'  ? <TripComparison />
                  : activeTab === 'about'        ? <About />
                  : null}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* XP WIDGET — desktop only */}
      {!isMobile && step !== 3 && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowProfile(true)}
          style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, cursor: 'pointer' }}>
          <div className="glass-panel xp-hover-pill"
            style={{ padding: '8px', borderRadius: '50px', background: 'rgba(8,28,21,0.9)',
              backdropFilter: 'blur(20px)', border: '1px solid rgba(255,183,3,0.4)',
              display: 'flex', alignItems: 'center', overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6),0 0 20px rgba(255,183,3,0.15)' }}>
            <div style={{ position: 'relative', width: '46px', height: '46px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="46" height="46" viewBox="0 0 46 46" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="23" cy="23" r="20" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="23" cy="23" r="20" fill="none" stroke="#ffb703" strokeWidth="3"
                  strokeDasharray="125" strokeDashoffset={125 - (125 * progressXp) / 100}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }} strokeLinecap="round" />
              </svg>
              <div style={{ color: '#ffb703', fontWeight: 900, fontSize: '0.9rem', zIndex: 2 }}>{currentLevel}</div>
            </div>
            <div className="xp-widget-details" style={{ overflow: 'hidden', whiteSpace: 'nowrap',
              transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ffb703',
                  letterSpacing: '1px', textTransform: 'uppercase' }}>{levelData.name}</div>
                <div style={{ fontSize: '0.55rem', color: '#d8f3dc', opacity: 0.7,
                  fontWeight: 900, marginTop: '2px' }}>{progressXp} / 100 XP</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* PROFILE MODAL */}
      {(
        <AnimatePresence>
          {showProfile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(8,28,21,0.85)', backdropFilter: 'blur(15px)' }}
              onClick={() => setShowProfile(false)}>
              <motion.div initial={{ scale: 0.92, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 24, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '92%', maxWidth: '580px', background: 'rgba(10,22,18,0.97)',
                  border: '1px solid rgba(255,183,3,0.15)', padding: isMobile ? '28px 22px' : '40px',
                  borderRadius: isMobile ? '28px' : '40px', position: 'relative',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,183,3,0.08) inset' }}>
                <button onClick={() => setShowProfile(false)}
                  style={{ position: 'absolute', top: isMobile ? '20px' : '28px', right: isMobile ? '20px' : '28px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', width: '38px', height: '38px', borderRadius: '50%',
                    cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
                  ✕
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '18px' : '28px', marginBottom: '32px' }}>
                  <div style={{ width: isMobile ? '72px' : '90px', height: isMobile ? '72px' : '90px', borderRadius: '24px', flexShrink: 0,
                    background: 'linear-gradient(145deg,#1b4332,#081c15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(255,183,3,0.5)', boxShadow: '0 0 30px rgba(255,183,3,0.2)' }}>
                    <User size={isMobile ? 36 : 44} color="#ffb703" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703', letterSpacing: '4px', fontFamily: "'DM Sans', sans-serif", opacity: 0.8 }}>USER PROFILE</span>
                    <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', color: 'white', margin: '4px 0 0', fontFamily: "'Bebas Neue', cursive", lineHeight: 1, letterSpacing: '1px' }}>{user.name}</h2>
                    <div style={{ marginTop: '10px' }}>
                      <span className="badge-gold">LEVEL {currentLevel} &nbsp;·&nbsp; {levelData.name.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#ffb703', fontWeight: 900,
                      letterSpacing: '2px', marginBottom: '14px', fontFamily: "'DM Sans', sans-serif" }}>STATISTICS</div>
                    {[{ label: 'Trips Logged', val: '12' }, { label: 'Countries Visited', val: '04' }, { label: 'Office Escapes', val: '08' }].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'rgba(216,243,220,0.45)', fontSize: '0.73rem', fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#ffb703', fontWeight: 900,
                      letterSpacing: '2px', marginBottom: '14px', fontFamily: "'DM Sans', sans-serif" }}>WEEKLY ACTIVITY</div>
                    <div style={{ height: '56px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                      {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px',
                          background: i === 5
                            ? 'linear-gradient(to top, #ffb703, #ffd166)'
                            : 'rgba(216,243,220,0.12)',
                          transition: 'height 0.3s ease' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      {['M','T','W','T','F','S','S'].map((d,i) => (
                        <span key={i} style={{ flex:1, textAlign:'center', fontSize: '0.48rem', color: i===5 ? '#ffb703' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  {[{ icon: <Target size={16}/>, color: '#ffb703', label: 'Goals' }, { icon: <Globe size={16}/>, color: '#4cc9f0', label: 'Explore' }, { icon: <Zap size={16}/>, color: '#f72585', label: 'Energy' }, { icon: <Briefcase size={16}/>, color: '#d8f3dc', label: 'Work' }].map((a, i) => (
                    <div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: a.color }}>
                      {a.icon}
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.5px' }}>{a.label.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: isMobile ? '20px' : '24px', background: 'rgba(255,183,3,0.04)',
                  borderRadius: '24px', border: '1px solid rgba(255,183,3,0.15)' }}>
                  <div style={{ fontSize: '0.58rem', color: '#ffb703', fontWeight: 900,
                    letterSpacing: '2px', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>ACCOUNT SETTINGS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="email" placeholder="your.email@example.com"
                      value={user.email || ''} onChange={e => setUser({...user, email: e.target.value})}
                      className="input-dark"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '13px 18px' }} />
                    <button onClick={handleEmailUpdate} disabled={isUpdatingEmail}
                      className="btn-gold"
                      style={{ width: '100%', padding: '13px 20px', fontSize: '0.8rem', borderRadius: '14px',
                        opacity: isUpdatingEmail ? 0.6 : 1 }}>
                      {isUpdatingEmail ? 'SAVING...' : <><CheckCircle size={15} /> SAVE EMAIL</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style>{`
        .premium-choice:hover {
          background: rgba(255,183,3,0.08) !important;
          border-color: rgba(255,183,3,0.4) !important;
          color: #ffb703 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        @keyframes scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        .hud-grid::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 120px;
          background: linear-gradient(to bottom, transparent, rgba(216,243,220,0.08), transparent);
          animation: scan 10s linear infinite;
        }
        .xp-widget-details { width: 0; opacity: 0; padding-left: 0; }
        .xp-hover-pill { transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
        .xp-hover-pill:hover .xp-widget-details { width: 120px; opacity: 1; padding-left: 14px; padding-right: 10px; }
        .place-card-cta:hover {
          background: rgba(255,183,3,0.2) !important;
          border-color: rgba(255,183,3,0.4) !important;
        }
      `}</style>
    </div>
  );
}
