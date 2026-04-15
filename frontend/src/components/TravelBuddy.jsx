import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, MapPin, Calendar, Briefcase, PlusCircle, Search, Users, CheckCircle, XCircle, Send, MessageSquare, Compass, ArrowRight } from 'lucide-react';

export default function TravelBuddy({ user, onXpGain }) {
  const [view, setView] = useState('feed'); // 'feed', 'list', 'my_trips'
  const [trips, setTrips] = useState([]);
  const [myTrips, setMyTrips] = useState({ created: [], requested: [] });
  
  // List Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('under 2000 rupees');
  const [days, setDays] = useState('2 day');
  const [date, setDate] = useState('');
  
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = React.useRef(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !activeChat) return;
    const newMsg = { senderUid: user.uid, senderName: user.name, text: chatMessage };
    
    // Optimistic UI update
    setMessages(prev => [...prev, { ...newMsg, timestamp: new Date() }]);
    setChatMessage('');
    
    try {
      await axios.post(`/api/buddy/trips/${activeChat._id}/chat`, newMsg);
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  // Feed Search State
  const [searchOrigin, setSearchOrigin] = useState('');
  
  const fetchTrips = async () => {
    try {
      const res = await axios.get(`/api/buddy/trips?uid=${user.uid || ''}${searchOrigin ? `&origin=${encodeURIComponent(searchOrigin)}` : ''}`);
      setTrips(res.data);
    } catch (err) { }
  };

  const fetchMyTrips = async () => {
    try {
      const res = await axios.get(`/api/buddy/my-trips?uid=${user.uid || ''}`);
      setMyTrips(res.data);
    } catch (err) { }
  };

  useEffect(() => {
    if (view === 'feed') fetchTrips();
    if (view === 'my_trips') fetchMyTrips();
  }, [view]);

  const handleListTrip = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/buddy/trips', {
        creatorUid: user.uid || 'anon',
        creatorName: user.name,
        creatorCompany: user.company,
        origin, destination, budget, days, date
      });
      alert('Trip listed successfully!');
      if (onXpGain) onXpGain(5); // Reward 5 XP for listing
      setView('feed');
    } catch (err) {
      alert('Error listing trip');
    }
  };

  const handleRequestMatch = async (tripId) => {
    try {
      await axios.post(`/api/buddy/trips/${tripId}/match`, {
        requesterUid: user.uid || 'anon',
        requesterName: user.name,
        requesterCompany: user.company
      });
      alert('Request Sent!');
      fetchTrips();
    } catch (err) {
      alert('Error sending request: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAcceptMatch = async (tripId, acceptedUid) => {
    try {
      await axios.post(`/api/buddy/trips/${tripId}/accept-match`, { acceptedUid });
      alert('Trip Started! Both parties gained 15 XP.');
      if (onXpGain) onXpGain(15);
      fetchMyTrips();
    } catch (err) {
      alert('Error accepting match: ' + (err.response?.data?.error || err.message));
    }
  };

  if (activeChat) {
    return (
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '30px', borderRadius: '30px', background: 'rgba(20, 35, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="glass-btn" onClick={() => setActiveChat(null)} style={{ padding: '8px 16px', marginBottom: '20px', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
          ← CLOSE CHAT
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <MessageSquare size={30} color="#ffb703" />
          <div>
            <div style={{ color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>LIVE CHAT</div>
            <h3 style={{ color: 'white', margin: 0 }}>TRIP: {activeChat.destination}</h3>
          </div>
        </div>
        
        <div style={{ height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(216, 243, 220, 0.1)' }}>
           <div style={{ alignSelf: 'center', background: 'rgba(255,183,3,0.1)', color: '#ffb703', padding: '8px 16px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>CHAT STARTED</div>
           
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
           <div ref={messagesEndRef} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <input 
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..." 
            style={{ flex: 1, padding: '15px 20px', borderRadius: '50px', border: '1px solid rgba(216, 243, 220, 0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none' }} 
          />
          <button 
            onClick={handleSendMessage}
            className="glass-btn" style={{ padding: '0 25px', borderRadius: '50px', background: '#ffb703', color: '#081c15', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900 }}>
             SEND <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1000px', padding: '20px' }}>
      {/* Navigation Headers */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px' }}>
        {[
          { id: 'feed', label: 'TRIP FEED', icon: <Search size={16} /> },
          { id: 'list', label: 'LIST A TRIP', icon: <PlusCircle size={16} /> },
          { id: 'my_trips', label: 'MY TRIPS', icon: <Compass size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className="glass-btn"
            style={{
              padding: '12px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px',
              background: view === tab.id ? '#ffb703' : 'rgba(255,255,255,0.05)',
              color: view === tab.id ? '#081c15' : 'white',
              border: '1px solid', borderColor: view === tab.id ? '#ffb703' : 'rgba(255,255,255,0.1)',
              fontWeight: 900, transition: 'all 0.3s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          
          {view === 'list' && (
            <form onSubmit={handleListTrip} className="glass-panel" style={{ padding: '40px', borderRadius: '30px', background: 'rgba(20, 35, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="title" style={{ color: 'white', marginBottom: '30px', fontSize: '1.8rem' }}>CREATE NEW TRIP</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>STARTING POINT</label>
                  <input required value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>DESTINATION</label>
                  <input required value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Goa" style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>BUDGET</label>
                  <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                    <option>under 1000 rupees</option><option>under 2000 rupees</option><option>under 5000 rupees</option><option>over 5000 rupees</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>DURATION</label>
                  <select value={days} onChange={e => setDays(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                    <option>1 day</option><option>2 day</option><option>3 day</option><option>3+ days</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, marginBottom: '10px' }}>TRIP DATE</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                </div>
              </div>
              
              <button type="submit" className="glass-btn" style={{ width: '100%', padding: '18px', background: '#d8f3dc', color: '#081c15', border: 'none', borderRadius: '15px', fontWeight: 900, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <PlaneTakeoff size={20} /> LIST TRIP
              </button>
            </form>
          )}

          {view === 'feed' && (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} color="#ffb703" style={{ position: 'absolute', top: '16px', left: '20px' }} />
                    <input 
                      value={searchOrigin} 
                      onChange={e => setSearchOrigin(e.target.value)} 
                      placeholder="Search trips by starting point... (e.g. Mumbai)"
                      style={{ width: '100%', padding: '16px 20px 16px 50px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '20px', color: 'white', outline: 'none' }}
                    />
                 </div>
                 <button onClick={fetchTrips} className="glass-btn" style={{ padding: '16px 30px', background: '#ffb703', color: '#081c15', borderRadius: '20px', border: 'none', fontWeight: 900 }}>
                    SEARCH TRIPS
                 </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
                {trips.length === 0 && <div style={{ color: 'white', opacity: 0.5 }}>No trips found...</div>}
              {trips.map(trip => {
                const requested = trip.matches?.some(m => m.requesterUid === user.uid);
                return (
                <div key={trip._id} className="glass-panel" style={{ padding: '25px', borderRadius: '25px', background: 'rgba(20, 35, 30, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.6rem', color: '#ffb703', fontWeight: 900, letterSpacing: '2px', marginBottom: '15px' }}>HOST: {trip.creatorName.toUpperCase()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', marginBottom: '20px' }}>
                    <div style={{ flex: 1, fontSize: '1.2rem', fontWeight: 900 }}>{trip.origin}</div>
                    <ArrowRight size={16} color="#d8f3dc" />
                    <div style={{ flex: 1, fontSize: '1.2rem', fontWeight: 900, textAlign: 'right' }}>{trip.destination}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(216, 243, 220, 0.6)', fontSize: '0.75rem' }}><Calendar size={14}/> {new Date(trip.date).toLocaleDateString()}</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(216, 243, 220, 0.6)', fontSize: '0.75rem' }}><Briefcase size={14}/> {trip.budget}</div>
                  </div>
                  
                  <button 
                    onClick={() => handleRequestMatch(trip._id)}
                    disabled={requested}
                    className="glass-btn" 
                    style={{ width: '100%', padding: '12px', background: requested ? 'rgba(255,255,255,0.1)' : '#ffb703', color: requested ? 'white' : '#081c15', border: 'none', borderRadius: '12px', fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    {requested ? <><CheckCircle size={16}/> REQUEST PENDING</> : <><Search size={16}/> REQUEST TO JOIN</>}
                  </button>
                </div>
              )})}
            </div>
          </div>
          )}

          {view === 'my_trips' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
               {/* Created Trips */}
               <div>
                  <h3 className="title" style={{ color: 'white', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>MY LISTED TRIPS</h3>
                  {myTrips.created.map(trip => (
                    <div key={trip._id} className="glass-panel" style={{ padding: '20px', borderRadius: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', border: trip.status === 'started' ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.1)' }}>
                       <div style={{ color: 'white', fontWeight: 900, marginBottom: '5px' }}>{trip.destination}</div>
                       <div style={{ fontSize: '0.7rem', color: '#ffb703', marginBottom: '15px' }}>STATE: {trip.status.toUpperCase()}</div>
                       
                       {trip.status === 'listed' && trip.matches.map(req => (
                         <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', marginTop: '10px' }}>
                            <div style={{ color: 'white', fontSize: '0.8rem' }}>{req.requesterName}</div>
                            {req.status === 'pending' ? (
                              <button onClick={() => handleAcceptMatch(trip._id, req.requesterUid)} style={{ background: '#d8f3dc', color: '#081c15', padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>ACCEPT</button>
                            ) : (
                              <div style={{ color: '#ffb703', fontSize: '0.7rem', fontWeight: 900 }}>{req.status.toUpperCase()}</div>
                            )}
                         </div>
                       ))}
                       {trip.status === 'started' && (
                         <button onClick={() => setActiveChat(trip)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#ffb703', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#081c15', cursor: 'pointer' }}>OPEN CHAT</button>
                       )}
                    </div>
                  ))}
               </div>

               {/* Requested Trips */}
               <div>
                  <h3 className="title" style={{ color: 'white', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>MY JOIN REQUESTS</h3>
                  {myTrips.requested.map(trip => {
                    const myReq = trip.matches.find(m => m.requesterUid === user.uid) || {};
                    return (
                    <div key={trip._id} className="glass-panel" style={{ padding: '20px', borderRadius: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', border: myReq.status === 'accepted' ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.1)' }}>
                       <div style={{ color: 'white', fontWeight: 900, marginBottom: '5px' }}>{trip.destination} (Host: {trip.creatorName})</div>
                       <div style={{ fontSize: '0.7rem', color: myReq.status === 'accepted' ? '#ffb703' : 'white', opacity: myReq.status === 'accepted' ? 1 : 0.5 }}>STATUS: {myReq.status?.toUpperCase()}</div>
                       
                       {myReq.status === 'accepted' && (
                         <button onClick={() => setActiveChat(trip)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#ffb703', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#081c15', cursor: 'pointer' }}>OPEN CHAT</button>
                       )}
                    </div>
                  )})}
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
