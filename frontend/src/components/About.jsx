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

  const stats = [
    { val: '32K+', label: 'KM LOGGED' },
    { val: '6', label: 'STATES' },
    { val: '200+', label: 'DESTINATIONS' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 16px 20px' }}>

      {/* HUD HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
        <div style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, transparent, #ffb703)' }} />
        <span style={{ color: '#ffb703', fontWeight: 900, letterSpacing: '5px', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif" }}>ABOUT ME</span>
        <div style={{ width: '36px', height: '2px', background: 'linear-gradient(-90deg, transparent, #ffb703)' }} />
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '18px 12px', textAlign: 'center',
            background: 'rgba(255,183,3,0.05)', borderRadius: '18px',
            border: '1px solid rgba(255,183,3,0.12)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffb703', fontFamily: "'Bebas Neue', cursive", lineHeight: 1, letterSpacing: '1px' }}>{s.val}</div>
            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '2px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

        {/* LEFT COLUMN: DOSSIER */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show"
          style={{ position: 'relative', overflow: 'hidden', padding: '32px',
            background: 'rgba(14,26,21,0.85)', backdropFilter: 'blur(24px)',
            borderRadius: '26px', border: '1px solid rgba(216,243,220,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>

          <motion.div animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-15%', right: '-15%', opacity: 0.025, pointerEvents: 'none' }}>
            <Globe size={360} />
          </motion.div>

          <motion.div variants={slideUp} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb703', fontSize: '0.65rem', letterSpacing: '4px', fontWeight: 900, marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
              <Navigation size={14} /> YOUR HOST
            </div>
            <h1 style={{ color: 'white', fontSize: '3.4rem', margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px', lineHeight: 1 }}>SUDHANSHU</h1>
          </motion.div>

          <motion.div variants={slideUp}
            style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid rgba(255,183,3,0.4)', marginBottom: '28px' }}>
            <p style={{ color: 'rgba(216,243,220,0.7)', fontSize: '0.9rem', lineHeight: '1.75', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              An obsessive solo traveler who has logged over{' '}
              <strong style={{ color: '#ffb703' }}>32,000 km</strong> through the terrains of South India.
              Always on the move, mapping the uncharted, escaping the 9-to-5 loop.
            </p>
          </motion.div>

          {/* SOCIAL TERMINALS */}
          <motion.div variants={slideUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { href: 'mailto:sudh0716@gmail.com', id: 'mail', icon: <Mail size={16} color="#ffb703" />, label: 'sudh0716@gmail.com', sub: 'EMAIL', accentColor: '#ffb703', borderColor: 'rgba(255,183,3,0.2)', hoverBg: 'rgba(255,183,3,0.08)', hoverColor: '#ffb703' },
              { href: 'https://instagram.com/lostsudh', id: 'ig1', icon: <Camera size={16} color="#f72585" />, label: '@lostsudh', sub: 'TRAVEL PHOTOS', accentColor: '#f72585', borderColor: 'rgba(247,37,133,0.2)', hoverBg: 'rgba(247,37,133,0.08)', hoverColor: '#f72585' },
              { href: 'https://instagram.com/sudhanshu0716', id: 'ig2', icon: <Camera size={16} color="#4cc9f0" />, label: '@sudhanshu0716', sub: 'PERSONAL', accentColor: '#4cc9f0', borderColor: 'rgba(76,201,240,0.2)', hoverBg: 'rgba(76,201,240,0.08)', hoverColor: '#4cc9f0' },
            ].map(link => (
              <a key={link.id} href={link.href} target={link.id !== 'mail' ? '_blank' : undefined} rel="noreferrer"
                onMouseEnter={() => setHoverTarget(link.id)} onMouseLeave={() => setHoverTarget(null)}
                style={{ textDecoration: 'none' }}>
                <div style={{ padding: '14px 18px', borderRadius: '14px',
                  border: `1px solid ${hoverTarget === link.id ? link.accentColor + '40' : link.borderColor}`,
                  background: hoverTarget === link.id ? link.hoverBg : 'rgba(0,0,0,0.2)',
                  color: hoverTarget === link.id ? link.hoverColor : 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  transform: hoverTarget === link.id ? 'translateX(4px)' : 'translateX(0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif" }}>
                    {link.icon} {link.label}
                  </div>
                  <span style={{ fontSize: '0.52rem', opacity: 0.45, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{link.sub}</span>
                </div>
              </a>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: QUERY BLOCK */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, type: 'spring', bounce: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={handleQuery}
            style={{ boxSizing: 'border-box', height: '100%', padding: '32px',
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)',
              borderRadius: '26px', border: '1px solid rgba(255,183,3,0.1)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 40px rgba(0,0,0,0.3)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <MessageSquare color="#ffb703" size={20} />
              <h3 style={{ color: 'white', margin: 0, letterSpacing: '2px', fontSize: '1rem', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>
                SEND A MESSAGE
              </h3>
            </div>
            <p style={{ color: 'rgba(216,243,220,0.5)', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '20px', fontFamily: "'DM Sans', sans-serif" }}>
              Routes, South India tips, or just wanna say hi? Drop a message.
            </p>

            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.06, pointerEvents: 'none' }}><Map size={56} /></div>
              <textarea value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Type your message here..."
                required
                style={{ boxSizing: 'border-box', flex: 1, minHeight: '130px', padding: '16px',
                  borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(8,28,21,0.7)', color: 'white', fontSize: '0.9rem',
                  resize: 'none', outline: 'none', lineHeight: '1.6', fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.25s ease' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,183,3,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
            </div>

            <button type="submit" disabled={sent}
              style={{ marginTop: '14px', padding: '15px', borderRadius: '14px',
                background: sent ? 'rgba(74,222,128,0.1)' : '#ffb703',
                color: sent ? '#4ade80' : '#081c15',
                border: sent ? '1px solid rgba(74,222,128,0.3)' : 'none',
                fontWeight: 900, letterSpacing: '1px', cursor: sent ? 'default' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                transition: 'all 0.3s ease', fontFamily: "'DM Sans', sans-serif",
                boxShadow: sent ? 'none' : '0 4px 20px rgba(255,183,3,0.35)' }}>
              {sent ? <><CheckCircle size={16} /> MESSAGE SENT!</> : <><Send size={16} /> SEND MESSAGE</>}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
