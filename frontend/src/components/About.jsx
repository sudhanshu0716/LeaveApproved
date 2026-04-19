import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Camera, MessageSquare, Send, CheckCircle, Map, Navigation, Code2 } from 'lucide-react';
import { getUserAuthHeader } from '../utils/auth';

export default function About() {
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      await axios.post('/api/contact', { message: query }, { headers: getUserAuthHeader() });
      setSent(true);
      setQuery('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setSendError('Failed to send. Please try again.');
    }
    setSending(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 16px 40px' }}>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,183,3,0.5))' }} />
        <span style={{ color: '#ffb703', fontWeight: 900, letterSpacing: '6px', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>THE TEAM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(-90deg, transparent, rgba(255,183,3,0.5))' }} />
      </motion.div>

      {/* ── STATS ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { val: '32K+', label: 'KM LOGGED', icon: '🗺️' },
          { val: '16',   label: 'STATES',    icon: '📍' },
          { val: '200+', label: 'DESTINATIONS', icon: '✈️' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
            style={{ padding: '20px 12px', textAlign: 'center', background: 'rgba(255,183,3,0.06)',
              borderRadius: '20px', border: '1px solid rgba(255,183,3,0.12)', backdropFilter: 'blur(12px)',
              position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '1.4rem', opacity: 0.15 }}>{s.icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffb703', fontFamily: "'Bebas Neue', cursive", lineHeight: 1, letterSpacing: '1px' }}>{s.val}</div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '2.5px', marginTop: '5px' }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── PROFILE CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* SUDHANSHU */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: 'spring', bounce: 0.25 }}
          style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,183,3,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,183,3,0.05)',
            background: 'rgba(10,20,15,0.9)', backdropFilter: 'blur(20px)', position: 'relative' }}>

          {/* Photo hero */}
          <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
            <img src="/sudhanshu.jpg" alt="Sudhanshu"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '85% 60%', display: 'block' }} />
            {/* Light gradient only at very bottom for seamless blend */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 50%, rgba(10,20,15,0.85) 100%)' }} />
            {/* Floating badge */}
            <div style={{ position: 'absolute', top: '14px', left: '14px', background: '#ffb703', borderRadius: '10px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation size={10} color="#081c15" />
              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#081c15', letterSpacing: '1.5px' }}>THE EXPLORER</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ color: 'white', fontSize: '2.8rem', margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '3px', lineHeight: 1 }}>SUDHANSHU</h2>
            <div style={{ paddingLeft: '14px', borderLeft: '2px solid rgba(255,183,3,0.5)' }}>
              <p style={{ color: 'rgba(216,243,220,0.72)', fontSize: '0.87rem', lineHeight: '1.8', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                An obsessive solo traveler who has logged over{' '}
                <strong style={{ color: '#ffb703' }}>32,000 km</strong> across{' '}
                <strong style={{ color: '#ffb703' }}>16 states</strong> of India.
                Always on the move, mapping the uncharted, escaping the 9-to-5 loop.
                Not just a traveler — a storyteller who believes{' '}
                <strong style={{ color: '#ffb703' }}>every road has a tale</strong> worth living.
                Turning miles into memories, one escape at a time.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: 'mailto:sudh0716@gmail.com', icon: <Mail size={14} />, label: 'sudh0716@gmail.com', sub: 'EMAIL', color: '#ffb703' },
                { href: 'https://instagram.com/lostsudh', icon: <Camera size={14} />, label: '@lostsudh', sub: 'INSTAGRAM', color: '#f72585' },
              ].map((l, i) => (
                <a key={i} href={l.href} target={i > 0 ? '_blank' : undefined} rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.07)`, color: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif' "}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', fontWeight: 600, color: l.color }}>
                      {l.icon}{l.label}
                    </div>
                    <span style={{ fontSize: '0.48rem', opacity: 0.4, letterSpacing: '1.5px', fontWeight: 800 }}>{l.sub}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* PRIYANSH */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, type: 'spring', bounce: 0.25 }}
          style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(99,179,237,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,179,237,0.05)',
            background: 'rgba(8,14,26,0.92)', backdropFilter: 'blur(20px)', position: 'relative' }}>

          {/* Photo hero */}
          <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
            <img src="/priyansh.jpg" alt="Priyansh"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', display: 'block' }} />
            {/* Light gradient only at very bottom for seamless blend */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(8,14,26,0.9) 100%)' }} />
            {/* Floating badge */}
            <div style={{ position: 'absolute', top: '14px', left: '14px', background: '#63b3ed', borderRadius: '10px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Code2 size={10} color="#08141e" />
              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#08141e', letterSpacing: '1.5px' }}>THE BUILDER</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ color: 'white', fontSize: '2.8rem', margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '3px', lineHeight: 1 }}>PRIYANSH</h2>
            <div style={{ paddingLeft: '14px', borderLeft: '2px solid rgba(99,179,237,0.5)' }}>
              <p style={{ color: 'rgba(216,243,220,0.72)', fontSize: '0.87rem', lineHeight: '1.8', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                The architect behind every pixel and every route. Turns late-night ideas into{' '}
                <strong style={{ color: '#63b3ed' }}>living, breathing maps</strong> — because
                the best journeys deserve{' '}
                <strong style={{ color: '#63b3ed' }}>software as thoughtful</strong> as the roads themselves.
                A builder who codes with the soul of a traveler, crafting tools that make{' '}
                <strong style={{ color: '#63b3ed' }}>every adventure effortless</strong> to plan.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: 'mailto:priyanhgargagra123@gmail.com', icon: <Mail size={14} />, label: 'priyanhgargagra123@gmail.com', sub: 'EMAIL', color: '#63b3ed' },
                { href: 'https://instagram.com/priyanshgarg15', icon: <Camera size={14} />, label: '@priyanshgarg15', sub: 'INSTAGRAM', color: '#f72585' },
              ].map((l, i) => (
                <a key={i} href={l.href} target={i > 0 ? '_blank' : undefined} rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif'" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', fontWeight: 600, color: l.color }}>
                      {l.icon}{l.label}
                    </div>
                    <span style={{ fontSize: '0.48rem', opacity: 0.4, letterSpacing: '1.5px', fontWeight: 800 }}>{l.sub}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── SEND MESSAGE ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,183,3,0.1)',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
        <form onSubmit={handleQuery} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,183,3,0.12)', border: '1px solid rgba(255,183,3,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={18} color="#ffb703" />
            </div>
            <div>
              <h3 style={{ color: 'white', margin: 0, letterSpacing: '2.5px', fontSize: '1rem', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>SEND A MESSAGE</h3>
              <p style={{ color: 'rgba(216,243,220,0.4)', fontSize: '0.78rem', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                Routes, South India tips, or just wanna say hi? I'll get back to you.
              </p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.05, pointerEvents: 'none' }}><Map size={60} /></div>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Type your message here..."
              required
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,28,21,0.6)',
                color: 'white', fontSize: '0.9rem', resize: 'none', outline: 'none',
                lineHeight: '1.6', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.25s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,183,3,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
          </div>
          {sendError && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,93,115,0.1)', border: '1px solid rgba(255,93,115,0.3)', borderRadius: '10px', color: '#ff5d73', fontSize: '0.78rem' }}>
              {sendError}
            </div>
          )}
          <button type="submit" disabled={sent || sending}
            style={{ padding: '16px', borderRadius: '14px',
              background: sent ? 'rgba(74,222,128,0.1)' : sending ? 'rgba(255,183,3,0.3)' : '#ffb703',
              color: sent ? '#4ade80' : '#081c15',
              border: sent ? '1px solid rgba(74,222,128,0.3)' : 'none',
              fontWeight: 900, letterSpacing: '1.5px', fontSize: '0.85rem',
              cursor: (sent || sending) ? 'default' : 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
              transition: 'all 0.3s', fontFamily: "'DM Sans', sans-serif",
              boxShadow: sent ? 'none' : '0 6px 24px rgba(255,183,3,0.3)' }}>
            {sent ? <><CheckCircle size={16} /> MESSAGE SENT!</> : sending ? 'SENDING...' : <><Send size={16} /> SEND MESSAGE</>}
          </button>
        </form>
      </motion.div>

    </div>
  );
}
