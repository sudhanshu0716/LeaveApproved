import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, MapPin, Compass, Calendar, Briefcase, 
  ChevronRight, Award, Settings as SettingsIcon, LogOut, User,
  Globe, Zap, Target, Wind, Activity, CheckCircle, PlaneTakeoff, Tag, Heart,
  Users, ArrowRightLeft, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ItineraryFlow from './ItineraryFlow';
import TravelBuddy from './TravelBuddy';

gsap.registerPlugin(ScrollTrigger);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('itineraries');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [step, setStep] = useState(1);
  
  const tabs = [
    { id: 'itineraries', label: 'ITINERARIES', icon: <Compass size={16} /> },
    { id: 'buddy', label: 'TRAVEL BUDDY', icon: <Users size={16} /> },
    { id: 'comparison', label: 'TRIP COMPARISON', icon: <ArrowRightLeft size={16} /> },
    { id: 'about', label: 'ABOUT', icon: <Info size={16} /> }
  ];
  const [user, setUser] = useState({ name: '', company: '' });
  const [xp, setXp] = useState(45);
  const levels = [
    { name: 'Novice Nomad', xp: 0 },
    { name: 'Occasional Backpacker', xp: 100 },
    { name: 'Seasoned Traveler', xp: 200 },
    { name: 'Global Voyager', xp: 300 },
    { name: 'Elite Explorer', xp: 400 }
  ];

  const currentLevelIndex = Math.floor(xp / 100);
  const currentLevel = currentLevelIndex + 1;
  const progressXp = xp % 100;
  const levelData = levels[Math.min(currentLevelIndex, levels.length - 1)];

  const [showProfile, setShowProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const navigate = useNavigate();

  const handleXpGain = (amount) => {
    setXp(prev => prev + amount);
  };

  const scrollContainerRef = useRef(null);
  const horizontalRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('travel_user');
    if (!savedUser) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.xp !== undefined) {
        setXp(parsedUser.xp);
      }
    }
  }, [navigate]);

  useEffect(() => {
    // Bedrock Scroll Reset: Force absolute origin on phase transition
    window.scrollTo({ top: 0, behavior: 'auto' });
    const timer = setTimeout(() => window.scrollTo(0, 0), 100);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (activeTab === 'itineraries' && step === 1 && horizontalRef.current && scrollContainerRef.current) {
        let ctx = gsap.context(() => {
            const panels = gsap.utils.toArray('.horizontal-panel');
            
            gsap.to(panels, {
              x: () => -(horizontalRef.current.scrollWidth - window.innerWidth),
              ease: "none",
              scrollTrigger: {
                trigger: scrollContainerRef.current,
                pin: true,
                scrub: 1, // Smooth tactical glide
                start: "top top",
                end: () => `+=${horizontalRef.current.scrollWidth / 2}`, // Anchor to physical content width (2x speed)
                invalidateOnRefresh: true,
                anticipatePin: 1
              }
            });
        }, horizontalRef);

        // Mission Recovery Delay: Ensure hardware layout stabilizes before anchoring GSAP
        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 1200);

        return () => ctx.revert();
    }
  }, [step, activeTab]);

  const handleSelection = async (type, value) => {
    handleXpGain(15);
    try {
      // Suffix-Agnostic Normalization: Ensure API receives clean tactical values (no " rupees" or "km")
      const cleanValue = value.replace(' rupees', '').replace('km', '');
      const res = await axios.get(`/api/places?type=${type}&value=${cleanValue}`);
      setPlaces(res.data);
    } catch (err) { setPlaces([]); }
    setStep(2);
  };

  const logout = () => {
    localStorage.removeItem('travel_user');
    navigate('/');
  };

  const handleEmailUpdate = async () => {
    if (!user.email || isUpdatingEmail) return;
    setIsUpdatingEmail(true);
    try {
      const res = await axios.put(`/api/visitors/${user.uid}`, { email: user.email });
      const updatedUser = { ...user, email: res.data.email };
      setUser(updatedUser);
      localStorage.setItem('travel_user', JSON.stringify(updatedUser));
      alert("Email updated successfully.");
    } catch (err) {
      alert("Error saving email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="safari-theme" style={{ width: '100%', minHeight: '100vh', background: '#081c15', position: 'relative', overflowX: 'hidden' }}>
      
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
         <video 
           src="/MUNNAR.mp4" 
           autoPlay loop muted playsInline 
           style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(0.3) brightness(0.6)' }} 
         />
         <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, rgba(8,28,21,0.9))' }} />
         <div className="hud-grid" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(216, 243, 220, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(216, 243, 220, 0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', opacity: 0.4 }} />
      </div>

      {/* Floating Navigation Matrix */}
      <div style={{ position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>
        <div className="glass-panel" style={{ 
          padding: '6px', 
          borderRadius: '50px', 
          display: 'flex', 
          gap: '4px', 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '40px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.id ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MISSION CONTROL HEADER - Restricted to Dashboard Selection */}
      {activeTab === 'itineraries' && step === 1 && (
        <div style={{ position: 'fixed', top: '0', left: '0', width: '100vw', zIndex: 1100, padding: '30px 60px 30px 40px', background: 'linear-gradient(to bottom, rgba(8,28,21,0.9), transparent)', boxSizing: 'border-box' }}>
            {/* GLOBAL LOGO INTEGRATION */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
              <div className="nav-logo-icon" style={{ background: '#1b4332', padding: '10px', borderRadius: '14px', boxShadow: '0 8px 25px rgba(27, 67, 50, 0.4)' }}>
                <PlaneTakeoff size={24} color="white" />
              </div>
              <span className="nav-logo-text" style={{ fontSize: '1.2rem', color: 'white', letterSpacing: '-1.5px', fontWeight: 850, fontFamily: '"Montserrat", sans-serif' }}>LEAVE APPROVED.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.6, letterSpacing: '4px' }}>DASHBOARD</span>
                   <span className="title" style={{ fontSize: '1.4rem', color: 'white', letterSpacing: '1px' }}>MY PLANNER</span>
                   <div style={{ color: '#ffb703', fontSize: '0.65rem', fontWeight: 900, marginTop: '4px', letterSpacing: '1px', opacity: 0.8 }}>
                      SCAN_MODE: TRIP_PARAMETERS // 10.0889° N, 77.0595° E
                   </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '8px 8px 8px 18px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                 <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.5 }}>LOGGED IN</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>{user.name?.split(' ')[0].toUpperCase() || 'VOID'}</div>
                 </div>
                 <button onClick={logout} style={{ padding: '12px 24px', borderRadius: '50px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    EXIT <LogOut size={14} />
                 </button>
              </div>
            </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10 }}>
        {activeTab === 'itineraries' ? (
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              
              <div ref={scrollContainerRef} style={{ height: '150vh', position: 'relative' }}>
                <div ref={horizontalRef} style={{ display: 'flex', width: 'fit-content', height: '100vh', alignItems: 'center', willChange: 'transform' }}>
                  {[
                    { title: 'BUDGET ALLOCATION', code: 'BGT-04', icon: <Briefcase size={32} />, options: ['under 1000 rupees', 'under 2000 rupees', 'under 5000 rupees', 'over 5000 rupees'], type: 'budget', desc: 'Financial resource mapping for the expedition.' },
                    { title: 'TRIP DURATION', code: 'DUR-01', icon: <Calendar size={32} />, options: ['1 day', '2 day', '3 day', '3+ days'], type: 'days', desc: 'Temporal window for target destination operations.' },
                    { title: 'PROXIMITY RADIUS', code: 'RDU-09', icon: <MapPin size={32} />, options: ['under 100km', 'under 250km', 'under 500km', 'over 500km'], type: 'distance', desc: 'Geospatial search diameter from origin point.' }
                  ].map((cat, i) => (
                    <section key={i} className="horizontal-panel" style={{ width: '100vw', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '160px 0 100px 0' }}>
                        
                        {/* COMPACT TACTICAL TAG */}
                        <div className="luggage-tag" style={{ 
                          width: '80vw', 
                          maxWidth: '720px', 
                          display: 'flex', 
                          background: 'rgba(15, 30, 25, 0.85)', 
                          backdropFilter: 'blur(50px)', 
                          border: '1.5px solid rgba(255,255,255,0.15)', 
                          borderRadius: '24px', 
                          position: 'relative', 
                          overflow: 'hidden', 
                          boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
                          clipPath: 'polygon(50px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50px)'
                        }}>
                           
                           {/* Physical Stitching Effect */}
                           <div style={{ position: 'absolute', inset: '10px', pointerEvents: 'none', border: '1px dashed rgba(216, 243, 220, 0.1)', borderRadius: '18px' }} />

                           {/* Brass Grommet Section */}
                           <div style={{ width: '100px', borderRight: '2px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '50px 15px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                              <div style={{ transform: 'rotate(-90deg) translateY(-40px)', whiteSpace: 'nowrap', color: '#ffb703', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '5px', opacity: 0.9 }}>{cat.code}</div>
                              <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                                 <div style={{ fontSize: '0.4rem', color: '#d8f3dc', opacity: 0.3, fontWeight: 900 }}>FLIGHT // LF-9932</div>
                                 <div style={{ fontSize: '0.4rem', color: '#ffb703', fontWeight: 900 }}>CLASS // ELITE</div>
                              </div>
                           </div>

                           {/* Information Core */}
                           <div style={{ flex: 1, padding: '40px 50px', position: 'relative' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                 <div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703', letterSpacing: '4px', marginBottom: '8px', opacity: 0.8 }}>BAGGAGE_CONTROL / 00{i+1}</div>
                                    <h3 className="title" style={{ fontSize: '2.5rem', color: 'white', margin: 0, lineHeight: 1 }}>{cat.title}</h3>
                                    <p style={{ color: 'rgba(216, 243, 220, 0.6)', fontSize: '0.85rem', fontWeight: 600, marginTop: '12px', maxWidth: '450px' }}>{cat.desc}</p>
                                 </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                {cat.options.map(opt => (
                                  <button 
                                    key={opt} 
                                    onClick={() => handleSelection(cat.type, opt)} 
                                    className="premium-choice"
                                    style={{ padding: '20px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  >
                                    {opt.toUpperCase()}
                                    <ChevronRight size={18} opacity={0.4} />
                                  </button>
                                ))}
                              </div>

                              <div style={{ marginTop: '30px', paddingTop: '25px', borderTop: '2px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ fontSize: '0.5rem', color: '#d8f3dc', opacity: 0.2, fontWeight: 900, letterSpacing: '1px' }}>TERMS // NON-TRANSFERABLE TRIP ACCESS</div>
                                    <div style={{ fontSize: '0.5rem', color: '#d8f3dc', opacity: 0.2, fontWeight: 900, letterSpacing: '1px' }}>AUTHENTICATION // SAFARI_PORTAL_ROOT_01</div>
                                 </div>
                                 <div className="barcode" style={{ height: '30px', width: '130px', background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 2px, transparent 2px, transparent 6px)', opacity: 0.3 }} />
                              </div>
                           </div>
                        </div>
                    </section>
                  ))}

                  {/* FINAL BOARDING GATE */}
                  <section className="horizontal-panel" style={{ width: '100vw', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '160px 0 100px 0' }}>
                    <div className="glass-panel" style={{ width: '80vw', maxWidth: '720px', padding: '80px 50px', background: 'rgba(216, 243, 220, 0.03)', backdropFilter: 'blur(60px)', border: '2px dashed #ffb703', borderRadius: '30px', position: 'relative', textAlign: 'center' }}>
                        <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', background: '#ffb703', color: '#081c15', padding: '10px 40px', borderRadius: '50px', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '4px' }}>
                            BOARDING NOW
                        </div>
                        <div style={{ marginBottom: '30px', color: '#ffb703' }}>
                           <PlaneTakeoff size={100} />
                        </div>
                        <h3 className="title" style={{ fontSize: '3.5rem', color: 'white', margin: '0 0 15px 0', lineHeight: 1 }}>GATE: SAFARI-01</h3>
                        <p style={{ color: '#d8f3dc', fontSize: '1.2rem', fontWeight: 600, opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                           All parameters verified. Your office escape vectors are locked. Commencing final synthesis.
                        </p>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ minHeight: '100vh', padding: '200px 40px', width: '100%', maxWidth: '1450px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '60px' }}>
                 <div>
                    <h2 className="title" style={{ fontSize: '3rem', color: 'white', marginBottom: '8px' }}>PLANETARY BLUEPRINTS</h2>
                    <p style={{ color: '#d8f3dc', opacity: 0.5, fontWeight: 700 }}>SYNTHESIZING {places.length} OPTIMAL TRAVEL VECTORS</p>
                 </div>
                 <button onClick={() => setStep(1)} className="glass-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    <SettingsIcon size={18} /> RE-CALIBRATE
                 </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
                {places.map((place) => (
                  <motion.div 
                    key={place._id} 
                    whileHover={{ scale: 1.02 }} 
                    className="glass-panel" 
                    onClick={() => { setSelectedPlace(place); setStep(3); }} 
                    style={{ 
                      padding: '48px', 
                      background: 'rgba(20, 35, 30, 0.4)', 
                      cursor: 'pointer', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      position: 'relative',
                      borderRadius: '40px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                       <span style={{ opacity: 0.4, fontSize: '0.65rem', fontWeight: 900, letterSpacing: '3px' }}>TARGET_0{place._id.slice(-4).toUpperCase()}</span>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                          <Heart size={14} fill={place.likedBy?.length > 0 ? "#ffb703" : "none"} color="#ffb703" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#d8f3dc' }}>{place.likedBy?.length || 0}</span>
                       </div>
                    </div>
                    <h3 className="title" style={{ fontSize: '2rem', color: 'white' }}>{place.name}</h3>
                    <p style={{ color: 'rgba(216, 243, 220, 0.6)', marginTop: '20px', lineHeight: '1.7', fontSize: '1rem' }}>{place.description}</p>
                    
                    <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffb703', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>
                          CREATE TRIP <ArrowRight size={18} />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && selectedPlace && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', padding: '150px 40px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                 <button onClick={() => setStep(2)} className="glass-btn" style={{ padding: '12px 28px', borderRadius: '50px', color: 'white', background: 'rgba(255,255,255,0.1)' }}>
                    ⇠ BACK TO BLUEPRINTS
                 </button>
                 <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ffb703', letterSpacing: '2px' }}>TRIP: {selectedPlace.name.toUpperCase()}</div>
              </div>
              <div className="glass-panel" style={{ background: 'white', borderRadius: '48px', padding: '24px', overflow: 'hidden', boxShadow: '0 50px 150px rgba(0,0,0,0.7)' }}>
                 <ItineraryFlow place={selectedPlace} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        ) : (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }} 
                className={activeTab === 'buddy' ? '' : 'glass-panel'}
                style={ activeTab === 'buddy' ? { width: '100%', display: 'flex', justifyContent: 'center' } : {
                  padding: '60px',
                  textAlign: 'center',
                  background: 'rgba(20, 35, 30, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(30px)',
                  borderRadius: '40px',
                  maxWidth: '600px',
                  zIndex: 100
                }}
              >
                {activeTab === 'buddy' ? (
                  <TravelBuddy user={user} onXpGain={handleXpGain} />
                ) : (
                  <>
                    <h2 className="title" style={{ fontSize: '2.5rem', color: 'white', marginBottom: '20px' }}>
                      {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                    <p style={{ color: 'rgba(216, 243, 220, 0.6)', lineHeight: '1.6' }}>
                      This section is coming soon.
                      Full telemetric arrays and interactive topologies will be deployed shortly.
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {step !== 3 && (
        <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfile(true)}
            style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, cursor: 'pointer' }}
        >
            <div className="glass-panel" style={{ 
              padding: '16px 28px', 
              borderRadius: '24px', 
              background: 'rgba(8, 28, 21, 0.7)', 
              backdropFilter: 'blur(30px)', 
              border: '1px solid rgba(216, 243, 220, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 20px rgba(216, 243, 220, 0.05)'
            }}>
              <div style={{ position: 'relative' }}>
                  <div style={{ 
                    background: '#ffb703', 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#081c15',
                    boxShadow: '0 0 20px rgba(255, 183, 3, 0.4)'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{levelData.icon}</span>
                  </div>
                  <div style={{ position: 'absolute', inset: '-4px', border: '1px solid #ffb703', borderRadius: '14px', opacity: 0.3, animation: 'pulse 2s infinite' }} />
              </div>

              <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffb703', letterSpacing: '2px' }}>LEVEL 0{currentLevel}</span>
                    <span style={{ width: '4px', height: '4px', background: 'rgba(216, 243, 220, 0.3)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.6, letterSpacing: '1px' }}>TRAVELER</span>
                  </div>
                  <div className="title" style={{ fontSize: '1.1rem', color: 'white', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{levelData.name.toUpperCase()}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#d8f3dc', opacity: 0.5 }}>XP PROGRESS</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#ffb703' }}>{progressXp} / 100</span>
                  </div>
                  <div style={{ width: '120px', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <motion.div 
                      animate={{ width: `${progressXp}%` }} 
                      style={{ 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #ffb703, #fb8500)', 
                        borderRadius: '10px'
                      }} 
                    />
                  </div>
              </div>
            </div>
        </motion.div>
      )}

      {/* VOYAGER IDENTITY DOSSIER OVERLAY */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8, 28, 21, 0.85)', backdropFilter: 'blur(15px)' }}
            onClick={() => setShowProfile(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '90%', maxWidth: '600px', background: 'rgba(20, 35, 30, 0.95)', border: '1px solid rgba(216, 243, 220, 0.2)', padding: '40px', borderRadius: '40px', position: 'relative' }}
            >
               <button onClick={() => setShowProfile(false)} style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>

               <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'linear-gradient(145deg, #1b4332, #081c15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ffb703', boxShadow: '0 0 30px rgba(255,183,3,0.3)' }}>
                     <User size={50} color="#ffb703" />
                  </div>
                  <div>
                     <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ffb703', letterSpacing: '4px' }}>USER PROFILE</span>
                     <h2 className="title" style={{ fontSize: '2.5rem', color: 'white', margin: 0 }}>{user.name}</h2>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                        <div style={{ padding: '6px 12px', background: 'rgba(255,183,3,0.1)', border: '1px solid #ffb703', borderRadius: '8px', color: '#ffb703', fontSize: '0.6rem', fontWeight: 900 }}>LEVEL 03 // TRAVELER</div>
                        <div style={{ color: '#d8f3dc', opacity: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>USER_ID: {user.uid || 'NEW-USER-001'}</div>
                     </div>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div style={{ fontSize: '0.6rem', color: '#ffb703', fontWeight: 900, letterSpacing: '1px', marginBottom: '15px' }}>STATISTICS</div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'Trips Logged', val: '12' },
                          { label: 'Countries Visited', val: '04' },
                          { label: 'Office Escapes', val: '08' }
                        ].map(s => (
                          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ color: '#d8f3dc', opacity: 0.5, fontSize: '0.75rem' }}>{s.label}</span>
                             <span style={{ color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>{s.val}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div style={{ fontSize: '0.6rem', color: '#ffb703', fontWeight: 900, letterSpacing: '1px', marginBottom: '15px' }}>APP ACTIVITY</div>
                     <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                        {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                          <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? '#ffb703' : 'rgba(216, 243, 220, 0.2)', borderRadius: '2px' }} />
                        ))}
                     </div>
                     <div style={{ fontSize: '0.55rem', color: '#d8f3dc', opacity: 0.4, marginTop: '8px', textAlign: 'center' }}>ACTIVE THIS WEEK</div>
                  </div>
               </div>

               <div>
                 <div style={{ fontSize: '0.6rem', color: '#ffb703', fontWeight: 900, letterSpacing: '1px', marginBottom: '20px' }}>ACHIEVEMENTS</div>
                 <div style={{ display: 'flex', gap: '20px' }}>
                    {[
                      { icon: <Target size={18}/>, color: '#ffb703', label: 'BUDGET_MASTER' },
                      { icon: <Globe size={18}/>, color: '#4cc9f0', label: 'GLOBAL_SCOUT' },
                      { icon: <Zap size={18}/>, color: '#f72585', label: 'FAST_PLANNER' },
                      { icon: <Briefcase size={18}/>, color: '#d8f3dc', label: 'OFFICE_ESCAPE' }
                    ].map(a => (
                      <div key={a.label} style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                         {a.icon}
                      </div>
                    ))}
                 </div>
               </div>

               {/* ACCOUNT SETTINGS TERMINAL */}
               <div style={{ marginTop: '40px', padding: '30px', background: 'rgba(255,183,3,0.05)', borderRadius: '30px', border: '1px solid rgba(255,183,3,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#ffb703', fontWeight: 900, letterSpacing: '2px', marginBottom: '20px' }}>ACCOUNT SETTINGS</div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                     <input 
                        type="email" 
                        placeholder="your.email@example.com"
                        value={user.email || ''}
                        onChange={(e) => setUser({...user, email: e.target.value})}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px 20px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                     />
                     <button 
                        onClick={handleEmailUpdate}
                        disabled={isUpdatingEmail}
                        style={{ padding: '0 25px', borderRadius: '14px', background: '#ffb703', color: '#081c15', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s ease' }}
                     >
                        {isUpdatingEmail ? 'SAVING...' : 'SAVE EMAIL'}
                        {!isUpdatingEmail && <CheckCircle size={16} />}
                     </button>
                  </div>
                  <p style={{ margin: '15px 0 0 0', fontSize: '0.65rem', color: '#d8f3dc', opacity: 0.4, fontWeight: 600 }}>Linking your email saves your trips across devices.</p>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .premium-choice:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: #ffb703 !important;
          transform: scale(1.02);
          color: #ffb703 !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hud-grid::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 100px;
          background: linear-gradient(to bottom, transparent, rgba(216, 243, 220, 0.1), transparent);
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
