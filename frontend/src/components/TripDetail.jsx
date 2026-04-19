import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, PlusCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { getUserAuthHeader } from '../utils/auth';

function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const trip = new Date(dateStr); trip.setHours(0,0,0,0);
  const diff = Math.round((trip - today) / 86400000);
  if (diff < 0)  return { label: 'DEPARTED', color: 'rgba(255,183,3,0.25)' };
  if (diff === 0) return { label: 'TODAY!',   color: '#22c55e' };
  if (diff === 1) return { label: 'TOMORROW', color: '#84cc16' };
  if (diff <= 7)  return { label: `${diff}D TO GO`, color: '#ffb703' };
  return           { label: `${diff} DAYS TO GO`, color: 'rgba(255,183,3,0.5)' };
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined]   = useState(false);
  const [error, setError]     = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('travel_user')); } catch { return null; } })();

  useEffect(() => {
    axios.get(`/api/buddy/trips/${id}`)
      .then(r => { setTrip(r.data); setLoading(false); })
      .catch(() => { setError('Trip not found or no longer available.'); setLoading(false); });
  }, [id]);

  const handleJoin = async () => {
    if (!user) { navigate('/?redirect=/trip/' + id); return; }
    setJoining(true);
    try {
      await axios.post(`/api/buddy/trips/${id}/match`,
        { requesterName: user.name, requesterCompany: user.company || '' },
        { headers: getUserAuthHeader() }
      );
      setJoined(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join trip.');
    }
    setJoining(false);
  };

  const spinStyle = `@keyframes spin { 100% { transform: rotate(360deg); } }`;

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: '#050e09', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{spinStyle}</style>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(212,175,55,0.12)', borderTopColor: '#d4af37', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error && !trip) return (
    <div style={{ position: 'fixed', inset: 0, background: '#050e09', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", color: 'white', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive", color: '#ffb703', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: '1rem', opacity: 0.5, marginBottom: '28px' }}>{error}</div>
      <button onClick={() => navigate('/')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #ffb703, #ff8c00)', color: '#081c15', border: 'none', borderRadius: '50px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>← GO HOME</button>
    </div>
  );

  const countdown  = getDaysUntil(trip.date);
  const shortOrig  = trip.origin.substring(0,3).toUpperCase();
  const shortDest  = trip.destination.substring(0,3).toUpperCase();
  const acceptedCount = trip.matches?.filter(m => m.status === 'accepted').length || 0;
  const maxSlots   = trip.maxBuddies || 3;
  const isFull     = acceptedCount >= maxSlots;
  const alreadyJoined = user && trip.matches?.some(m => m.requesterUid === user.uid);

  return (
    /* ── scroll wrapper: fills viewport, scrolls if needed ── */
    <div style={{ position: 'fixed', inset: 0, background: '#050e09', overflowY: 'auto' }}>
      <style>{spinStyle}</style>

      {/* ── inner: min-height fills scroll area, flex-centers content ── */}
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'DM Sans', sans-serif" }}>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Back button */}
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '18px', padding: 0 }}>
            <ArrowLeft size={13} /> BACK TO HOME
          </button>

          {/* Ticket card */}
          <div style={{ background: '#f7f5f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '22px 22px 0' }}>

              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ background: countdown.color, color: ['#22c55e','#84cc16'].includes(countdown.color) ? 'white' : '#081c15',
                  padding: '3px 10px', borderRadius: '50px', fontSize: '0.52rem', fontWeight: 900, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                  {countdown.label}
                </div>
                <div style={{ color: 'rgba(8,28,21,0.38)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  POSTED BY {trip.creatorName.toUpperCase()}
                </div>
              </div>

              {/* Route with strip line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '18px' }}>
                {/* Origin */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#081c15', lineHeight: 1, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>{shortOrig}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.45)', fontWeight: 700, marginTop: '2px' }}>{trip.origin}</div>
                </div>

                {/* Strip line + plane */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, height: '1.5px', background: 'repeating-linear-gradient(90deg, rgba(8,28,21,0.15) 0px, rgba(8,28,21,0.15) 6px, transparent 6px, transparent 12px)' }} />
                  <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: '#ffb703', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 4px', boxShadow: '0 4px 12px rgba(255,183,3,0.4)' }}>
                    <Plane size={16} color="#081c15" />
                  </div>
                  <div style={{ flex: 1, height: '1.5px', background: 'repeating-linear-gradient(90deg, rgba(8,28,21,0.15) 0px, rgba(8,28,21,0.15) 6px, transparent 6px, transparent 12px)' }} />
                </div>

                {/* Destination */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#081c15', lineHeight: 1, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>{shortDest}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.45)', fontWeight: 700, marginTop: '2px', textAlign: 'right' }}>{trip.destination}</div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px 0', borderTop: '1px solid rgba(8,28,21,0.08)', borderBottom: '1px solid rgba(8,28,21,0.08)', marginBottom: '16px' }}>
                {[
                  { label: 'DATE',     value: new Date(trip.date).toLocaleDateString('en-GB') },
                  { label: 'CLASS',    value: trip.budget },
                  { label: 'SEATS',    value: `${acceptedCount}/${maxSlots} filled` },
                  trip.days ? { label: 'DURATION', value: trip.days } : null,
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.52rem', color: 'rgba(8,28,21,0.35)', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#081c15' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {(trip.tags || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                  {trip.tags.map(tag => (
                    <span key={tag} style={{ padding: '3px 10px', borderRadius: '50px', background: 'rgba(255,183,3,0.12)', color: '#b07d00', fontSize: '0.58rem', fontWeight: 700 }}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && <div style={{ color: '#e63946', fontSize: '0.72rem', fontWeight: 700, marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

              {!user && (
                <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(8,28,21,0.35)', margin: '0 0 10px' }}>You'll be asked to log in first</p>
              )}
            </div>

            {/* CTA — full-bleed at card bottom */}
            <div style={{ margin: '0' }}>
              {joined || alreadyJoined ? (
                <div style={{ padding: '16px', background: '#1b4332', color: '#d8f3dc', borderRadius: '0 0 24px 24px', fontWeight: 900, fontSize: '0.88rem', letterSpacing: '1px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={17} /> REQUEST SENT
                </div>
              ) : isFull ? (
                <div style={{ padding: '16px', background: 'rgba(8,28,21,0.07)', color: 'rgba(8,28,21,0.35)', borderRadius: '0 0 24px 24px', fontWeight: 900, fontSize: '0.88rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <XCircle size={17} /> TRIP FULL
                </div>
              ) : (
                <button onClick={handleJoin} disabled={joining}
                  style={{ width: '100%', padding: '16px', background: joining ? 'rgba(255,183,3,0.35)' : 'linear-gradient(135deg, #ffb703, #ff8c00)', color: '#081c15', border: 'none', borderRadius: '0 0 24px 24px', fontWeight: 900, fontSize: '0.88rem', letterSpacing: '2px', cursor: joining ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: joining ? 'none' : '0 8px 20px rgba(255,183,3,0.3)' }}>
                  {joining
                    ? <><div style={{ width: '15px', height: '15px', border: '2px solid #081c15', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> JOINING...</>
                    : <><PlusCircle size={17} /> {user ? 'REQUEST TO JOIN' : 'LOGIN TO JOIN'}</>}
                </button>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', marginTop: '16px', letterSpacing: '1.5px' }}>LEAVEAPPROVED · TRAVEL BUDDY</p>
        </div>
      </div>
    </div>
  );
}
