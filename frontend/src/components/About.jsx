import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Camera, Globe, MessageSquare, Send, CheckCircle, Map, Navigation, Compass } from 'lucide-react';

export default function About() {
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState(false);
  const [hoverTarget, setHoverTarget] = useState(null);

  const handleQuery = (e) => {
    e.preventDefault();
    if (!query) return;
    setSent(true);
    setTimeout(() => { setSent(false); setQuery(''); }, 3000);
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const slideUp = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '30px', padding: '20px' }}>
      
      {/* HUD HEADER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, transparent, #ffb703)' }} />
        <span style={{ color: '#ffb703', fontWeight: 900, letterSpacing: '6px', fontSize: '0.8rem' }}>VOYAGER DIRECTIVE</span>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(-90deg, transparent, #ffb703)' }} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* LEFT COLUMN: DOSSIER */}
        <motion.div 
          variants={staggerContainer} initial="hidden" animate="show"
          style={{ position: 'relative', overflow: 'hidden', padding: '40px', background: 'rgba(20, 35, 30, 0.7)', backdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(216,243,220,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          {/* Animated Background Element */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} 
            style={{ position: 'absolute', top: '-20%', right: '-20%', opacity: 0.03, pointerEvents: 'none' }}
          >
             <Globe size={400} />
          </motion.div>
          
          <motion.div variants={slideUp}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffb703', fontSize: '0.8rem', letterSpacing: '4px', fontWeight: 900, marginBottom: '10px' }}>
              <Navigation size={16} /> THE NAVIGATOR
            </div>
            <h1 style={{ color: 'white', fontSize: '3.5rem', margin: '0 0 20px 0', fontWeight: 900, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>Sudhanshu</h1>
          </motion.div>
          
          <motion.div variants={slideUp} style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(255,183,3,0.5)', marginBottom: '40px' }}>
            <p style={{ color: 'rgba(216, 243, 220, 0.8)', fontSize: '1.05rem', lineHeight: '1.8', margin: 0 }}>
              I am an obsessive solo traveler and explorer who has logged over <strong style={{ color: '#ffb703', fontSize: '1.2rem' }}>32,000 km</strong> deep within the terrains of South India. 
              Always on the move, mapping the uncharted, and escaping the 9-to-5 loop.
            </p>
          </motion.div>

          {/* SOCIAL TERMINALS */}
          <motion.div variants={slideUp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <a href="mailto:sudh0716@gmail.com" onMouseEnter={() => setHoverTarget('mail')} onMouseLeave={() => setHoverTarget(null)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 20px', borderRadius: '15px', border: '1px solid rgba(255,183,3,0.2)', background: hoverTarget === 'mail' ? 'rgba(255,183,3,0.1)' : 'rgba(0,0,0,0.2)', color: hoverTarget === 'mail' ? '#ffb703' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
                  <Mail size={18} color="#ffb703" /> sudh0716@gmail.com
                </div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '1px' }}>COMM LINK</div>
              </div>
            </a>

            <a href="https://instagram.com/lostsudh" target="_blank" rel="noreferrer" onMouseEnter={() => setHoverTarget('ig1')} onMouseLeave={() => setHoverTarget(null)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 20px', borderRadius: '15px', border: '1px solid rgba(247, 37, 133, 0.2)', background: hoverTarget === 'ig1' ? 'rgba(247, 37, 133, 0.1)' : 'rgba(0,0,0,0.2)', color: hoverTarget === 'ig1' ? '#f72585' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
                  <Camera size={18} color="#f72585" /> @lostsudh
                </div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '1px' }}>ARCHIVES</div>
              </div>
            </a>

            <a href="https://instagram.com/sudhanshu0716" target="_blank" rel="noreferrer" onMouseEnter={() => setHoverTarget('ig2')} onMouseLeave={() => setHoverTarget(null)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 20px', borderRadius: '15px', border: '1px solid rgba(76, 201, 240, 0.2)', background: hoverTarget === 'ig2' ? 'rgba(76, 201, 240, 0.1)' : 'rgba(0,0,0,0.2)', color: hoverTarget === 'ig2' ? '#4cc9f0' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
                  <Camera size={18} color="#4cc9f0" /> @sudhanshu0716
                </div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '1px' }}>PERSONAL LOG</div>
              </div>
            </a>

          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: QUERY BLOCK */}
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
           style={{ display: 'flex', flexDirection: 'column' }}
        >
          <form onSubmit={handleQuery} style={{ boxSizing: 'border-box', height: '100%', padding: '40px', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '30px', border: '1px solid rgba(255,183,3,0.1)', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
            
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, letterSpacing: '2px', fontSize: '1.2rem', fontWeight: 900 }}>
              <MessageSquare color="#ffb703" size={24} /> SECURE QUERY
            </h3>
            <p style={{ color: 'rgba(216, 243, 220, 0.6)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Want to trace my routes, get insights on South India, or team up for a trip? Drop a secured payload into the system below.
            </p>
            
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.1, pointerEvents: 'none' }}><Map size={60} /></div>
              <textarea 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Identify your mission or query..."
                required
                style={{ boxSizing: 'border-box', flex: 1, minHeight: '100px', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8, 28, 21, 0.8)', color: 'white', fontSize: '0.95rem', resize: 'none', outline: 'none', lineHeight: '1.5', fontFamily: 'inherit' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={sent} 
              style={{ 
                marginTop: '15px', 
                padding: '16px', 
                borderRadius: '15px', 
                background: sent ? 'rgba(216,243,220,0.1)' : '#ffb703', 
                color: sent ? '#d8f3dc' : '#081c15', 
                border: sent ? '1px solid rgba(216,243,220,0.3)' : 'none', 
                fontWeight: 900, 
                letterSpacing: '1px',
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '10px', 
                transition: 'all 0.4s ease' 
              }}>
              {sent ? <><CheckCircle size={18} /> PAYLOAD SENT SUCCESSFULLY</> : <><Send size={18} /> INITIATE TRANSMISSION</>}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
