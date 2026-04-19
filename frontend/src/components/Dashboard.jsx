import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Compass, Briefcase, ChevronRight,
  Settings as SettingsIcon, LogOut, User,
  Globe, Zap, Target, CheckCircle, PlaneTakeoff, Heart,
  Users, ArrowRightLeft, Info, FileText
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getUserAuthHeader } from '../utils/auth';
import ItineraryFlow from './ItineraryFlow';
import TravelBuddy from './TravelBuddy';
import TripComparison from './TripComparison';
import About from './About';

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onClick={e => { e.stopPropagation(); setShow(s => !s); }}>
      <span style={{ width: '15px', height: '15px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.58rem', fontWeight: 900, cursor: 'help',
        color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>i</span>
      {show && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, left: 'auto',
          background: 'rgba(4,12,8,0.97)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,183,3,0.2)', borderRadius: '12px',
          padding: '10px 14px', color: 'rgba(255,255,255,0.85)',
          fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500, lineHeight: 1.5, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none', width: '240px', textAlign: 'center' }}>
          <div style={{ position: 'absolute', bottom: '100%', right: '6px', left: 'auto',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderBottom: '5px solid rgba(4,12,8,0.97)' }} />
          {text}
        </div>
      )}
    </span>
  );
}

const THEMES = [
  { id: 'forest',  name: 'Forest',  bg: '#081c15', navBg: 'rgba(8,28,21,0.85)',  secondary: '#1b4332', accent: '#ffb703', accentGlow: 'rgba(255,183,3,0.2)',   xpGradient: 'linear-gradient(90deg,#ffb703,#ff8c00)' },
  { id: 'ocean',   name: 'Ocean',   bg: '#030f1a', navBg: 'rgba(3,15,26,0.85)',  secondary: '#0a2540', accent: '#4cc9f0', accentGlow: 'rgba(76,201,240,0.2)',  xpGradient: 'linear-gradient(90deg,#4cc9f0,#0096c7)' },
  { id: 'royal',   name: 'Royal',   bg: '#0a0415', navBg: 'rgba(10,4,21,0.85)',  secondary: '#1e0a35', accent: '#c77dff', accentGlow: 'rgba(199,125,255,0.2)', xpGradient: 'linear-gradient(90deg,#c77dff,#9b59b6)' },
  { id: 'crimson', name: 'Crimson', bg: '#140206', navBg: 'rgba(20,2,6,0.85)',   secondary: '#2b0814', accent: '#ff5d73', accentGlow: 'rgba(255,93,115,0.2)',  xpGradient: 'linear-gradient(90deg,#ff5d73,#e63946)' },
  { id: 'arctic',  name: 'Arctic',  bg: '#050d12', navBg: 'rgba(5,13,18,0.85)', secondary: '#0d1f2d', accent: '#00d4aa', accentGlow: 'rgba(0,212,170,0.2)',   xpGradient: 'linear-gradient(90deg,#00d4aa,#00b4d8)' },
];

export default function Dashboard({ darkMode = true, setDarkMode }) {
  const VALID_TABS = ['itineraries', 'buddy', 'comparison', 'contribute', 'about'];
  const { tab: urlTab, placeId: urlPlaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = urlPlaceId ? 'itineraries' : (VALID_TABS.includes(urlTab) ? urlTab : 'itineraries');
  const [compareSubView, setCompareSubView] = useState(0); // 0=trip comparison, 1=cost AI
  const [places, setPlaces]       = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  // step is derived from URL: placeId→3, ?filter→2, else→1
  const step = urlPlaceId ? 3 : (searchParams.get('filter') ? 2 : 1);
  const setStep = (s) => {
    if (s === 1) navigate('/dashboard/itineraries');
    // step 2 is set via handleSelection which updates searchParams
    // step 3 is set via navigate('/dashboard/itineraries/:id')
  };
  const currentCard = parseInt(searchParams.get('card') || '0');
  const setCurrentCard = (val) => {
    const n = typeof val === 'function' ? val(currentCard) : val;
    setSearchParams(p => { const np = new URLSearchParams(p); np.set('card', n); return np; }, { replace: true });
  };
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [user, setUser]           = useState({ name: '', company: '' });
  const [xp, setXp]               = useState(45);
  const [showProfile, setShowProfile]   = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [profileStats, setProfileStats] = useState({ created: 0, requested: 0 });
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('travel_theme');
    return THEMES.find(t => t.id === saved) || THEMES[0];
  });
  const [weekActivity, setWeekActivity] = useState([0,0,0,0,0,0,0]);
  const [showActivityInfo, setShowActivityInfo] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [placesTotal, setPlacesTotal] = useState(0);
  const [lastFilter, setLastFilter] = useState({ type: '', value: '' });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [buddyNotif, setBuddyNotif] = useState(0); // pending match requests count
  const [buddyInitView, setBuddyInitView] = useState('feed'); // used to deep-link into MY TRIPS
  const [buddyNavKey, setBuddyNavKey] = useState(0);
  const navigate = useNavigate();

  // Navigate to a tab by updating the URL
  const setActiveTab = (tabId) => navigate(`/dashboard/${tabId}`);

  // ── Activity helpers ──────────────────────────────
  const activityKey = (uid) => `travel_activity_${uid || 'guest'}`;

  // Always use LOCAL date string to avoid UTC-offset bugs (e.g. IST midnight ≠ UTC midnight)
  const localDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const recordActivity = (uid, n = 1) => {
    const today = localDateStr(new Date());
    const raw = JSON.parse(localStorage.getItem(activityKey(uid)) || '{}');
    raw[today] = (raw[today] || 0) + n;
    // Keep last 30 days only
    const trimmed = {};
    Object.keys(raw).sort().slice(-30).forEach(k => (trimmed[k] = raw[k]));
    localStorage.setItem(activityKey(uid), JSON.stringify(trimmed));
  };

  const readWeekActivity = (uid) => {
    const raw = JSON.parse(localStorage.getItem(activityKey(uid)) || '{}');
    const today = new Date();
    const daysFromMonday = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysFromMonday + i);
      return raw[localDateStr(d)] || 0;
    }); // index 0=Mon … 6=Sun
  };

  const tabs = [
    { id: 'itineraries', label: 'ITINERARIES', icon: <Compass size={16} />,       info: 'Browse curated travel itineraries — filter by budget, duration & distance to find your perfect trip' },
    { id: 'buddy',       label: 'BUDDY',       icon: <Users size={16} />,         info: 'Find travel companions — post your trip or join others heading to the same destination' },
    { id: 'comparison',  label: 'COMPARE',     icon: <ArrowRightLeft size={16} />, info: 'Side-by-side trip comparison — pick the best route, budget & timing for your getaway' },
    { id: 'contribute',  label: 'CONTRIBUTE',  icon: <FileText size={16} />,      info: 'Share your travel story in plain text — AI converts it into a full interactive itinerary' },
    { id: 'about',       label: 'ABOUT',       icon: null,                         info: 'About Leave Approved — our mission & how to get in touch' },
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
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85',
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
    // Migrate: remove any stale 'guest' key from before uid was known
    localStorage.removeItem(activityKey('guest'));
    // Record today's login as activity
    recordActivity(p.uid, 1);
    setWeekActivity(readWeekActivity(p.uid));
  }, [navigate]);

  // Restore step 2 (places list) from URL filter params on refresh
  useEffect(() => {
    const filterType = searchParams.get('filter');
    const filterValue = searchParams.get('value');
    if (!filterType || !filterValue || urlPlaceId) return;
    setLastFilter({ type: filterType, value: filterValue });
    fetchPlaces(filterType, filterValue, '', 'newest');
  }, []);  // only on mount

  // Restore itinerary detail view from URL on refresh
  useEffect(() => {
    if (!urlPlaceId) return;
    axios.get(`/api/places/${urlPlaceId}`, { headers: getUserAuthHeader() })
      .then(r => { setSelectedPlace(r.data); })
      .catch(() => { navigate('/dashboard/itineraries'); });
  }, [urlPlaceId]);

  useEffect(() => {
    if (!user.uid) return;
    axios.get(`/api/visitors/${user.uid}`, { headers: getUserAuthHeader() })
      .then(r => {
        if (r.data?.xp !== undefined && r.data.xp !== xp) {
          setXp(r.data.xp);
          const updated = { ...user, xp: r.data.xp };
          setUser(updated);
          localStorage.setItem('travel_user', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, [user.uid]);

  useEffect(() => {
    if (!showProfile || !user.uid) return;
    axios.get(`/api/buddy/my-trips?uid=${user.uid}`, { headers: getUserAuthHeader() })
      .then(r => setProfileStats({ created: r.data.created?.length || 0, requested: r.data.requested?.length || 0 }))
      .catch(() => {});
    setWeekActivity(readWeekActivity(user.uid));
  }, [showProfile, user.uid]);

  // Poll for pending buddy match notifications every 30s
  const refreshBuddyNotif = () => {
    if (!user.uid) return;
    axios.get(`/api/buddy/my-trips?uid=${user.uid}`, { headers: getUserAuthHeader() })
      .then(r => {
        const pending = (r.data.created || []).reduce((acc, t) =>
          acc + (t.matches || []).filter(m => m.status === 'pending').length, 0);
        setBuddyNotif(pending);
      })
      .catch(() => {});
  };
  useEffect(() => {
    if (!user.uid) return;
    refreshBuddyNotif();
    const iv = setInterval(refreshBuddyNotif, 30000);
    return () => clearInterval(iv);
  }, [user.uid]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCurrentCard(0);
  }, [step]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-gold', currentTheme.accent);
    document.documentElement.style.setProperty('--primary-green', currentTheme.bg);
    document.documentElement.style.setProperty('--secondary-green', currentTheme.secondary);
    localStorage.setItem('travel_theme', currentTheme.id);
  }, [currentTheme]);

  /* ── handlers ── */
  const handleXpGain = (n) => {
    const newXp = xp + n;
    setXp(newXp);
    if (user.uid) {
      recordActivity(user.uid, 1);
      setWeekActivity(readWeekActivity(user.uid));
      // Sync XP to backend (fire-and-forget)
      axios.patch(`/api/visitors/${user.uid}/xp`, { xp: newXp }, { headers: getUserAuthHeader() }).catch(() => {});
    }
  };

  const fetchPlaces = async (type, value, search = '', sort = 'newest') => {
    setPlacesLoading(true);
    try {
      const clean = value.replace(' rupees', '').replace('km', '');
      const params = new URLSearchParams({ type, value: clean, sort });
      if (search.trim()) params.set('search', search.trim());
      const res = await axios.get(`/api/places?${params}`);
      // Handle both old (array) and new (object) response shapes
      if (Array.isArray(res.data)) {
        setPlaces(res.data);
        setPlacesTotal(res.data.length);
      } else {
        setPlaces(res.data.places || []);
        setPlacesTotal(res.data.total || 0);
      }
    } catch { setPlaces([]); setPlacesTotal(0); }
    setPlacesLoading(false);
  };

  const handleSelection = async (type, value) => {
    handleXpGain(15);
    setLastFilter({ type, value });
    setSearchQuery('');
    setSortBy('newest');
    await fetchPlaces(type, value, '', 'newest');
    // Encode filter in URL so refresh restores step 2
    setSearchParams({ filter: type, value }, { replace: false });
  };

  const logout = () => { localStorage.removeItem('travel_user'); localStorage.removeItem('travel_token'); navigate('/'); };

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
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 20, background: '#050e09' }}
        onTouchStart={e => { e.currentTarget.dataset.swipeX = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const diff = parseFloat(e.currentTarget.dataset.swipeX || 0) - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 45) {
            if (diff > 0 && currentCard < cards.length - 1) setCurrentCard(c => c + 1);
            if (diff < 0 && currentCard > 0) setCurrentCard(c => c - 1);
          }
        }}>

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
          padding: 'calc(env(safe-area-inset-top) + 14px) 20px 0',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => { setBuddyInitView('profile'); setBuddyNavKey(k => k + 1); setActiveTab('buddy'); }}
              style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, flexShrink: 0,
                background: 'linear-gradient(135deg, #ffb703, #ff8c00)',
                border: '2px solid rgba(255,183,3,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 900, color: '#081c15', overflow: 'hidden' }}>
              {(() => { const av = user?.uid ? localStorage.getItem(`la_avatar_url_${user.uid}`) : null; return av ? <img src={av} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name?.[0] || 'U').toUpperCase(); })()}
            </button>
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
        </div>

        {/* ── FILTER PILL NAV ── */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 62px)', left: 0, right: 0, zIndex: 30,
          display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', gap: '5px', background: 'rgba(4,12,8,0.82)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px',
            padding: '4px 5px' }}>
            {[{ idx: 0, icon: '💰', label: 'Budget' }, { idx: 1, icon: '🕐', label: 'Duration' }, { idx: 2, icon: '📍', label: 'Distance' }].map(({ idx, icon, label }) => (
              <button key={idx} onClick={() => setCurrentCard(idx)}
                style={{ padding: '6px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                  background: currentCard === idx ? '#ffb703' : 'transparent',
                  color: currentCard === idx ? '#081c15' : 'rgba(255,255,255,0.55)' }}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SWIPE HINT ── */}
        <div style={{ position: 'absolute', top: '32%', left: 0, right: 0, zIndex: 30,
          display: 'flex', justifyContent: 'space-between', padding: '0 10px', pointerEvents: 'none' }}>
          {currentCard > 0 && (
            <div style={{ opacity: 0.25, color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {currentCard < cards.length - 1 && (
            <div style={{ opacity: 0.25, color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}
        </div>

        {/* ── BOTTOM CONTENT AREA ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25,
          padding: '0 22px calc(80px + max(24px, env(safe-area-inset-bottom)))' }}>

          {/* Animated title block */}
          <AnimatePresence mode="wait">
            <motion.div key={`title-${currentCard}`}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32 }}>


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
    <div className="safari-theme" style={{ width: '100%', minHeight: '100vh', background: darkMode ? currentTheme.bg : '#f8f5ee', position: 'relative', overflowX: 'hidden', color: darkMode ? 'white' : '#081c15' }}>

      {/* BG VIDEO (desktop) */}
      {!isMobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <video src="/MUNNAR.mp4" autoPlay loop muted playsInline disablePictureInPicture
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(0.3) brightness(0.6)', pointerEvents: 'none' }} />
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
            background: currentTheme.navBg, backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${currentTheme.accentGlow} inset` }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => {
                if (tab.id === 'buddy' && buddyNotif > 0) { setBuddyInitView('my_trips'); setBuddyNavKey(k => k + 1); }
                else if (tab.id === 'buddy') { setBuddyInitView('feed'); setBuddyNavKey(k => k + 1); }
                setActiveTab(tab.id);
                if (tab.id === 'itineraries') setStep(1);
              }}
                style={{ padding: '9px 18px', borderRadius: '40px', border: 'none',
                  background: activeTab === tab.id
                    ? `${currentTheme.accent}22`
                    : 'transparent',
                  color: activeTab === tab.id ? currentTheme.accent : 'rgba(255,255,255,0.45)',
                  fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'all 0.25s ease', position: 'relative',
                  boxShadow: activeTab === tab.id ? `0 0 0 1px ${currentTheme.accent}40 inset` : 'none',
                  letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
                {tab.icon} {tab.label}
                <InfoTooltip text={tab.info} />
                {tab.id === 'buddy' && buddyNotif > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '6px', background: '#ff5d73', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {buddyNotif > 9 ? '9+' : buddyNotif}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTER NAV BAR — desktop step 1 only ── */}
      {!isMobile && activeTab === 'itineraries' && step === 1 && (
        <div style={{ position: 'fixed', top: '130px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '8px', zIndex: 1150,
          background: 'rgba(4,12,8,0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px',
          padding: '6px 8px' }}>
          {[
            { idx: 0, icon: '💰', label: 'Budget' },
            { idx: 1, icon: '🕐', label: 'Duration' },
            { idx: 2, icon: '📍', label: 'Distance' },
          ].map(({ idx, icon, label }) => (
            <button key={idx} onClick={() => setCurrentCard(idx)}
              style={{ padding: '8px 20px', borderRadius: '50px', border: 'none',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '7px',
                transition: 'all 0.25s ease',
                background: currentCard === idx ? '#ffb703' : 'transparent',
                color: currentCard === idx ? '#081c15' : 'rgba(255,255,255,0.55)' }}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}

      {/* ── DESKTOP USER/EXIT for non-itinerary tabs ── */}
      {!isMobile && !(activeTab === 'itineraries' && step === 1) && (
        <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 1200,
          padding: '8px 8px 8px 18px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px',
          background: currentTheme.navBg, backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => { setBuddyInitView('profile'); setBuddyNavKey(k => k + 1); setActiveTab('buddy'); }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffb703, #ff8c00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#081c15', flexShrink: 0, overflow: 'hidden' }}>
              {(() => { const av = user?.uid ? localStorage.getItem(`la_avatar_url_${user.uid}`) : null; return av ? <img src={av} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name?.[0] || 'U').toUpperCase(); })()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.42rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.5, letterSpacing: '2px', textAlign: 'center' }}>LOGGED IN</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>
                {user.name?.split(' ')[0].toUpperCase() || 'USER'}
              </div>
            </div>
          </div>
          <button onClick={logout}
            style={{ padding: '10px 20px', borderRadius: '50px', background: 'rgba(255,255,255,0.1)',
              border: 'none', color: 'white', fontSize: '0.62rem', fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px',
              fontFamily: "'DM Sans', sans-serif" }}>
            EXIT <LogOut size={13} />
          </button>
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
              <button key={tab.id} onClick={() => {
                  if (tab.id === 'buddy' && buddyNotif > 0) { setBuddyInitView('my_trips'); setBuddyNavKey(k => k + 1); }
                  else if (tab.id === 'buddy') { setBuddyInitView('feed'); setBuddyNavKey(k => k + 1); }
                  setActiveTab(tab.id);
                  if (tab.id === 'itineraries') setStep(1);
                }}
                style={{ background: isActive ? 'rgba(255,183,3,0.1)' : 'none',
                  border: isActive ? '1px solid rgba(255,183,3,0.2)' : '1px solid transparent',
                  borderRadius: '14px', cursor: 'pointer', position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '7px 12px', minWidth: '48px',
                  color: isActive ? '#ffb703' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.2s ease', fontFamily: "'DM Sans', sans-serif" }}>
                {tab.icon}
                <span style={{ fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.5px' }}>{tab.label}</span>
                {tab.id === 'buddy' && buddyNotif > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '4px', background: '#ff5d73', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.45rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {buddyNotif > 9 ? '9+' : buddyNotif}
                  </span>
                )}
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
                <circle cx="23" cy="23" r="20" fill="none" stroke={currentTheme.accent} strokeWidth="4"
                  strokeDasharray="125" strokeDashoffset={125 - (125 * progressXp) / 100}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <span style={{ color: currentTheme.accent, fontWeight: 900, fontSize: '0.55rem', zIndex: 2 }}>{currentLevel}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => { setBuddyInitView('profile'); setBuddyNavKey(k => k + 1); setActiveTab('buddy'); }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffb703, #ff8c00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#081c15', flexShrink: 0, overflow: 'hidden' }}>
                  {(() => { const av = user?.uid ? localStorage.getItem(`la_avatar_url_${user.uid}`) : null; return av ? <img src={av} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name?.[0] || 'U').toUpperCase(); })()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.45rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.5, textAlign: 'center', letterSpacing: '1.5px' }}>LOGGED IN</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>
                    {user.name?.split(' ')[0].toUpperCase() || 'VOID'}
                  </div>
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
                      const cardIcons = { budget: '💳', days: '🕐', distance: '🗺️' };
                      const subtitles = {
                        budget: ['Street food & hostels','Budget explorer','Comfort traveler','Luxury experience'],
                        days:   ['Quick getaway','Weekend escape','Short vacation','Grand expedition'],
                        distance: ['Day trip zone','Regional escape','Cross-state journey','Distant horizons'],
                      };
                      const optIcons = { distance: ['🚶','🛵','🚗','✈️'], budget: ['💸','💵','💳','💎'], days: ['⚡','🌅','🗓️','🌍'] };
                      return (
                        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', width: '100%',
                          boxShadow: '0 50px 120px rgba(0,0,0,0.75)' }}>
                          {/* Full-bleed travel image */}
                          <div style={{ position: 'absolute', inset: 0,
                            backgroundImage: `url(${cat.img})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            filter: 'brightness(0.6) saturate(1.1)' }} />
                          {/* Gradient overlay — transparent top, very dark bottom */}
                          <div style={{ position: 'absolute', inset: 0,
                            background: 'linear-gradient(170deg, rgba(4,12,8,0.15) 0%, rgba(4,12,8,0.45) 35%, rgba(4,12,8,0.88) 62%, rgba(4,12,8,0.97) 100%)' }} />
                          {/* Amber glow at bottom */}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
                            background: 'radial-gradient(ellipse at 30% 100%, rgba(255,183,3,0.1) 0%, transparent 70%)',
                            pointerEvents: 'none' }} />

                          {/* Content */}
                          <div style={{ position: 'relative', padding: '36px 44px 32px', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            {/* Top bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffb703' }} />
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '4px', fontFamily: "'DM Sans', sans-serif" }}>LEAVE APPROVED</span>
                              </div>
                              <span style={{ fontSize: '0.58rem', fontWeight: 900, color: '#ffb703', letterSpacing: '3px', fontFamily: "'DM Sans', sans-serif",
                                background: 'rgba(255,183,3,0.12)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '50px', padding: '5px 14px' }}>
                                STEP 0{currentCard + 1}
                              </span>
                            </div>

                            {/* Title block — mid card */}
                            <div style={{ marginTop: 'auto', marginBottom: '24px' }}>
                              <h2 style={{ fontSize: '4rem', color: 'white', margin: '0 0 8px', fontFamily: "'Bebas Neue', cursive",
                                letterSpacing: '3px', lineHeight: 0.92, whiteSpace: 'pre-line',
                                textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>{cat.title}</h2>
                              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', margin: 0,
                                fontWeight: 500, fontFamily: "'DM Sans', sans-serif", maxWidth: '420px', lineHeight: 1.5 }}>{cat.desc}</p>
                            </div>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
                              <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'rgba(255,183,3,0.65)', letterSpacing: '3px', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>CHOOSE YOUR RANGE</span>
                              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
                            </div>

                            {/* Options 2x2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              {cat.options.map((opt, oi) => (
                                <button key={opt} onClick={() => handleSelection(cat.type, opt)}
                                  style={{ padding: '15px 18px', borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.07)',
                                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                    border: '1px solid rgba(255,255,255,0.11)',
                                    cursor: 'pointer', transition: 'all 0.22s ease', textAlign: 'left',
                                    display: 'flex', alignItems: 'center', gap: '13px',
                                    fontFamily: "'DM Sans', sans-serif" }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,183,3,0.16)'; e.currentTarget.style.borderColor = 'rgba(255,183,3,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'rgba(255,183,3,0.18)', border: '1px solid rgba(255,183,3,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', flexShrink: 0 }}>
                                    {(optIcons[cat.type] || optIcons.days)[oi]}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'white',
                                      letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>{opt}</div>
                                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,183,3,0.75)', fontWeight: 600 }}>
                                      {(subtitles[cat.type] || subtitles.days)[oi]}
                                    </div>
                                  </div>
                                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                                </button>
                              ))}
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
                style={{ minHeight: '100vh', padding: isMobile ? '70px 16px 100px' : '200px 40px',
                  width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Header row — title + back button always inline */}
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: isMobile ? '14px' : '36px' }}>
                  <div>
                    <h2 className="title" style={{ fontSize: isMobile ? '1.8rem' : '3rem', color: 'white', margin: 0, fontFamily: "'Bebas Neue', cursive", lineHeight: 1 }}>
                      PLACES FOR YOU
                    </h2>
                    <p style={{ color: '#d8f3dc', opacity: 0.5, fontWeight: 600, fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", margin: '4px 0 0' }}>
                      {placesLoading ? 'SEARCHING...' : `${placesTotal} DESTINATION${placesTotal !== 1 ? 'S' : ''} FOUND`}
                    </p>
                  </div>
                  <button onClick={() => navigate('/dashboard/itineraries')} className="glass-btn"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white', fontSize: '0.65rem',
                      padding: '9px 16px', flexShrink: 0,
                      borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>
                    ← BACK
                  </button>
                </div>

                {/* Search + Sort bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: isMobile ? '16px' : '32px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        fetchPlaces(lastFilter.type, lastFilter.value, e.target.value, sortBy);
                      }}
                      placeholder="Search destinations..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 38px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', color: 'white', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                    />
                  </div>
                  {/* Custom sort dropdown */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={() => setShowSortDropdown(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: showSortDropdown ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${showSortDropdown ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '50px', color: 'white', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>
                      <span style={{ color: showSortDropdown ? '#d4af37' : 'rgba(255,255,255,0.85)' }}>
                        {{ newest: 'Newest', popular: 'Most Liked', name: 'A → Z' }[sortBy]}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: showSortDropdown ? '#d4af37' : 'rgba(255,255,255,0.5)' }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <AnimatePresence>
                      {showSortDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '150px', background: 'rgba(10,20,14,0.97)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', overflow: 'hidden', zIndex: 100, backdropFilter: 'blur(20px)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                          {[{ value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Most Liked' }, { value: 'name', label: 'A → Z' }].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => { setSortBy(opt.value); fetchPlaces(lastFilter.type, lastFilter.value, searchQuery, opt.value); setShowSortDropdown(false); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 18px', background: sortBy === opt.value ? 'rgba(212,175,55,0.12)' : 'transparent', border: 'none', color: sortBy === opt.value ? '#d4af37' : 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s ease', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              onMouseEnter={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                              onMouseLeave={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}>
                              {opt.label}
                              {sortBy === opt.value && <span style={{ fontSize: '0.65rem', color: '#d4af37' }}>✓</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Loading states */}
                {placesLoading && places.length === 0 ? (
                  /* Initial load — golden skeleton */
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '36px', paddingTop: '8px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#d4af37', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(212,175,55,0.6)', letterSpacing: '2px', fontWeight: 600 }}>LOADING...</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: isMobile ? '16px' : '28px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ borderRadius: isMobile ? '20px' : '24px', overflow: 'hidden', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.08)' }}>
                          <div style={{ height: isMobile ? '110px' : '130px', background: 'linear-gradient(90deg, rgba(212,175,55,0.03) 25%, rgba(212,175,55,0.09) 50%, rgba(212,175,55,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ height: '14px', background: 'rgba(212,175,55,0.07)', borderRadius: '8px', width: '60%' }} />
                            <div style={{ height: '10px', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', width: '80%' }} />
                            <div style={{ height: '10px', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', width: '45%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !placesLoading && places.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: isMobile ? '3rem' : '4.5rem', fontFamily: "'Bebas Neue', cursive", marginBottom: '16px', letterSpacing: '3px', color: 'rgba(255,255,255,0.15)' }}>NO TRIPS FOUND</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>No destinations match those filters.<br/>Try a different budget or distance range.</p>
                    <button onClick={() => navigate('/dashboard/itineraries')} className="btn-gold" style={{ margin: '24px auto 0', width: 'fit-content', padding: '14px 28px', fontSize: '0.8rem' }}>
                      ← BACK
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Filter-change overlay spinner */}
                    <AnimatePresence>
                      {placesLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: 'rgba(4,12,8,0.55)', backdropFilter: 'blur(4px)', borderRadius: '16px', minHeight: '200px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#d4af37', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: 'rgba(212,175,55,0.65)', letterSpacing: '2px', fontWeight: 600 }}>UPDATING...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                          onClick={() => {
                            navigate(`/dashboard/itineraries/${place._id}`);
                          }}
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
                  <button onClick={() => navigate(-1)}
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
            paddingBottom: isMobile ? '90px' : '100px', overflowX: 'hidden', width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.22 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', zIndex: 100, overflow: 'hidden' }}>
                {activeTab === 'buddy'        ? <TravelBuddy key={buddyNavKey} user={user} onXpGain={handleXpGain} initialView={buddyInitView} onMatchAccepted={refreshBuddyNotif} darkMode={darkMode} />
                  : activeTab === 'contribute'  ? <TravelBuddy user={user} onXpGain={handleXpGain} initialView="contribute" hideNav darkMode={darkMode} />
                  : activeTab === 'comparison'  ? (
                    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Sub-nav: Trip Comparison | Cost AI */}
                      <div style={{ display: 'inline-flex', gap: '6px', background: 'rgba(4,12,8,0.85)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', padding: '5px 6px', marginBottom: '24px' }}>
                        {[{ icon: '⇄', label: 'COMPARE TRIPS' }, { icon: '💰', label: 'COST AI' }].map((item, i) => (
                          <button key={i} onClick={() => setCompareSubView(i)}
                            style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '1px',
                              display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s',
                              background: compareSubView === i ? '#ffb703' : 'transparent',
                              color: compareSubView === i ? '#081c15' : 'rgba(255,255,255,0.55)' }}>
                            <span>{item.icon}</span>{item.label}
                          </button>
                        ))}
                      </div>
                      {compareSubView === 0 ? <TripComparison /> : <TravelBuddy user={user} onXpGain={handleXpGain} initialView="cost" hideNav darkMode={darkMode} />}
                    </div>
                  )
                  : activeTab === 'about'        ? <About />
                  : null}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* XP SYNERGY WIDGET — desktop only */}
      {!isMobile && step !== 3 && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowProfile(true)}
          style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, cursor: 'pointer' }}>
          <div style={{
            padding: '14px 20px 14px 14px',
            borderRadius: '22px',
            background: currentTheme.navBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${currentTheme.accent}55`,
            display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: `0 16px 48px rgba(0,0,0,0.65), 0 0 28px ${currentTheme.accentGlow}`,
            transition: 'all 0.3s ease',
          }}>
            {/* XP Ring */}
            <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
              <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="27" cy="27" r="23" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="27" cy="27" r="23" fill="none" stroke={currentTheme.accent} strokeWidth="4"
                  strokeDasharray="144" strokeDashoffset={144 - (144 * progressXp) / 100}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                <span style={{ color: currentTheme.accent, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.5s ease' }}>{currentLevel}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '0.36rem', letterSpacing: '1.5px', fontFamily: "'DM Sans', sans-serif" }}>LVL</span>
              </div>
            </div>
            {/* Text block */}
            <div style={{ minWidth: '110px' }}>
              <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', fontWeight: 900, letterSpacing: '3px', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>SYNERGY</div>
              <div style={{ fontSize: '0.92rem', color: currentTheme.accent, fontWeight: 900, letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1, transition: 'color 0.5s ease' }}>{levelData.name.toUpperCase()}</div>
              {/* XP bar */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressXp}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ height: '100%', background: currentTheme.xpGradient, borderRadius: '2px', transition: 'background 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                  <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{progressXp} / 100 XP</span>
                  <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.12)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{100 - progressXp} TO GO</span>
                </div>
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
                alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
                overflowY: isMobile ? 'auto' : 'visible',
                padding: isMobile ? '20px 0 100px' : '0',
                background: 'rgba(8,28,21,0.85)', backdropFilter: 'blur(15px)' }}
              onClick={() => setShowProfile(false)}>
              <motion.div initial={{ scale: 0.92, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 24, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '92%', maxWidth: '580px', background: 'rgba(10,22,18,0.97)',
                  border: `1px solid ${currentTheme.accent}22`, padding: isMobile ? '28px 22px' : '40px',
                  borderRadius: isMobile ? '28px' : '40px', position: 'relative',
                  flexShrink: 0,
                  boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${currentTheme.accent}12 inset` }}>
                <button onClick={() => { setShowProfile(false); setShowActivityInfo(false); }}
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
                    border: `2px solid ${currentTheme.accent}80`, boxShadow: `0 0 30px ${currentTheme.accentGlow}`, overflow: 'hidden' }}>
                    {(() => { const av = user?.uid ? localStorage.getItem(`la_avatar_url_${user.uid}`) : null; return av ? <img src={av} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={isMobile ? 36 : 44} color="#ffb703" />; })()}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703', letterSpacing: '4px', fontFamily: "'DM Sans', sans-serif", opacity: 0.8 }}>USER PROFILE</span>
                    <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', color: 'white', margin: '4px 0 0', fontFamily: "'Bebas Neue', cursive", lineHeight: 1, letterSpacing: '1px' }}>{user.name}</h2>
                    <div style={{ marginTop: '10px' }}>
                      <span className="badge-gold">LEVEL {currentLevel} &nbsp;·&nbsp; {levelData.name.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#ffb703', fontWeight: 900,
                      letterSpacing: '2px', marginBottom: '14px', fontFamily: "'DM Sans', sans-serif" }}>STATISTICS</div>
                    {[{ label: 'Trips Listed', val: String(profileStats.created).padStart(2, '0') }, { label: 'Trips Joined', val: String(profileStats.requested).padStart(2, '0') }, { label: 'Total XP', val: String(xp) }].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'rgba(216,243,220,0.45)', fontSize: '0.73rem', fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', position: 'relative' }}>
                      <div style={{ fontSize: '0.58rem', color: currentTheme.accent, fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>WEEKLY ACTIVITY</div>
                      <button
                        onClick={() => setShowActivityInfo(v => !v)}
                        style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1px solid ${currentTheme.accent}55`,
                          background: showActivityInfo ? `${currentTheme.accent}22` : 'rgba(255,255,255,0.04)',
                          color: currentTheme.accent, fontSize: '0.55rem', fontWeight: 900,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', flexShrink: 0, fontFamily: 'serif', lineHeight: 1 }}>
                        i
                      </button>
                      {showActivityInfo && (
                        <div style={{ position: 'absolute', top: '22px', right: 0, zIndex: 10,
                          width: '180px', padding: '12px 14px', borderRadius: '14px',
                          background: 'rgba(10,20,15,0.98)', border: `1px solid ${currentTheme.accent}30`,
                          boxShadow: `0 12px 32px rgba(0,0,0,0.7), 0 0 0 1px ${currentTheme.accent}15 inset` }}>
                          <div style={{ fontSize: '0.48rem', color: currentTheme.accent, fontWeight: 900, letterSpacing: '2px', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>HOW IT GROWS</div>
                          {[
                            { icon: '🔑', text: 'Opening the app' },
                            { icon: '🗺️', text: 'Selecting a trip category' },
                            { icon: '✈️', text: 'Listing or joining trips' },
                            { icon: '📝', text: 'Contributing a place' },
                          ].map(row => (
                            <div key={row.text} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.7rem' }}>{row.icon}</span>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{row.text}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                            Each action adds +1 to today's bar. Bars reset every Monday.
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ height: '64px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '5px', paddingTop: '16px', boxSizing: 'border-box' }}>
                      {(() => {
                        const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
                        const maxVal = Math.max(...weekActivity, 1);
                        return weekActivity.map((count, i) => {
                          const isToday = i === todayIdx;
                          const heightPct = isToday ? 90 : Math.max(8, Math.round((count / maxVal) * 78));
                          return (
                            <div key={i} style={{ flex: 1, height: `${heightPct}%`, borderRadius: '4px',
                              background: isToday
                                ? currentTheme.xpGradient.replace('90deg', 'to top')
                                : count > 0
                                  ? `${currentTheme.accent}30`
                                  : 'rgba(255,255,255,0.07)',
                              border: isToday ? 'none' : count > 0 ? `1px solid ${currentTheme.accent}25` : 'none',
                              transition: 'height 0.5s ease, background 0.5s ease',
                              position: 'relative' }}>
                              {count > 0 && !isToday && (
                                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                  fontSize: '0.38rem', color: currentTheme.accent, fontWeight: 900, fontFamily: "'DM Sans', sans-serif",
                                  opacity: 0.6, whiteSpace: 'nowrap' }}>{count}</div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      {['M','T','W','T','F','S','S'].map((d,i) => {
                        const todayI = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
                        return <span key={i} style={{ flex:1, textAlign:'center', fontSize: '0.48rem', color: i===todayI ? currentTheme.accent : 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{d}</span>;
                      })}
                    </div>
                  </div>
                </div>
                {/* XP Progress to next level */}
                <div style={{ padding: '18px 20px', background: 'rgba(255,183,3,0.04)', borderRadius: '20px', border: '1px solid rgba(255,183,3,0.15)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.58rem', color: '#ffb703', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                      LEVEL {currentLevel} → {currentLevel + 1}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{progressXp} / 100 XP</div>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressXp}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                      style={{ height: '100%', background: currentTheme.xpGradient, borderRadius: '3px', transition: 'background 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    {100 - progressXp} XP to reach <span style={{ color: '#ffb703', fontWeight: 700 }}>{levels[Math.min(currentLevel, levels.length - 1)].name.toUpperCase()}</span>
                  </div>
                </div>

                {/* Company + Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                  <Briefcase size={15} color="#ffb703" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>COMPANY</div>
                    <div style={{ fontSize: '0.82rem', color: 'white', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{user.company || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: <PlaneTakeoff size={15}/>, label: 'LIST TRIP', tab: 'buddy', buddyView: 'list', color: '#ffb703' },
                    { icon: <Compass size={15}/>, label: 'EXPLORE', tab: 'itineraries', color: '#4cc9f0' },
                    { icon: <FileText size={15}/>, label: 'CONTRIBUTE', tab: 'contribute', color: '#4ade80' },
                  ].map(a => (
                    <button key={a.label} onClick={() => { setShowProfile(false); if (a.buddyView) setBuddyInitView(a.buddyView); setActiveTab(a.tab); if (a.tab === 'itineraries') setStep(1); }}
                      style={{ padding: '14px 8px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: a.color,
                        transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                      {a.icon}
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px' }}>{a.label}</span>
                    </button>
                  ))}
                </div>

                {/* ── THEME SWITCHER ── */}
                <div style={{ marginTop: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', fontWeight: 900, letterSpacing: '2.5px', marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>INTERFACE THEME</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => setCurrentTheme(t)}
                        title={t.name}
                        style={{
                          width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                          background: `linear-gradient(135deg, ${t.secondary} 0%, ${t.accent} 100%)`,
                          border: currentTheme.id === t.id ? '3px solid white' : '2px solid rgba(255,255,255,0.12)',
                          boxShadow: currentTheme.id === t.id ? `0 0 16px ${t.accent}99, 0 0 4px ${t.accent}66` : 'none',
                          transition: 'all 0.25s ease',
                          transform: currentTheme.id === t.id ? 'scale(1.15)' : 'scale(1)',
                        }} />
                    ))}
                    <div style={{ marginLeft: '6px' }}>
                      <div style={{ fontSize: '0.62rem', color: currentTheme.accent, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px', transition: 'color 0.4s ease' }}>{currentTheme.name.toUpperCase()}</div>
                      <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>ACTIVE THEME</div>
                    </div>
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
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[placeholder="Search destinations..."]::placeholder { color: rgba(255,255,255,0.3); }
        select option { background: #1b4332; color: white; }
        .hud-grid::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 120px;
          background: linear-gradient(to bottom, transparent, rgba(216,243,220,0.08), transparent);
          animation: scan 10s linear infinite;
        }
        .place-card-cta:hover {
          background: rgba(255,183,3,0.2) !important;
          border-color: rgba(255,183,3,0.4) !important;
        }
      `}</style>
    </div>
  );
}
