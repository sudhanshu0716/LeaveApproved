import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Navigation, Map, Compass, Calendar, Briefcase, Plane, Star, Award, Shield, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import ItineraryFlow from './ItineraryFlow';

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
    `"Manager is stuck in calls, ${n} is stuck under Dudhsagar waterfalls."`,
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
  const [user, setUser] = useState({ name: '', company: '' });
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [stamps, setStamps] = useState([]); // Track unlocked categories
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const levels = [
    { name: 'Novice Nomad', xp: 0, icon: '🌱' },
    { name: 'Occasional Backpacker', xp: 100, icon: '🎒' },
    { name: 'Seasoned Traveler', xp: 200, icon: '🌍' },
    { name: 'Global Voyager', xp: 300, icon: '🚢' },
    { name: 'Master Explorer', xp: 400, icon: '👑' }
  ];

  const currentLevelName = levels.find(l => l.xp === (level - 1) * 100)?.name || 'Legendary Scout';


  useEffect(() => {
    const savedUser = localStorage.getItem('travel_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setStep(1);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % 20);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = getQuotes(user.name, user.company)[quoteIndex];

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (newXp >= 100) {
        setLevel(l => l + 1);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFE600', '#FF5D73', '#90E0EF']
        });
        return newXp - 100;
      }
      return newXp;
    });
  };


  const handleInitSubmit = async (e) => {
    e.preventDefault();
    if (!user.name || !user.company) return;
    try {
      await axios.post('/api/visitors', user);
    } catch (err) { }
    localStorage.setItem('travel_user', JSON.stringify(user));
    setStep(1);
  };

  const logout = () => {
    localStorage.removeItem('travel_user');
    setUser({ name: '', company: '' });
    setStep(0);
  };

  const handleSelection = async (type, value) => {
    if (!stamps.includes(value)) {
      setStamps([...stamps, value]);
      addXp(35);
    }
    try {
      const res = await axios.get(`/api/places?type=${type}&value=${value}`);
      if (res.data.length === 0) {
        setPlaces([
          { 
            _id: '1', name: 'Mystic Mountains', description: 'A serene corporate escape.', 
            nodes: [
              { id: 'start-1', type: 'cityNode', position: { x: 50, y: 150 }, data: { label: 'Home', food: '', rooms: '', activity: '', arrivalTime: '08:00', departureTime: '10:00' } },
              { id: 'start-2', type: 'cityNode', position: { x: 450, y: 150 }, data: { label: 'Mystic Mountains', food: 'Local Café', rooms: 'Mountain Cabin', activity: 'Hiking', arrivalTime: '14:00', departureTime: '18:00' } },
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'start-2', data: { transport: 'Flight ✈️' } },
            ]
          }
        ]);
      } else {
        setPlaces(res.data);
      }
    } catch (err) {
       setPlaces([]);
    }
    setStep(2);
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Dynamic quotes in standard document flow */}
      {step < 3 && (
        <div style={{ position: 'relative', width: '100%', padding: '0 2rem', textAlign: 'center', marginBottom: '2rem', zIndex: 10 }}>
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentQuote}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="quote-text"
              style={{ display: 'inline-block', maxWidth: '90%', transform: 'none', background: 'transparent', border: 'none', boxShadow: 'none', margin: '0' }}
            >
              <span style={{ background: '#FFE600', padding: '10px 20px', border: '4px solid #000', boxShadow: '6px 6px 0px #000', display: 'inline-block', transform: 'rotate(-1deg)' }}>{currentQuote}</span>
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -50, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="glass-card hero-card" 
            style={{ padding: '4rem', width: '100%', maxWidth: '600px', textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <Briefcase size={64} style={{ marginBottom: '1rem' }} />
            </motion.div>
            
            <h1 className="title hero-title" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', letterSpacing: '-2px' }}>Ready for a Break?</h1>

            <form onSubmit={handleInitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '3rem' }}>
              <input type="text" placeholder="What should we call you?" className="input-field" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} required />
              <input type="text" placeholder="Which company are you escaping from?" className="input-field" value={user.company} onChange={e => setUser({ ...user, company: e.target.value })} required />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', fontSize: '1.2rem', padding: '16px' }}>
                Start My Journey <Plane size={24} />
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ type: 'spring', bounce: 0.4 }} style={{ width: '100%', maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            
            <button onClick={logout} style={{ position: 'relative', top: -20, background: 'transparent', border: 'none', fontWeight: 'bold', textDecoration: 'underline', color: '#666', fontSize: '0.8rem', cursor: 'pointer' }}>Not {user.name}? Switch user</button>

            <div style={{ marginBottom: '2rem' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 50, damping: 20 }} style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '3px solid #000', boxShadow: '4px 4px 0px #000' }}>
                <Compass size={40} color="#FF5D73" />
              </motion.div>
              <h2 className="title" style={{ fontSize: '3rem' }}>Hi <span style={{ color: '#FF5D73' }}>{user.name}</span>,</h2>
              <h3 className="title" style={{ fontSize: '2rem', color: '#000', marginTop: '0.5rem' }}>Finally taking time off from <span style={{ background: '#FFE600', padding: '0 10px', display: 'inline-block' }}>{user.company}</span>!</h3>
            </div>

            <div className="mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <motion.div whileHover={{ y: -10 }} className="glass-card" style={{ padding: '3rem 2rem' }}>
                <Briefcase size={48} style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h3 className="title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>By Budget</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {['under 1000', 'under 2000', 'under 5000', 'over 5000'].map((b, i) => (
                    <motion.button key={b} onClick={() => handleSelection('budget', b)} className="btn-outline">{b}</motion.button>
                  ))}
                </div>
              </motion.div>
              
              <motion.div whileHover={{ y: -10 }} className="glass-card" style={{ padding: '3rem 2rem' }}>
                <Calendar size={48} style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h3 className="title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>By Days</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {['1 day', '2 day', '3 day', '4 days', '1 week'].map((d, i) => (
                    <motion.button key={d} onClick={() => handleSelection('days', d)} className="btn-outline">{d}</motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -10 }} className="glass-card" style={{ padding: '3rem 2rem' }}>
                <Map size={48} style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h3 className="title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>By Distance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {['under 250km', 'under 500km', 'under 1000km', 'over 1000km'].map((dist, i) => (
                    <motion.button key={dist} onClick={() => handleSelection('distance', dist)} className="btn-outline">{dist}</motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: '1000px', position: 'relative', zIndex: 1 }}>
            <motion.button whileHover={{ x: -10 }} onClick={() => setStep(1)} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem' }}>
               ← Back to choices
            </motion.button>

            <h2 className="title" style={{ fontSize: '3rem', marginBottom: '3rem', textAlign: 'center', background: '#90E0EF', display: 'inline-block', padding: '10px 20px', border: '4px solid #000', boxShadow: '6px 6px 0px #000', transform: 'rotate(-2deg)' }}>Curated Destinations</h2>
            <div className="mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
              {places.map((place, idx) => (
                <motion.div key={place._id || idx} className="glass-card" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.2, type: 'spring' }} style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => { setSelectedPlace(place); setStep(3); }}>
                  <div style={{ height: '200px', background: `var(--secondary)`, position: 'relative', borderBottom: '4px solid #000' }}>
                     <MapPin size={48} color="#000" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  </div>
                  <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 className="title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{place.name}</h3>
                    <p style={{ color: '#000', marginBottom: '2rem', fontSize: '1.1rem', flex: 1, lineHeight: 1.6, fontWeight: 'bold' }}>{place.description || 'A beautiful place for your getaway.'}</p>
                    <div className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '12px' }}>
                      <Navigation size={20} /> View Setup
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && selectedPlace && (
          <motion.div key="step3" initial={{ opacity: 0, rotateX: 90 }} animate={{ opacity: 1, rotateX: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', damping: 12 }} style={{ width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 1 }}>
             <motion.button whileHover={{ x: -10 }} onClick={() => setStep(2)} style={{ marginBottom: '2rem', background: '#FF5D73', color: '#fff', border: '3px solid #000', padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', boxShadow: '4px 4px 0px #000', transform: 'rotate(1deg)' }}>
               ← Back to Destinations
            </motion.button>
            <ItineraryFlow place={selectedPlace} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gamified Passport Status */}
      {step > 0 && step < 3 && (
        <>
        <motion.div 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowLevelInfo(true)}
          className="passport-ui"
          style={{ 
            position: 'fixed', bottom: '30px', right: '30px', 
            background: '#000', color: '#fff', border: '4px solid #fff', 
            padding: '20px', boxShadow: '8px 8px 0px #FF5D73', zIndex: 100,
            minWidth: '220px', cursor: 'pointer'
          }}
          whileHover={{ scale: 1.05, boxShadow: '12px 12px 0px #FF5D73' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <div style={{ background: '#FFE600', padding: '10px', border: '3px solid #fff' }}>
              <Award size={32} color="#000" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#FF90E8' }}>{currentLevelName}</p>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>RANK {level}</p>
            </div>
          </div>
          
          <div style={{ background: '#333', height: '12px', border: '2px solid #fff', marginBottom: '10px', position: 'relative', overflow: 'hidden' }}>
            <motion.div 
              animate={{ width: `${xp}%` }}
              style={{ height: '100%', background: '#90E0EF', borderRight: '2px solid #fff' }} 
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
            <span>Click to view ranks</span>
            <span>{xp}/100 XP</span>
          </p>
        </motion.div>

        <AnimatePresence>
          {showLevelInfo && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
              onClick={() => setShowLevelInfo(false)}
            >
              <motion.div 
                initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFE600', border: '6px solid #000', padding: '3rem', maxWidth: '500px', width: '100%', boxShadow: '15px 15px 0px #FF5D73' }}
              >
                <h3 className="title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Traveler Ranks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {levels.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: level > i ? 1 : 0.4, border: '3px solid #000', background: level === i + 1 ? '#000' : '#fff', color: level === i + 1 ? '#fff' : '#000', padding: '15px', position: 'relative' }}>
                      <span style={{ fontSize: '1.5rem' }}>{l.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 900 }}>{l.name}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>{level > i + 1 ? 'UNLOCKED' : level === i + 1 ? 'CURRENT RANK' : `UNLOCK AT LEVEL ${i + 1}`}</p>
                      </div>
                      {level > i && <Star size={20} fill="#FFE600" style={{ position: 'absolute', top: -10, right: -10 }} />}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowLevelInfo(false)} style={{ marginTop: '2rem', width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>GOT IT</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
      )}
    </div>
  );
}
