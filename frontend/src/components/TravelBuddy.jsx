import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, MapPin, Calendar, Briefcase, PlusCircle, Search, Users, CheckCircle, XCircle, Send, MessageSquare, Compass, ArrowRight, Ticket, Plane, Globe, Trash2, Mic, MicOff, FileText } from 'lucide-react';
import { getUserAuthHeader } from '../utils/auth';

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const show = (msg, type = 'success') => {
    clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

export default function TravelBuddy({ user, onXpGain, initialView }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState(initialView || 'feed'); // 'feed', 'list', 'my_trips', 'contribute'
  const [trips, setTrips] = useState([]);
  const [myTrips, setMyTrips] = useState({ created: [], requested: [] });
  const { toast, show: showToast } = useToast();

  // Contribution state
  const [itineraryText, setItineraryText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);
  
  // List Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('under 2000 rupees');
  const [days, setDays] = useState('2 day');
  const [date, setDate] = useState('');
  
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const chatContainerRef = React.useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // When a chat is opened, clear previous session messages and start polling
  useEffect(() => {
    let interval;
    let isSubscribed = true;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/buddy/trips/${activeChat._id}/chat`);
        if (isSubscribed) setMessages(res.data);
      } catch (err) {}
    };

    if (activeChat) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      fetchMessages();
      interval = setInterval(fetchMessages, 1000); // 1s aggressive polling
    }
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeChat]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !activeChat) return;
    const newMsg = { senderUid: user.uid, senderName: user.name, text: chatMessage };
    
    // Optimistic UI update
    setMessages(prev => [...prev, { ...newMsg, timestamp: new Date() }]);
    setChatMessage('');
    
    try {
      await axios.post(`/api/buddy/trips/${activeChat._id}/chat`, newMsg, { headers: getUserAuthHeader() });
    } catch (err) {
      showToast('Failed to send message', 'error');
    }
  };

  // Feed Search State
  const [searchOrigin, setSearchOrigin] = useState('');
  
  const fetchTrips = async () => {
    try {
      const res = await axios.get(`/api/buddy/trips?uid=${user.uid || ''}${searchOrigin ? `&origin=${encodeURIComponent(searchOrigin)}` : ''}`);
      setTrips(res.data);
    } catch (err) {}
  };

  const fetchMyTrips = async () => {
    try {
      const res = await axios.get(`/api/buddy/my-trips?uid=${user.uid || ''}`, { headers: getUserAuthHeader() });
      setMyTrips(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (view === 'feed') fetchTrips();
    if (view === 'my_trips') fetchMyTrips();
  }, [view]);

  const handleListTrip = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/buddy/trips', {
        creatorName: user.name,
        creatorCompany: user.company,
        origin, destination, budget, days, date
      }, { headers: getUserAuthHeader() });
      showToast('Trip listed! +5 XP earned', 'success');
      if (onXpGain) onXpGain(5);
      setView('feed');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error listing trip', 'error');
    }
  };

  const handleRequestMatch = async (tripId) => {
    try {
      await axios.post(`/api/buddy/trips/${tripId}/match`, {
        requesterName: user.name,
        requesterCompany: user.company
      }, { headers: getUserAuthHeader() });
      showToast('Match request sent!', 'success');
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error sending request', 'error');
    }
  };

  const handleAcceptMatch = async (tripId, acceptedUid) => {
    try {
      await axios.post(`/api/buddy/trips/${tripId}/accept-match`, { acceptedUid }, { headers: getUserAuthHeader() });
      showToast('Trip started! Both parties gained +15 XP 🎉', 'success');
      if (onXpGain) onXpGain(15);
      fetchMyTrips();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error accepting match', 'error');
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice input not supported in this browser', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setItineraryText(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleContributionSubmit = async () => {
    if (!itineraryText.trim()) { showToast('Please describe your trip first', 'error'); return; }
    setIsSubmittingContrib(true);
    try {
      await axios.post('/api/buddy/contribute', { userName: user.name, text: itineraryText }, { headers: getUserAuthHeader() });
      setItineraryText('');
      showToast('Contribution received! Our team will review your blueprint.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit', 'error');
    }
    setIsSubmittingContrib(false);
  };

  const handleDeleteTrip = async (id) => {
    try {
      await axios.delete(`/api/buddy/trips/${id}`, { headers: getUserAuthHeader() });
      showToast('Trip deleted', 'success');
      setConfirmDeleteId(null);
      await fetchTrips();
      await fetchMyTrips();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error deleting trip', 'error');
      setConfirmDeleteId(null);
    }
  };

  const ToastUI = () => toast ? createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ position: 'fixed', bottom: isMobile ? '86px' : '32px',
          left: '16px', right: '16px', margin: '0 auto',
          width: 'fit-content', maxWidth: 'calc(100vw - 32px)',
          zIndex: 99999, padding: '13px 22px', borderRadius: '16px',
          fontWeight: 800, fontSize: '0.88rem',
          background: toast.type === 'error' ? '#e63946' : '#1b4332',
          color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          textAlign: 'center' }}>
        {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  if (activeChat) {
    return (
      <div style={{ position: 'relative' }}>
      <ToastUI />
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '30px', borderRadius: '30px', background: 'rgba(20, 35, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="glass-btn" onClick={() => setActiveChat(null)} style={{ padding: '8px 16px', marginBottom: '20px', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
          ← CLOSE CHAT
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <MessageSquare size={30} color="#ffb703" />
          <div>
            <div style={{ color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>CHAT</div>
            <h3 style={{ color: 'white', margin: 0, fontFamily: "'Bebas Neue', cursive" }}>CHATTING ABOUT: {activeChat.destination}</h3>
          </div>
        </div>
        
        <div ref={chatContainerRef} style={{ height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(216, 243, 220, 0.1)' }}>
           <div style={{ alignSelf: 'center', background: 'rgba(255,183,3,0.1)', color: '#ffb703', padding: '8px 16px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>Chat started — say hi!</div>
           
           {messages.map((msg, idx) => {
             const isMe = msg.senderUid === user.uid;
             return (
               <div key={idx} style={{ 
                 alignSelf: isMe ? 'flex-end' : 'flex-start', 
                 background: isMe ? '#ffb703' : 'rgba(255,255,255,0.05)', 
                 color: isMe ? '#081c15' : 'white',
                 padding: '10px 15px', 
                 borderRadius: '15px', 
                 borderTopRightRadius: isMe ? 0 : '15px',
                 borderTopLeftRadius: isMe ? '15px' : 0,
                 maxWidth: '80%'
               }}>
                 {!isMe && <div style={{ fontSize: '0.6rem', color: '#ffb703', marginBottom: '4px', fontWeight: 900 }}>{msg.senderName?.toUpperCase()}</div>}
                 <div style={{ fontSize: '0.9rem' }}>{msg.text}</div>
                 <div style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: '5px', textAlign: 'right' }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : msg.time}</div>
               </div>
             );
           })}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <input 
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..." 
            style={{ flex: 1, padding: '15px 20px', borderRadius: '50px', border: '1px solid rgba(216, 243, 220, 0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button 
            onClick={handleSendMessage}
            className="glass-btn" style={{ padding: '0 25px', borderRadius: '50px', background: '#ffb703', color: '#081c15', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>
             SEND <Send size={16} />
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1000px', padding: isMobile ? '16px 12px' : '20px', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <ToastUI />
      {/* Navigation Headers */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { id: 'feed', label: 'EXPLORE TRIPS', icon: <Globe size={18} /> },
          { id: 'list', label: 'LIST A TRIP', icon: <Ticket size={18} /> },
          { id: 'my_trips', label: 'MY TRIPS', icon: <Compass size={18} /> },
          { id: 'contribute', label: 'CONTRIBUTE TRIP', icon: <FileText size={18} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            style={{
              padding: isMobile ? '10px 18px' : '12px 30px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: view === tab.id ? 'linear-gradient(135deg, #ffb703, #ff8c00)' : 'rgba(255,255,255,0.05)',
              color: view === tab.id ? '#081c15' : 'white',
              border: '1px solid', borderColor: view === tab.id ? 'transparent' : 'rgba(255,255,255,0.1)',
              fontWeight: 900, transition: 'all 0.3s ease', cursor: 'pointer',
              boxShadow: view === tab.id ? '0 10px 20px rgba(255,183,3,0.3)' : 'none',
              letterSpacing: '1px', fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontFamily: "'DM Sans', sans-serif"
            }}>
            {React.cloneElement(tab.icon, { color: view === tab.id ? '#081c15' : '#ffb703', size: isMobile ? 14 : 18 })}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.98 }} transition={{ duration: 0.4 }}>
          
          {view === 'list' && (
            <form onSubmit={handleListTrip} style={{ margin: '0 auto', maxWidth: '800px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', background: 'rgba(255,255,255,0.95)', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              {/* Left panel */}
              <div style={{ flex: isMobile ? 'none' : '0 0 250px', background: 'linear-gradient(135deg, #081c15, #1b4332)', padding: isMobile ? '24px 28px' : '40px', color: 'white', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? '16px' : '0', justifyContent: 'center', position: 'relative' }}>
                 <PlaneTakeoff size={isMobile ? 32 : 50} color="#ffb703" style={{ marginBottom: isMobile ? 0 : '20px' }} />
                 <div>
                   <h2 style={{ fontSize: isMobile ? '1.3rem' : '2rem', fontWeight: 900, lineHeight: 1.1, margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>TRIP<br/>PLANNER</h2>
                   <p style={{ opacity: 0.7, fontSize: '0.8rem', marginTop: '6px', marginBottom: 0, fontFamily: "'DM Sans', sans-serif" }}>Create a new trip listing</p>
                 </div>
                 {!isMobile && <div style={{ marginTop: 'auto', fontSize: '2rem', letterSpacing: '4px', opacity: 0.3, fontWeight: 900, transform: 'rotate(-90deg)', transformOrigin: 'left bottom', position: 'absolute', bottom: 40, left: 20 }}>ITINERARY</div>}
              </div>

              {/* Right Side: Inputs */}
              <div style={{ flex: 1, padding: isMobile ? '24px' : '40px', position: 'relative', background: 'rgba(255,255,255,0.95)' }}>
                {!isMobile && <div style={{ position: 'absolute', left: '-10px', top: '0', bottom: '0', width: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0' }}>
                   {[...Array(15)].map((_, i) => <div key={i} style={{ width: '6px', height: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}/>)}
                </div>}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '25px', marginBottom: '40px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#081c15', fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>STARTING CITY</label>
                    <input required value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid rgba(8,28,21,0.1)', background: 'transparent', color: '#081c15', fontSize: '1.1rem', fontWeight: 900, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#081c15', fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>DESTINATION CITY</label>
                    <input required value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Goa" style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid rgba(8,28,21,0.1)', background: 'transparent', color: '#081c15', fontSize: '1.1rem', fontWeight: 900, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#081c15', fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>YOUR BUDGET</label>
                    <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid rgba(8,28,21,0.1)', background: 'transparent', color: '#081c15', fontSize: '1rem', fontWeight: 900, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                      <option>under 1000 rupees</option><option>under 2000 rupees</option><option>under 5000 rupees</option><option>over 5000 rupees</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#081c15', fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>TRIP LENGTH</label>
                    <select value={days} onChange={e => setDays(e.target.value)} style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid rgba(8,28,21,0.1)', background: 'transparent', color: '#081c15', fontSize: '1rem', fontWeight: 900, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                      <option>1 day</option><option>2 day</option><option>3 day</option><option>3+ days</option>
                    </select>
                  </div>
                  {/* gridColumn span 2 only on desktop — on mobile it would force an implicit 2nd column */}
                  <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                    <label style={{ display: 'block', color: '#081c15', fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>TRIP DATE</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid rgba(8,28,21,0.1)', background: 'transparent', color: '#081c15', fontSize: '1rem', fontWeight: 900, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                  </div>
                </div>
                
                <button type="submit" className="glass-btn" style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #ffb703, #ff8c00)', color: '#081c15', border: 'none', borderRadius: '15px', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(255,183,3,0.4)', transition: 'all 0.3s', fontFamily: "'DM Sans', sans-serif" }}>
                  <Plane size={24} /> POST This Trip
                </button>
              </div>
            </form>
          )}

          {view === 'feed' && (
            <div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '30px', alignItems: isMobile ? 'stretch' : 'center' }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} color="#ffb703" style={{ position: 'absolute', top: '16px', left: '20px' }} />
                    <input
                      value={searchOrigin}
                      onChange={e => setSearchOrigin(e.target.value)}
                      placeholder="Search by starting point... (e.g. Mumbai)"
                      style={{ width: '100%', padding: '16px 20px 16px 50px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '20px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                    />
                 </div>
                 <button onClick={fetchTrips} className="glass-btn" style={{ padding: '16px 30px', background: '#ffb703', color: '#081c15', borderRadius: '20px', border: 'none', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    SEARCH
                 </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? '16px' : '30px' }}>
                {trips.length === 0 && <div style={{ color: 'white', opacity: 0.5, textAlign: 'center', width: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" }}>No trips found. Try a different city or post your own!</div>}
              {trips.map(trip => {
                const requested = trip.matches?.some(m => m.requesterUid === user.uid);
                const shortOrig = trip.origin.substring(0,3).toUpperCase();
                const shortDest = trip.destination.substring(0,3).toUpperCase();
                return (
                <div key={trip._id} className="ticket-card" style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'transform 0.2s', position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                  {/* Left Main Ticket Panel */}
                  <div style={{ flex: 1, padding: isMobile ? '18px 16px' : '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <div style={{ color: '#081c15', fontWeight: 900, letterSpacing: '2px', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif" }}>POSTED BY</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffb703', fontWeight: 900, background: 'rgba(255,183,3,0.1)', padding: '4px 10px', borderRadius: '50px', fontSize: '0.65rem' }}>
                            <CheckCircle size={12}/> VERIFIED
                          </div>
                       </div>
                       <div style={{ fontSize: '1.1rem', color: '#081c15', fontWeight: 900, marginBottom: '25px', fontFamily: "'DM Sans', sans-serif" }}>{trip.creatorName.toUpperCase()}</div>
                       
                       {/* Trip Route UI */}
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                          <div style={{ textAlign: 'left' }}>
                             <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, color: '#081c15', lineHeight: 1 }}>{shortOrig}</div>
                             <div style={{ fontSize: '0.65rem', color: 'rgba(8,28,21,0.5)', fontWeight: 900, marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>{trip.origin}</div>
                          </div>
                          <Plane color="#ffb703" size={isMobile ? 22 : 30} style={{ opacity: 0.8 }} />
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, color: '#081c15', lineHeight: 1 }}>{shortDest}</div>
                             <div style={{ fontSize: '0.65rem', color: 'rgba(8,28,21,0.5)', fontWeight: 900, marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>{trip.destination}</div>
                          </div>
                       </div>
                     </div>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '2px solid rgba(8,28,21,0.1)', paddingTop: '15px' }}>
                        <div style={{ minWidth: 0 }}>
                           <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.5)', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>DATE</div>
                           <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#081c15', fontWeight: 900, fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-all' }}>{new Date(trip.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ minWidth: 0, textAlign: 'right' }}>
                           <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.5)', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>CLASS</div>
                           <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#081c15', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>{trip.budget}</div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Right Stub Line separator */}
                  <div style={{ width: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffb703', position: 'relative' }}>
                     <div style={{ position: 'absolute', top: -10, width: 20, height: 20, borderRadius: '50%', background: '#081c15' }} />
                     <div style={{ position: 'absolute', bottom: -10, width: 20, height: 20, borderRadius: '50%', background: '#081c15' }} />
                     <div style={{ borderLeft: '3px dashed rgba(8,28,21,0.2)', height: '80%' }} />
                  </div>
                  
                  {/* Right Stub Buttons */}
                  <div style={{ width: isMobile ? '72px' : '120px', background: '#ffb703', padding: isMobile ? '10px 8px' : '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', alignItems: 'center', overflow: 'hidden' }}>
                     {!isMobile && <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '4px', color: 'rgba(8,28,21,0.5)', marginBottom: '40px' }}>TRIP</div>}
                     <button
                        onClick={() => handleRequestMatch(trip._id)}
                        disabled={requested}
                        style={{ width: isMobile ? '42px' : '50px', height: isMobile ? '42px' : '50px', borderRadius: '50%', background: requested ? 'rgba(8,28,21,0.1)' : '#081c15', color: requested ? '#081c15' : '#ffb703', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: requested ? 'none' : '0 10px 15px rgba(0,0,0,0.2)', transition: 'all 0.2s', flexShrink: 0 }}
                     >
                        {requested ? <CheckCircle size={isMobile ? 20 : 24}/> : <PlusCircle size={isMobile ? 20 : 24}/>}
                     </button>
                     <div style={{ fontSize: isMobile ? '0.5rem' : '0.6rem', fontWeight: 900, textAlign: 'center', color: '#081c15', letterSpacing: isMobile ? '0' : '1px' }}>{requested ? 'PENDING' : 'JOIN'}</div>
                  </div>
                </div>
              )})}
            </div>
          </div>
          )}

          {view === 'my_trips' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? '24px' : '40px' }}>
               {/* Created Trips */}
               <div>
                  <h3 className="title" style={{ color: 'white', fontSize: '1.8rem', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 20px', fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}><Plane color="#ffb703" size={22}/> TRIPS I POSTED</h3>
                  {myTrips.created.length === 0 && <div style={{ color: 'white', opacity: 0.5, marginTop: '20px' }}>You haven't posted any trips yet.</div>}
                  {myTrips.created.map(trip => {
                    const hasAccepted = trip.matches.some(m => m.status === 'accepted');
                    return (
                    <div key={trip._id} style={{ padding: '20px', borderRadius: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.95)', borderLeft: hasAccepted ? '8px solid #ffb703' : '8px solid #081c15', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                       {/* Background logo */}
                       <Globe size={150} color="black" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }} />
                       
                       <div style={{ fontSize: '0.65rem', color: '#081c15', fontWeight: 900, opacity: 0.5, letterSpacing: '2px', marginBottom: '10px' }}>TRIP INFO</div>
                       
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: '1.4rem', color: '#081c15', fontWeight: 900 }}>{trip.origin} <ArrowRight size={14} style={{ margin: '0 5px' }}/> {trip.destination}</div>
                         {confirmDeleteId === trip._id ? (
                           <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                             <button onClick={() => handleDeleteTrip(trip._id)} style={{ background: '#9e2a2b', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '1px' }}>DELETE</button>
                             <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'rgba(8,28,21,0.08)', color: '#081c15', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer' }}>CANCEL</button>
                           </div>
                         ) : (
                           <button title="Delete Trip" onClick={() => setConfirmDeleteId(trip._id)} style={{ background: 'transparent', border: 'none', color: '#9e2a2b', cursor: 'pointer', padding: '5px' }}>
                             <Trash2 size={20} />
                           </button>
                         )}
                       </div>
                       <div style={{ fontSize: '0.7rem', color: hasAccepted ? '#ffb703' : 'rgba(8,28,21,0.5)', fontWeight: 900, marginBottom: '20px', padding: '4px 10px', background: hasAccepted ? 'rgba(255,183,3,0.1)' : 'rgba(8,28,21,0.05)', borderRadius: '50px', display: 'inline-block', marginTop: '10px' }}>{hasAccepted ? 'TRIP STARTED' : 'TRIP LISTED'}</div>
                       
                       {trip.matches.map(req => (
                         <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(8,28,21,0.05)', padding: '12px 15px', borderRadius: '10px', marginTop: '10px', border: '1px solid rgba(8,28,21,0.1)' }}>
                            <div style={{ color: '#081c15', fontSize: '0.9rem', fontWeight: 900 }}>REQUEST FROM: {req.requesterName}</div>
                            {req.status === 'pending' ? (
                              <button onClick={() => handleAcceptMatch(trip._id, req.requesterUid)} style={{ background: '#ffb703', color: '#081c15', padding: '6px 15px', borderRadius: '50px', border: 'none', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 5px 10px rgba(255,183,3,0.3)' }}>ACCEPT</button>
                            ) : (
                              <div style={{ color: '#1b4332', fontSize: '0.7rem', fontWeight: 900 }}>{req.status.toUpperCase()}</div>
                            )}
                         </div>
                       ))}
                       <button onClick={() => setActiveChat(trip)} style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#081c15', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#ffb703', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                         <MessageSquare size={16}/> OPEN CHAT
                       </button>
                    </div>
                  )})}
               </div>

               {/* Requested Trips */}
               <div>
                  <h3 className="title" style={{ color: 'white', fontSize: '1.8rem', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 20px', fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}><Ticket color="#d8f3dc" size={22}/> TRIPS I JOINED</h3>
                  {myTrips.requested.length === 0 && <div style={{ color: 'white', opacity: 0.5, marginTop: '20px' }}>You haven't joined any trips yet.</div>}
                  {myTrips.requested.map(trip => {
                    const myReq = trip.matches.find(m => m.requesterUid === user.uid) || {};
                    const isAccepted = myReq.status === 'accepted';
                    return (
                    <div key={trip._id} style={{ padding: '20px', borderRadius: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.95)', borderLeft: isAccepted ? '8px solid #d8f3dc' : '8px solid #ffb703', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                       {/* Background logo */}
                       <Globe size={150} color="black" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }} />
                       
                       <div style={{ fontSize: '0.65rem', color: '#081c15', fontWeight: 900, opacity: 0.5, letterSpacing: '2px', marginBottom: '10px' }}>POSTED BY: {trip.creatorName.toUpperCase()}</div>
                       
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: '1.4rem', color: '#081c15', fontWeight: 900 }}>{trip.origin} <ArrowRight size={14} style={{ margin: '0 5px' }}/> {trip.destination}</div>
                       </div>
                       
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, color: isAccepted ? '#1b4332' : '#ffb703', marginTop: '15px' }}>
                          {isAccepted ? <CheckCircle size={14}/> : <Search size={14}/>} STATUS: {myReq.status?.toUpperCase()}
                       </div>
                       
                       {isAccepted && (
                         <button onClick={() => setActiveChat(trip)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#081c15', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#ffb703', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                           <MessageSquare size={16}/> OPEN CHAT
                         </button>
                       )}
                    </div>
                  )})}
               </div>
            </div>
          )}
          {view === 'contribute' && (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', padding: '8px 20px', borderRadius: '50px', marginBottom: '20px' }}>
                  <FileText size={14} color="#ffb703" />
                  <span style={{ color: '#ffb703', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '3px' }}>COMMUNITY BLUEPRINT</span>
                </div>
                <h2 style={{ color: 'white', fontFamily: "'Bebas Neue', cursive", fontSize: '3rem', margin: 0, letterSpacing: '3px' }}>CONTRIBUTE A TRIP</h2>
                <p style={{ color: 'rgba(216,243,220,0.5)', fontSize: '0.85rem', marginTop: '10px', fontFamily: "'DM Sans', sans-serif" }}>Share your travel experience. Our AI will transform it into an interactive itinerary.</p>
              </div>

              {/* Text area + mic */}
              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '30px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ color: 'rgba(216,243,220,0.6)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>YOUR RAW ITINERARY</span>
                  <button
                    onClick={startListening}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                      background: isListening ? 'rgba(255,59,59,0.2)' : 'rgba(255,183,3,0.15)',
                      color: isListening ? '#ff3b3b' : '#ffb703',
                      fontWeight: 900, fontSize: '0.7rem', letterSpacing: '1px',
                      transition: 'all 0.3s',
                      boxShadow: isListening ? '0 0 20px rgba(255,59,59,0.4)' : 'none',
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? 'LISTENING...' : 'NEURAL MIC'}
                  </button>
                </div>
                <textarea
                  value={itineraryText}
                  onChange={e => setItineraryText(e.target.value)}
                  placeholder={`Describe your trip in your own words...\n\nExample: "Went to Manali for 3 days, stayed at Old Manali. Day 1 arrived and explored the mall road. Day 2 visited Jogini Falls and Solang Valley. Budget was around 8000 rupees total..."`}
                  style={{
                    width: '100%', minHeight: '200px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
                    padding: '20px', color: 'white', fontSize: '0.9rem', lineHeight: 1.7,
                    outline: 'none', resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
                {isListening && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i}
                        animate={{ scaleY: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                        style={{ width: '4px', height: '20px', background: '#ff3b3b', borderRadius: '2px' }}
                      />
                    ))}
                    <span style={{ color: '#ff3b3b', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>RECORDING VOICE...</span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleContributionSubmit}
                disabled={isSubmittingContrib || !itineraryText.trim()}
                style={{
                  width: '100%', padding: '20px',
                  background: isSubmittingContrib || !itineraryText.trim()
                    ? 'rgba(255,183,3,0.3)'
                    : 'linear-gradient(135deg, #ffb703, #ff8c00)',
                  color: '#081c15', border: 'none', borderRadius: '16px',
                  fontWeight: 900, fontSize: '1rem', letterSpacing: '2px',
                  cursor: isSubmittingContrib || !itineraryText.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  boxShadow: itineraryText.trim() ? '0 10px 30px rgba(255,183,3,0.35)' : 'none',
                  transition: 'all 0.3s', fontFamily: "'DM Sans', sans-serif"
                }}
              >
                <Send size={20} />
                {isSubmittingContrib ? 'TRANSMITTING...' : 'SUBMIT CONTRIBUTION'}
              </button>

              <p style={{ textAlign: 'center', color: 'rgba(216,243,220,0.3)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', marginTop: '20px', fontFamily: "'DM Sans', sans-serif" }}>
                YOUR BLUEPRINT WILL BE REVIEWED BY ADMIN AND DEPLOYED TO THE PLATFORM
              </p>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
