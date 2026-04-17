import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Scissors, User, Plane, Compass, Settings,
  Eye, EyeOff, Mail, Lock, Building2, AtSign, CheckCircle2, Circle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// ── Password rules (mirrors backend) ──────────────────────────
const PWD_RULES = [
  { id: 'len',   label: 'At least 8 characters',          test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)',      test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)',      test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0-9)',                test: p => /[0-9]/.test(p) },
  { id: 'spec',  label: 'One special character (!@#$%...)',test: p => /[^A-Za-z0-9]/.test(p) },
];

function passwordStrength(pwd) {
  const passed = PWD_RULES.filter(r => r.test(pwd)).length;
  if (passed <= 1) return { score: passed, label: 'Very Weak', color: '#ef4444' };
  if (passed === 2) return { score: passed, label: 'Weak',      color: '#f97316' };
  if (passed === 3) return { score: passed, label: 'Fair',      color: '#eab308' };
  if (passed === 4) return { score: passed, label: 'Good',      color: '#84cc16' };
  return              { score: passed, label: 'Strong',         color: '#22c55e' };
}

export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCutting, setIsCutting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  // Sign-in fields
  const [signIn, setSignIn] = useState({ login: '', password: '' });

  // Sign-up fields
  const [signUp, setSignUp] = useState({ username: '', email: '', company: '', password: '', confirm: '' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const savedUser = localStorage.getItem('travel_user');
    if (savedUser) navigate('/dashboard');
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signIn.login || !signIn.password || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        login: signIn.login,
        password: signIn.password
      });
      const userData = {
        name: res.data.username,
        username: res.data.username,
        company: res.data.company,
        uid: res.data.uid,
        xp: res.data.xp || 45
      };
      localStorage.setItem('travel_user', JSON.stringify(userData));
      setIsCutting(true);
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { username, email, company, password, confirm } = signUp;
    if (!username || !email || !company || !password || loading) return;
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    const failedRules = PWD_RULES.filter(r => !r.test(password));
    if (failedRules.length > 0) { setError('Password too weak — ' + failedRules[0].label + '.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { username, email, company, password });
      const userData = {
        name: res.data.username,
        username: res.data.username,
        company: res.data.company,
        uid: res.data.uid,
        xp: res.data.xp || 45
      };
      localStorage.setItem('travel_user', JSON.stringify(userData));
      setIsCutting(true);
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setShowPass(false);
    setShowConfirm(false);
  };

  /* ── password strength meter component ─────── */
  const StrengthMeter = ({ password }) => {
    if (!password) return null;
    const strength = passwordStrength(password);
    return (
      <div style={{ marginTop: '-4px', marginBottom: '4px' }}>
        {/* Bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', transition: 'background 0.3s',
              background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        {/* Label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: strength.color, fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px' }}>
            {strength.label.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
            {strength.score}/5 rules met
          </span>
        </div>
        {/* Rules checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {PWD_RULES.map(rule => {
            const ok = rule.test(password);
            return (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                {ok
                  ? <CheckCircle2 size={12} color="#22c55e" />
                  : <Circle size={12} color="rgba(255,255,255,0.2)" />}
                <span style={{ fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif", color: ok ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
                  {rule.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── shared input style ─────────────────────── */
  const mobileInputStyle = {
    padding: '15px 18px 15px 46px', borderRadius: '14px',
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', fontSize: '0.95rem', fontWeight: 500,
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    width: '100%', boxSizing: 'border-box',
  };

  const desktopUnderlineInput = {
    background: 'none', padding: '4px 0', borderRadius: 0,
    border: 'none', fontSize: '1.1rem', color: '#ffffff',
    fontWeight: 700, width: '100%', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* ── VIDEO BG ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'black' }}>
        <video
          key={isMobile ? 'mobile' : 'desktop'}
          src={isMobile ? '/videos/switzerland.mp4' : '/MUNNAR.mp4'}
          autoPlay loop muted playsInline preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2) contrast(1.1) brightness(0.8)' }}
        />
      </div>

      {/* ── BRAND LOGO ── */}
      <div style={{ position: 'fixed', top: isMobile ? '48px' : '32px', left: '24px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'rgba(216,243,220,0.1)', padding: isMobile ? '8px' : '10px', borderRadius: '14px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Compass size={isMobile ? 22 : 28} color="#ffb703" />
        </div>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 950, letterSpacing: '3px', color: 'white', fontFamily: "'DM Sans', sans-serif" }}>
          LEAVE<span style={{ color: '#d8f3dc' }}>APPROVED</span>
        </h1>
      </div>

      {!isMobile && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000 }}>
          <Link to="/admin" style={{ padding: '10px 16px', fontSize: '0.65rem', textDecoration: 'none', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', color: 'white', fontWeight: 900, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif" }}>
            <Settings size={13} /> ADMIN
          </Link>
        </div>
      )}

      {/* ════════════════════════════════
          MOBILE LAYOUT
      ════════════════════════════════ */}
      {isMobile && (
        <div style={{ position: 'relative', zIndex: 10, height: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 22px max(28px, env(safe-area-inset-bottom))' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>

            {/* Headline */}
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,183,3,0.8)', letterSpacing: '3px', marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" }}>
              ESCAPE THE 9-TO-5
            </p>
            <h2 style={{ fontSize: '3.4rem', fontWeight: 400, color: 'white', margin: '0 0 4px', lineHeight: 0.92, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>
              LEAVE<br />APPROVED.
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
              {mode === 'signup' ? 'Create your account to start planning.' : 'Welcome back, traveller.'}
            </p>

            {/* Mode toggle pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'rgba(0,0,0,0.3)', borderRadius: '50px', padding: '4px' }}>
              {['signin', 'signup'].map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  style={{ flex: 1, padding: '10px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '1px', transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif", background: mode === m ? '#ffb703' : 'transparent', color: mode === m ? '#050e09' : 'rgba(255,255,255,0.5)' }}>
                  {m === 'signin' ? 'SIGN IN' : 'NEW ACCOUNT'}
                </button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'rgba(255,93,115,0.15)', border: '1px solid rgba(255,93,115,0.4)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', color: '#ff5d73', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── SIGN IN FORM ── */}
            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <motion.form key="signin-mobile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                  onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input placeholder="Username or email" value={signIn.login} onChange={e => setSignIn({ ...signIn, login: e.target.value })} required style={mobileInputStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type={showPass ? 'text' : 'password'} placeholder="Password" value={signIn.password} onChange={e => setSignIn({ ...signIn, password: e.target.value })} required style={{ ...mobileInputStyle, paddingRight: '46px' }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button type="submit" style={{ padding: '17px', borderRadius: '50px', background: loading ? 'rgba(255,183,3,0.4)' : '#ffb703', border: 'none', color: '#050e09', fontSize: '0.92rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px', marginTop: '4px' }}>
                    {loading ? 'SIGNING IN...' : <>SIGN IN <ArrowRight size={18} /></>}
                  </button>
                </motion.form>
              )}

              {/* ── SIGN UP FORM ── */}
              {mode === 'signup' && (
                <motion.form key="signup-mobile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input placeholder="Username" value={signUp.username} onChange={e => setSignUp({ ...signUp, username: e.target.value })} required style={mobileInputStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type="email" placeholder="Email address" value={signUp.email} onChange={e => setSignUp({ ...signUp, email: e.target.value })} required style={mobileInputStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input placeholder="Company name" value={signUp.company} onChange={e => setSignUp({ ...signUp, company: e.target.value })} required style={mobileInputStyle} />
                  </div>
                  <div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                      <input type={showPass ? 'text' : 'password'} placeholder="Password" value={signUp.password} onChange={e => setSignUp({ ...signUp, password: e.target.value })} required style={{ ...mobileInputStyle, paddingRight: '46px' }} />
                      <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signUp.password && (
                      <div style={{ marginTop: '10px', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <StrengthMeter password={signUp.password} />
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" value={signUp.confirm} onChange={e => setSignUp({ ...signUp, confirm: e.target.value })} required style={{ ...mobileInputStyle, paddingRight: '46px' }} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button type="submit" style={{ padding: '17px', borderRadius: '50px', background: loading ? 'rgba(255,183,3,0.4)' : '#ffb703', border: 'none', color: '#050e09', fontSize: '0.92rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px', marginTop: '4px' }}>
                    {loading ? 'CREATING...' : <>CREATE ACCOUNT <ArrowRight size={18} /></>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ════════════════════════════════
          DESKTOP LAYOUT
      ════════════════════════════════ */}
      {!isMobile && (
        <div style={{ position: 'relative', zIndex: 10, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7 }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            <div style={{ display: 'flex', flexDirection: 'row', width: '980px', minHeight: '400px', position: 'relative', filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.6))', flexShrink: 0 }}>

              {/* scissors animation */}
              <AnimatePresence>
                {isCutting && (
                  <motion.div key="scissors"
                    initial={{ y: -120, opacity: 0, left: '66.6%', x: '-50%' }}
                    animate={{ y: 500, opacity: 1, scale: [1, 1.25, 1], rotate: [90, 80, 100, 90] }}
                    transition={{ y: { duration: 2, ease: 'linear' }, scale: { repeat: 10, duration: 0.2 }, rotate: { repeat: 10, duration: 0.15 } }}
                    style={{ position: 'absolute', zIndex: 1000, color: 'white' }}>
                    <Scissors size={54} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* cut line */}
              {isCutting && (
                <motion.div initial={{ height: 0 }} animate={{ height: '100%' }}
                  transition={{ duration: 1.8, ease: 'linear' }}
                  style={{ position: 'absolute', left: '66.6%', width: '2px', background: 'linear-gradient(to bottom, transparent, #d8f3dc, transparent)', filter: 'blur(4px)', zIndex: 100 }} />
              )}

              {/* ── LEFT PANEL (main form) ── */}
              <motion.div className="glass-panel gold-shimmer-panel"
                animate={isCutting ? { x: -10, filter: 'brightness(1.1)' } : {}}
                style={{ flex: '2', padding: '36px 44px', borderRight: '4px dashed rgba(255,255,255,0.1)', borderTopRightRadius: 0, borderBottomRightRadius: 0, position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.08)' }}>

                {/* Ticket header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plane size={18} color="rgba(216,243,220,0.5)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '4px', color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif" }}>TURBO AIRLINE</span>
                  </div>
                  <span style={{ fontSize: '0.55rem', fontWeight: 900, border: '1px solid #d8f3dc', padding: '4px 12px', borderRadius: '50px', color: '#d8f3dc', fontFamily: "'DM Sans', sans-serif" }}>FAST TRACK PASS</span>
                </div>

                <div style={{ display: 'flex', gap: '40px', marginBottom: '24px', color: 'white' }}>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.5, fontFamily: "'DM Sans', sans-serif" }}>FROM</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>COMPANY'S DESK</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.3 }}>
                    <div style={{ width: '30px', height: '1px', background: 'white' }} />
                    <Plane size={14} />
                    <div style={{ width: '30px', height: '1px', background: 'white' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.5, fontFamily: "'DM Sans', sans-serif" }}>TO</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>YOUR NEXT ADVENTURE</div>
                  </div>
                </div>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '50px', padding: '4px', width: 'fit-content' }}>
                  {['signin', 'signup'].map(m => (
                    <button key={m} onClick={() => switchMode(m)}
                      style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '1px', transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif", background: mode === m ? '#ffb703' : 'transparent', color: mode === m ? '#050e09' : 'rgba(255,255,255,0.45)' }}>
                      {m === 'signin' ? 'ALREADY A TRAVELLER' : 'NEW TRAVELLER'}
                    </button>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(255,93,115,0.12)', border: '1px solid rgba(255,93,115,0.35)', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', color: '#ff5d73', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── SIGN IN ── */}
                <AnimatePresence mode="wait">
                  {mode === 'signin' && (
                    <motion.form key="signin-desk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                      onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>USERNAME OR EMAIL</span>
                          <input className="modern-input" style={desktopUnderlineInput} placeholder="your_username" value={signIn.login} onChange={e => setSignIn({ ...signIn, login: e.target.value })} required />
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', position: 'relative' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>PASSWORD</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input className="modern-input" type={showPass ? 'text' : 'password'} style={{ ...desktopUnderlineInput, flex: 1 }} placeholder="••••••••" value={signIn.password} onChange={e => setSignIn({ ...signIn, password: e.target.value })} required />
                            <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <button type="submit" style={{ marginTop: '8px', background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)', color: 'white', fontSize: '1rem', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif' " }}>
                        {loading ? 'SIGNING IN...' : <>BOARD THE FLIGHT <ArrowRight size={20} /></>}
                      </button>
                    </motion.form>
                  )}

                  {/* ── SIGN UP ── */}
                  {mode === 'signup' && (
                    <motion.form key="signup-desk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                      onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>USERNAME</span>
                          <input className="modern-input" style={desktopUnderlineInput} placeholder="traveller_name" value={signUp.username} onChange={e => setSignUp({ ...signUp, username: e.target.value })} required />
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>EMAIL</span>
                          <input className="modern-input" type="email" style={desktopUnderlineInput} placeholder="you@company.com" value={signUp.email} onChange={e => setSignUp({ ...signUp, email: e.target.value })} required />
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>COMPANY</span>
                          <input className="modern-input" style={desktopUnderlineInput} placeholder="Company Name" value={signUp.company} onChange={e => setSignUp({ ...signUp, company: e.target.value })} required />
                        </div>
                        <div style={{ paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>PASSWORD</span>
                          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                            <input className="modern-input" type={showPass ? 'text' : 'password'} style={{ ...desktopUnderlineInput, flex: 1 }} placeholder="strong password" value={signUp.password} onChange={e => setSignUp({ ...signUp, password: e.target.value })} required />
                            <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {signUp.password && (
                            <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <StrengthMeter password={signUp.password} />
                            </div>
                          )}
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', gridColumn: '1 / -1' }}>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>CONFIRM PASSWORD</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input className="modern-input" type={showConfirm ? 'text' : 'password'} style={{ ...desktopUnderlineInput, flex: 1 }} placeholder="re-enter password" value={signUp.confirm} onChange={e => setSignUp({ ...signUp, confirm: e.target.value })} required />
                            <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <button type="submit" style={{ marginTop: '4px', background: loading ? 'rgba(255,183,3,0.2)' : 'rgba(255,183,3,0.15)', color: '#ffb703', fontSize: '1rem', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,183,3,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                        {loading ? 'CREATING ACCOUNT...' : <>CREATE ACCOUNT <ArrowRight size={20} /></>}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── RIGHT STUB ── */}
              <motion.div className="glass-panel"
                animate={isCutting ? { x: [0, 20, 100], y: [0, 40, 800], rotate: [0, 15, 60], scale: [1, 0.95, 0.8], opacity: [1, 1, 0], transition: { delay: 0.8, duration: 2, ease: 'anticipate' } } : {}}
                style={{ flex: '1', padding: '32px 24px', background: 'rgba(255,255,255,0.05)', borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.35, letterSpacing: '4px', fontFamily: "'DM Sans', sans-serif" }}>STUB // TURBO-24</span>
                  <div style={{ border: '2px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>SEAT</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>SA-07</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', gap: '2px', height: '36px', opacity: 0.4 }}>
                    {[...Array(18)].map((_, i) => (
                      <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, background: 'white' }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif" }}>STATUS</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#4ade80', fontFamily: "'DM Sans', sans-serif" }}>{mode === 'signup' ? 'REGISTERING' : 'VALIDATED'}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
