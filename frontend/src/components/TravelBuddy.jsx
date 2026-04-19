import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, MapPin, Calendar, Briefcase, PlusCircle, Search, Users, CheckCircle, XCircle, Send, MessageSquare, Compass, ArrowRight, Ticket, Plane, Globe, Trash2, Mic, MicOff, FileText, Copy, Bookmark, Bell, User, Calculator, Star } from 'lucide-react';
import { getUserAuthHeader } from '../utils/auth';

function InfoTooltip({ text }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onClick={e => { e.stopPropagation(); setShow(s => !s); }}>
      <span style={{ width: '15px', height: '15px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.2)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.58rem', fontWeight: 900, cursor: 'help',
        color: 'rgba(0,0,0,0.45)', fontFamily: "'DM Sans', sans-serif" }}>i</span>
      {show && (() => {
        const mobile = window.innerWidth <= 768;
        return mobile ? (
          <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(4,12,8,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,183,3,0.2)', borderRadius: '12px',
            padding: '10px 14px', color: 'rgba(255,255,255,0.85)',
            fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500, lineHeight: 1.5, zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'none', width: 'min(240px, 80vw)', textAlign: 'center' }}>
            {text}
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: 'rgba(4,12,8,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,183,3,0.2)', borderRadius: '12px',
            padding: '10px 14px', color: 'rgba(255,255,255,0.85)',
            fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500, lineHeight: 1.5, zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'none', width: '240px', textAlign: 'center' }}>
            <div style={{ position: 'absolute', bottom: '100%', right: '6px',
              width: 0, height: 0,
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderBottom: '5px solid rgba(4,12,8,0.97)' }} />
            {text}
          </div>
        );
      })()}
    </span>
  );
}

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

// ── Avatar helper ─────────────────────────────────────────────────
function getAvatar(name) {
  if (!name) return { initials: '?', bg: '#555' };
  const initials = name.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const palette = ['#e63946','#2a9d8f','#e76f51','#6a4c93','#1982c4','#f4a261','#43aa8b','#c77dff'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return { initials, bg: palette[idx] };
}

// ── Countdown helper ──────────────────────────────────────────────
function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const trip = new Date(dateStr); trip.setHours(0,0,0,0);
  const diff = Math.round((trip - today) / 86400000);
  if (diff < 0)  return { label: 'DEPARTED', color: 'rgba(8,28,21,0.3)', urgent: false };
  if (diff === 0) return { label: 'TODAY!',   color: '#22c55e', urgent: true };
  if (diff === 1) return { label: 'TOMORROW', color: '#84cc16', urgent: true };
  if (diff <= 7)  return { label: `${diff}D TO GO`, color: '#ffb703', urgent: true };
  return           { label: `${diff} DAYS`,   color: 'rgba(8,28,21,0.35)', urgent: false };
}

const PREDEFINED_TAGS = ['Adventure', 'Beach', 'Mountains', 'City Break', 'Road Trip', 'Budget', 'Luxury', 'Solo-friendly'];

const INDIAN_CITIES = [
  // A
  'Agartala','Agra','Ahmedabad','Aizawl','Ajmer','Aligarh','Alleppey','Almora','Alwar','Ambala','Amravati',
  'Amritsar','Anand','Anandpur Sahib','Andaman Islands','Anjuna','Araku Valley','Ashtamudi','Aurangabad','Ayodhya',
  // B
  'Badami','Badrinath','Bagdogra','Bangalore','Baran','Bareilly','Belgaum','Belur','Bharatpur','Bhavnagar',
  'Bhimtal','Bhopal','Bhubaneswar','Bikaner','Binsar','Bodh Gaya','Bomdila','Bundi',
  // C
  'Calicut','Chandigarh','Chandrapur','Chennai','Cherrapunji','Chikmagalur','Chittorgarh','Chopta',
  'Coimbatore','Coorg','Corbett','Cuttack',
  // D
  'Dalhousie','Dandeli','Darjeeling','Dehradun','Delhi','Dhanbad','Dharamsala','Dibang Valley',
  'Dibrugarh','Digha','Diu','Dudhwa','Dwarka',
  // E
  'Ellora','Ernakulam',
  // F
  'Faridabad','Fatehpur Sikri','Foothill','Fagu',
  // G
  'Gandhinagar','Gangtok','Ghaziabad','Goa','Gorakhpur','Gulbarga','Gulmarg','Gurgaon','Guwahati','Gwalior',
  'Gangotri',
  // H
  'Halebidu','Hampi','Haridwar','Hassan','Havelock Island','Hubballi','Hyderabad',
  // I
  'Idukki','Imphal','Indore','Itanagar',
  // J
  'Jabalpur','Jaipur','Jalandhar','Jammu','Jamshedpur','Jhansi','Jodhpur','Jaisalmer','Jog Falls',
  'Jorhat','Junagarh',
  // K
  'Kalimpong','Kanchipuram','Kangra','Kanpur','Kanyakumari','Kargil','Kanha','Kaziranga','Kedarnath',
  'Khajuraho','Kinnaur','Kochi','Kodaikanal','Kohima','Kolkata','Kollam','Kotagiri','Kozhikode',
  'Kufri','Kumbakonam','Kumily','Kurukshetra','Kutch',
  // L
  'Lahaul','Lakshadweep','Lansdowne','Leh','Lonavala','Lucknow','Ludhiana',
  // M
  'Madurai','Mahabaleshwar','Mahabalipuram','Malshej Ghat','Manali','Mandawa','Mandvi','Mangalore',
  'Matheran','McLeod Ganj','Meerut','Modhera','Mokokchung','Mount Abu','Mumbai','Munnar','Mussoorie','Mysore',
  // N
  'Nagpur','Nainital','Namchi','Nashik','Nathdwara','Navi Mumbai','Neemrana','Noida',
  // O
  'Omkareshwar','Ooty','Orchha',
  // P
  'Pachmarhi','Pahalgam','Palakkad','Palghar','Panaji','Pangong','Patan','Patna','Pelling','Pondicherry',
  'Port Blair','Prayagraj','Pune','Puri','Pushkar',
  // R
  'Raipur','Rajkot','Rameswaram','Ranchi','Ranthambore','Rishikesh','Rohtang',
  // S
  'Saputara','Sariska','Shillong','Shimla','Shirdi','Siliguri','Silvassa','Sindhudurg','Solapur',
  'Sonamarg','Spiti','Srinagar','Surat',
  // T
  'Tawang','Thane','Thanjavur','Thekkady','Thiruvananthapuram','Thrissur','Tiruchirappalli',
  'Tirupati','Tiruvannamalai','Toda','Triund',
  // U
  'Udaipur','Udupi','Ujjain','Uttarkashi','Ukhimath',
  // V
  'Vadodara','Vagamon','Varanasi','Varkala','Vijayawada','Visakhapatnam','Vrindavan',
  // W
  'Warangal','Wayanad',
  // Y
  'Yamunotri','Yercaud',
  // Z
  'Ziro',
];

export default function TravelBuddy({ user, onXpGain, initialView, hideNav, onMatchAccepted, darkMode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState(initialView || 'feed');
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
  const [budget, setBudget] = useState('Under 2000 Rupees');
  const [days, setDays] = useState('2 day');
  const [showBudgetDD, setShowBudgetDD] = useState(false);
  const [showDaysDD, setShowDaysDD] = useState(false);
  const [date, setDate] = useState('');
  const [maxBuddies, setMaxBuddies] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [originValid, setOriginValid] = useState(false);
  const [destValid, setDestValid] = useState(false);
  const [originError, setOriginError] = useState('');
  const [destError, setDestError] = useState('');

  // Feature 3: copy invite toast
  const [copiedId, setCopiedId] = useState(null);

  // Feature 5: tag filter in feed
  const [activeTagFilter, setActiveTagFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('');

  // Feature 8: bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('la_bookmarks') || '[]'); } catch { return []; }
  });
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(true);

  // Feature 9: notifications
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifRead, setNotifRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('la_notif_read') || '{}'); } catch { return {}; }
  });

  // Feature 11: cost estimator
  const [costOrigin, setCostOrigin] = useState('');
  const [costDest, setCostDest] = useState('');
  const [costDays, setCostDays] = useState('');
  const [costStyle, setCostStyle] = useState('Comfort');
  const [costResult, setCostResult] = useState(null);
  const [costLoading, setCostLoading] = useState(false);

  // Feature 12: weather cache
  const weatherCache = useRef(new Map());
  const [weatherData, setWeatherData] = useState({});

  // Feature 13: expenses in chat
  const [chatTab, setChatTab] = useState('chat'); // 'chat' | 'expenses'
  const [expenses, setExpenses] = useState([]);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Feature 14: map view toggle
  const [mapView, setMapView] = useState(false);

  // Feature 15: push notifications
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [notifDismissed, setNotifDismissed] = useState(() => localStorage.getItem('la_notif_dismissed') === '1');
  const prevMsgCountRef = useRef({});
  const prevMatchCountRef = useRef({});

  // Feature 6: profile bio + avatar image
  const [bio, setBio] = useState(() => localStorage.getItem(`la_bio_${user?.uid}`) || '');
  const [avatarImg, setAvatarImg] = useState(() => localStorage.getItem(`la_avatar_url_${user?.uid}`) || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  // Profile modal for viewing other users
  const [profileModal, setProfileModal] = useState(null); // { uid, name } or null
  // Cache of avatarUrl per uid so cards show real photos
  const [profileCache, setProfileCache] = useState({});

  // Feature 7: ratings
  const [ratingInputs, setRatingInputs] = useState({}); // tripId -> { score, comment }

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const chatContainerRef = React.useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Feature 12: fetch weather for visible trips
  useEffect(() => {
    if (view !== 'feed' || trips.length === 0) return;
    trips.forEach(trip => {
      const city = trip.destination;
      const cached = weatherCache.current.get(city);
      if (cached && Date.now() - cached.fetchedAt < 600000) {
        setWeatherData(prev => ({ ...prev, [city]: cached.data }));
        return;
      }
      fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
        .then(r => r.json())
        .then(json => {
          const current = json?.current_condition?.[0];
          if (!current) return;
          const desc = current.weatherDesc?.[0]?.value || '';
          const tempC = current.temp_C || '';
          const condIcons = { Sunny: '☀️', Clear: '🌙', Cloudy: '☁️', Overcast: '☁️', Mist: '🌫️', Rain: '🌧️', Drizzle: '🌦️', Thunder: '⛈️', Snow: '❄️', Fog: '🌫️', Haze: '🌫️', Blizzard: '🌨️', Sleet: '🌨️' };
          const icon = Object.keys(condIcons).find(k => desc.includes(k)) ? condIcons[Object.keys(condIcons).find(k => desc.includes(k))] : '🌡️';
          const data = `${icon} ${desc} · ${tempC}°C`;
          const entry = { data, fetchedAt: Date.now() };
          weatherCache.current.set(city, entry);
          setWeatherData(prev => ({ ...prev, [city]: entry.data }));
        })
        .catch(() => {});
    });
  }, [trips, view]);

  // Feature 15: push notification helpers
  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const sendBrowserNotif = (title, body) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  };

  // Feature 15: monitor new messages and matches for push notifications
  useEffect(() => {
    if (notifPermission !== 'granted') return;
    // Check message counts
    [...myTrips.created, ...myTrips.requested].forEach(trip => {
      const count = trip.messages?.length || 0;
      const prev = prevMsgCountRef.current[trip._id];
      if (prev !== undefined && count > prev && !activeChat) {
        sendBrowserNotif(`New message in ${trip.origin}→${trip.destination}`, trip.messages[trip.messages.length - 1]?.text || '');
      }
      prevMsgCountRef.current[trip._id] = count;
    });
    // Check new pending matches
    myTrips.created.forEach(trip => {
      const pending = trip.matches?.filter(m => m.status === 'pending').length || 0;
      const prev = prevMatchCountRef.current[trip._id];
      if (prev !== undefined && pending > prev) {
        sendBrowserNotif('New buddy request!', `Someone wants to join your ${trip.origin}→${trip.destination} trip`);
      }
      prevMatchCountRef.current[trip._id] = pending;
    });
  }, [myTrips, notifPermission]);

  // Feature 4: unread message badge helpers
  const getLastRead = (tripId) => parseInt(localStorage.getItem(`lastRead_${tripId}`) || '0');
  const hasUnreadMessages = (trip) => {
    const lastRead = getLastRead(trip._id);
    return (trip.messages || []).some(m => new Date(m.timestamp).getTime() > lastRead && m.senderUid !== user?.uid);
  };
  const myTripsHasUnread = [...(myTrips.created || []), ...(myTrips.requested || [])].some(hasUnreadMessages);

  // When a chat is opened — connect socket, fetch history, listen for messages
  useEffect(() => {
    if (!activeChat) return;

    // Feature 4: update lastRead
    localStorage.setItem(`lastRead_${activeChat._id}`, Date.now().toString());

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fetch message history from REST
    axios.get(`/api/buddy/trips/${activeChat._id}/chat`).then(res => setMessages(res.data)).catch(() => {});

    // Feature 13: fetch expenses
    setChatTab('chat');
    axios.get(`/api/buddy/trips/${activeChat._id}/expenses`).then(res => setExpenses(res.data)).catch(() => {});

    // Connect socket and join room
    const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join-room', activeChat._id);

    socket.on('new-message', (msg) => {
      // Feature 15: push notif if chat not focused
      if (document.hidden) sendBrowserNotif(`New message in ${activeChat.origin}→${activeChat.destination}`, msg.text);
      setMessages(prev => {
        const alreadyExists = prev.some(m => m._id && m._id === msg._id);
        if (alreadyExists) return prev;
        const optimisticIdx = prev.findLastIndex(m => !m._id && m.senderUid === msg.senderUid && m.text === msg.text);
        if (optimisticIdx !== -1) {
          const next = [...prev];
          next[optimisticIdx] = msg;
          return next;
        }
        return [...prev, msg];
      });
      setTypingUsers(prev => prev.filter(n => n !== msg.senderName));
    });

    socket.on('user-typing', ({ name }) => {
      setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
    });

    socket.on('user-stop-typing', ({ name }) => {
      setTypingUsers(prev => prev.filter(n => n !== name));
    });

    return () => {
      socket.emit('leave-room', activeChat._id);
      socket.disconnect();
      socketRef.current = null;
      setTypingUsers([]);
    };
  }, [activeChat]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !activeChat || !socketRef.current) return;
    const text = chatMessage.trim();
    setChatMessage('');
    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('stop-typing', { tripId: activeChat._id, name: user.name });
    // Optimistic update
    setMessages(prev => [...prev, { senderUid: user.uid, senderName: user.name, text, timestamp: new Date() }]);
    // Emit via socket — server saves + broadcasts back
    socketRef.current.emit('send-message', {
      tripId: activeChat._id,
      senderUid: user.uid,
      senderName: user.name,
      text,
    });
  };

  const handleTyping = (val) => {
    setChatMessage(val);
    if (!socketRef.current || !activeChat) return;
    socketRef.current.emit('typing', { tripId: activeChat._id, name: user.name });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { tripId: activeChat._id, name: user.name });
    }, 2000);
  };

  // Feed Search State
  const [searchOrigin, setSearchOrigin] = useState('');
  
  const fetchTrips = async () => {
    try {
      const res = await axios.get(`/api/buddy/trips?uid=${user.uid || ''}${searchOrigin ? `&origin=${encodeURIComponent(searchOrigin)}` : ''}`);
      setTrips(res.data);
      // Pre-fetch avatars for all unique creators
      const uids = [...new Set(res.data.map(t => t.creatorUid).filter(Boolean))];
      uids.forEach(uid => {
        if (profileCache[uid]) return;
        axios.get(`/api/buddy/users/${uid}/profile`).then(r => {
          if (r.data.avatarUrl) {
            setProfileCache(prev => ({ ...prev, [uid]: r.data.avatarUrl }));
          }
        }).catch(() => {});
      });
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
    if (view === 'my_trips' || view === 'profile') fetchMyTrips();
  }, [view]);

  // Sync own profile (bio + avatar URL) from backend on mount
  useEffect(() => {
    if (!user?.uid) return;
    axios.get(`/api/buddy/users/${user.uid}/profile`).then(res => {
      if (res.data.bio) { setBio(res.data.bio); localStorage.setItem(`la_bio_${user.uid}`, res.data.bio); }
      if (res.data.avatarUrl) { setAvatarImg(res.data.avatarUrl); localStorage.setItem(`la_avatar_url_${user.uid}`, res.data.avatarUrl); }
    }).catch(() => {});
  }, [user?.uid]);

  const handleListTrip = async (e) => {
    e.preventDefault();
    let valid = true;
    if (!originValid) { setOriginError('Please select a city from the list'); valid = false; } else { setOriginError(''); }
    if (!destValid) { setDestError('Please select a city from the list'); valid = false; } else { setDestError(''); }
    if (!valid) return;
    try {
      await axios.post('/api/buddy/trips', {
        creatorName: user.name,
        creatorCompany: user.company,
        origin, destination, budget, days, date, maxBuddies, tags: selectedTags
      }, { headers: getUserAuthHeader() });
      showToast('Trip listed! +5 XP earned', 'success');
      if (onXpGain) onXpGain(5);
      setSelectedTags([]);
      setView('feed');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error listing trip', 'error');
    }
  };

  // Feature 3: copy invite link
  const handleCopyLink = (trip) => {
    const url = window.location.origin + '/trip/' + trip._id;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(trip._id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => showToast('Copy failed', 'error'));
  };

  // Feature 8: bookmark toggle
  const toggleBookmark = (tripId) => {
    setBookmarks(prev => {
      const next = prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId];
      localStorage.setItem('la_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  // Profile image upload — sends to Cloudinary via backend
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await axios.post('/api/buddy/users/upload-avatar', { base64 }, {
          headers: getUserAuthHeader()
        });
        const url = res.data.url;
        setAvatarImg(url);
        localStorage.setItem(`la_avatar_url_${user.uid}`, url);
        await axios.put('/api/buddy/users/profile', { bio, avatarUrl: url, name: user.name }, {
          headers: getUserAuthHeader()
        });
        showToast('Photo updated!', 'success');
      } catch {
        showToast('Upload failed, try again', 'error');
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile to backend
  const handleSaveProfile = async () => {
    localStorage.setItem(`la_bio_${user.uid}`, bio);
    try {
      await axios.put('/api/buddy/users/profile', { bio, avatarUrl: avatarImg, name: user.name }, {
        headers: getUserAuthHeader()
      });
    } catch (e) { /* ok */ }
    showToast('Profile saved!', 'success');
  };

  // Fetch and show another user's profile modal
  const openProfileModal = async (uid, name) => {
    setProfileModal({ uid, name, loading: true, bio: '', avatarUrl: '' });
    try {
      const res = await axios.get(`/api/buddy/users/${uid}/profile`);
      setProfileModal({ uid, name, loading: false, bio: res.data.bio || '', avatarUrl: res.data.avatarUrl || '' });
    } catch {
      setProfileModal({ uid, name, loading: false, bio: '', avatarUrl: '' });
    }
  };

  // Feature 11: cost estimator
  const handleCostEstimate = async () => {
    if (!costOrigin.trim() || !costDest.trim() || !costDays) { showToast('Please fill all fields', 'error'); return; }
    setCostLoading(true);
    setCostResult(null);
    try {
      const prompt = `Give a realistic cost estimate in Indian Rupees for a trip from ${costOrigin} to ${costDest} for ${costDays} days with ${costStyle} travel style. Return ONLY valid JSON: { "transport": number, "accommodation": number, "food": number, "activities": number, "misc": number, "total": number, "tips": ["tip1","tip2","tip3"] }`;
      const res = await axios.post('/api/ai/generate', { prompt });
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) setCostResult(JSON.parse(jsonMatch[0]));
      else showToast('Could not parse AI response', 'error');
    } catch { showToast('AI error, try again', 'error'); }
    setCostLoading(false);
  };

  // Feature 13: add expense
  const handleAddExpense = async () => {
    if (!expDesc.trim() || !expAmount) return;
    try {
      const res = await axios.post(`/api/buddy/trips/${activeChat._id}/expense`, {
        description: expDesc, amount: parseFloat(expAmount), paidBy: user.uid, paidByName: user.name
      }, { headers: getUserAuthHeader() });
      setExpenses(res.data.expenses);
      setExpDesc(''); setExpAmount('');
    } catch { showToast('Error adding expense', 'error'); }
  };

  // Feature 7: rating helpers
  const getRatingKey = (tripId) => `la_rating_${tripId}_${user?.uid}`;
  const getRating = (tripId) => { try { return JSON.parse(localStorage.getItem(getRatingKey(tripId))); } catch { return null; } };
  const saveRating = (tripId, score, comment) => {
    localStorage.setItem(getRatingKey(tripId), JSON.stringify({ score, comment }));
    showToast('Rating submitted!', 'success');
    setRatingInputs(prev => ({ ...prev, [tripId]: { ...prev[tripId], submitted: true } }));
  };

  // Feature 9: derive notifications
  const getNotifications = () => {
    const notifs = [];
    (myTrips.created || []).forEach(trip => {
      (trip.matches || []).filter(m => m.status === 'pending').forEach(m => {
        notifs.push({ id: `pending_${trip._id}_${m._id}`, icon: '🙋', text: `${m.requesterName} wants to join ${trip.origin}→${trip.destination}`, time: m._id ? new Date(parseInt(m._id.substring(0,8),16)*1000) : new Date(), tripId: trip._id, tripObj: trip, action: 'my_trips' });
      });
    });
    (myTrips.requested || []).forEach(trip => {
      const myMatch = trip.matches?.find(m => m.requesterUid === user?.uid);
      if (myMatch?.status === 'accepted') {
        notifs.push({ id: `accepted_${trip._id}`, icon: '✅', text: `Accepted! Join ${trip.origin}→${trip.destination}`, time: new Date(), tripId: trip._id, tripObj: trip, action: 'open_chat' });
      }
    });
    // Unread message notifications
    [...(myTrips.created || []), ...(myTrips.requested || [])].forEach(trip => {
      if (hasUnreadMessages(trip)) {
        const unreadMsgs = (trip.messages || []).filter(m => m.senderUid !== user?.uid && new Date(m.timestamp).getTime() > getLastRead(trip._id));
        const lastMsg = unreadMsgs[unreadMsgs.length - 1];
        const preview = lastMsg ? `: "${lastMsg.text.slice(0, 28)}${lastMsg.text.length > 28 ? '…' : ''}"` : '';
        const notifId = `msg_${trip._id}_${lastMsg?._id || unreadMsgs.length}`;
        notifs.push({ id: notifId, icon: '💬', text: `New message in ${trip.origin}→${trip.destination}${preview}`, time: lastMsg ? new Date(lastMsg.timestamp) : new Date(), tripId: trip._id, tripObj: trip, action: 'open_chat' });
      }
    });
    return notifs.sort((a, b) => b.time - a.time).slice(0, 10);
  };
  const notifications = getNotifications();
  const unreadNotifCount = notifications.filter(n => !notifRead[n.id]).length;

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
      if (onMatchAccepted) onMatchAccepted(); // immediately clear notification badge
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

  // Profile modal JSX — inlined as a portal wherever needed (not a sub-component, to avoid unmount/remount on every render)
  const profileModalPortal = profileModal ? createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={() => setProfileModal(null)}>
      <div style={{ background: 'rgba(8,20,14,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,183,3,0.2)', borderRadius: '24px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        {profileModal.loading ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>Loading...</div>
        ) : (
          <>
            {profileModal.avatarUrl
              ? <img src={profileModal.avatarUrl} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffb703', marginBottom: '14px' }} />
              : (() => { const av = getAvatar(profileModal.name); return (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: 'white', border: '3px solid #ffb703', margin: '0 auto 14px' }}>{av.initials}</div>
              ); })()
            }
            <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px', marginBottom: '8px' }}>{profileModal.name.toUpperCase()}</div>
            {profileModal.bio
              ? <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, margin: '0 0 16px' }}>{profileModal.bio}</p>
              : <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", margin: '0 0 16px' }}>No bio yet.</p>
            }
            <button onClick={() => setProfileModal(null)}
              style={{ padding: '8px 24px', background: 'rgba(255,183,3,0.15)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '50px', color: '#ffb703', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>CLOSE</button>
          </>
        )}
      </div>
    </div>,
    document.body
  ) : null;

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
      <div style={{ position: 'relative', width: '100%', maxWidth: '1000px' }}>
      {profileModalPortal}
      <ToastUI />
      <div style={{ width: '100%', borderRadius: isMobile ? '20px' : '28px', overflow: 'hidden',
        background: 'rgba(255,252,245,0.97)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,183,3,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column',
        height: isMobile ? 'calc(100svh - 140px)' : 'calc(100vh - 200px)' }}>

        {/* ── Header ── */}
        <div style={{ padding: isMobile ? '14px 16px 12px' : '20px 28px 18px',
          background: 'linear-gradient(135deg, #081c15 0%, #1b4332 100%)',
          borderBottom: '3px solid #ffb703', position: 'relative', overflow: 'hidden' }}>
          {/* subtle dot grid on header */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,183,3,0.1) 1px, transparent 1px)',
            backgroundSize: '18px 18px' }} />
          {/* Top row: label + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>✈️</div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>GROUP CHAT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,183,3,0.15)',
                border: '1px solid rgba(255,183,3,0.3)', borderRadius: '50px', padding: isMobile ? '4px 8px' : '5px 14px' }}>
                <Users size={11} color="#ffb703" />
                <span style={{ color: '#ffb703', fontSize: '0.65rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                  {1 + (activeChat.matches?.filter(m => m.status === 'accepted').length || 0)}
                  {!isMobile && ' members'}
                </span>
              </div>
              <button onClick={() => setActiveChat(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50px', padding: isMobile ? '5px 10px' : '6px 16px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                fontSize: '0.62rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                ← BACK
              </button>
            </div>
          </div>
          {/* Route title */}
          <div style={{ color: 'white', fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive", letterSpacing: '3px', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative' }}>
            {activeChat.origin} <span style={{ color: '#ffb703' }}>→</span> {activeChat.destination}
          </div>
        </div>

        {/* CHAT / EXPENSES Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '2px solid rgba(8,28,21,0.08)', background: 'rgba(255,255,255,0.9)' }}>
          {['chat', 'expenses'].map(tab => (
            <button key={tab} onClick={() => setChatTab(tab)}
              style={{ flex: 1, padding: '13px', background: 'none', border: 'none', cursor: 'pointer',
                color: chatTab === tab ? '#081c15' : 'rgba(8,28,21,0.35)',
                fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif",
                borderBottom: chatTab === tab ? '2px solid #ffb703' : '2px solid transparent',
                marginBottom: '-2px', transition: 'all 0.2s' }}>
              {tab === 'chat' ? '💬 CHAT' : '💰 EXPENSES'}
            </button>
          ))}
        </div>

        {/* ── Messages ── */}
        {chatTab === 'chat' && <div ref={chatContainerRef} style={{ flex: 1, minHeight: 0, padding: isMobile ? '16px' : '24px 32px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '12px',
          background: 'rgba(248,246,240,0.6)' }}>
          <div style={{ alignSelf: 'center', background: 'rgba(255,183,3,0.12)', color: 'rgba(140,90,0,0.8)',
            padding: '5px 16px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", border: '1px solid rgba(255,183,3,0.2)' }}>
            Group chat · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          {messages.map((msg, idx) => {
            const isMe = msg.senderUid === user.uid;
            const prevMsg = messages[idx - 1];
            const showAvatar = !isMe && (!prevMsg || prevMsg.senderUid !== msg.senderUid);
            const av = getAvatar(msg.senderName);
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  {!isMe && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: av.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem',
                      fontWeight: 900, color: 'white', fontFamily: "'DM Sans', sans-serif",
                      visibility: showAvatar ? 'visible' : 'hidden', cursor: 'pointer' }}
                      onClick={() => showAvatar && openProfileModal(msg.senderUid, msg.senderName)}>
                      {av.initials}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {showAvatar && (
                      <div style={{ fontSize: '0.58rem', color: av.bg, fontWeight: 800, letterSpacing: '0.8px',
                        fontFamily: "'DM Sans', sans-serif", marginBottom: '3px', cursor: 'pointer' }}
                        onClick={() => openProfileModal(msg.senderUid, msg.senderName)}>
                        {msg.senderName?.toUpperCase()}
                      </div>
                    )}
                    <div style={{
                      background: isMe ? 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)' : 'white',
                      color: isMe ? '#081c15' : '#2d3a33',
                      padding: '10px 14px', borderRadius: '18px',
                      borderBottomRightRadius: isMe ? '4px' : '18px',
                      borderBottomLeftRadius: isMe ? '18px' : '4px',
                      maxWidth: '380px',
                      border: isMe ? 'none' : '1px solid rgba(8,28,21,0.1)',
                      boxShadow: isMe ? '0 4px 16px rgba(255,183,3,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.45, fontWeight: 500 }}>{msg.text}</div>
                      <div style={{ fontSize: '0.55rem', opacity: 0.55, marginTop: '4px', textAlign: 'right', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}

        {/* Expenses Tab */}
        {chatTab === 'expenses' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '16px' : '20px 32px', background: 'rgba(248,246,240,0.6)', boxSizing: 'border-box', width: '100%' }}>
            {(() => {
              const groupSize = 1 + (activeChat.matches?.filter(m => m.status === 'accepted').length || 0);
              const total = expenses.reduce((sum, e) => sum + e.amount, 0);
              const perPerson = groupSize > 0 ? total / groupSize : 0;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '16px 20px', background: 'linear-gradient(135deg, #081c15, #1b4332)', borderRadius: '16px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1.5px', fontFamily: "'DM Sans', sans-serif" }}>TOTAL SPENT</div>
                      <div style={{ color: '#ffb703', fontSize: '1.3rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive" }}>₹{total.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1.5px', fontFamily: "'DM Sans', sans-serif" }}>PER PERSON</div>
                      <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive" }}>₹{perPerson.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                  {expenses.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(8,28,21,0.07)' }}>
                      <div>
                        <div style={{ color: '#081c15', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{exp.description}</div>
                        <div style={{ color: 'rgba(8,28,21,0.45)', fontSize: '0.6rem', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>Paid by {exp.paidByName} · {new Date(exp.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: '#1b4332', fontWeight: 900, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" }}>₹{exp.amount.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                  {expenses.length === 0 && <div style={{ color: 'rgba(8,28,21,0.35)', textAlign: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem' }}>No expenses yet</div>}
                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Description"
                      style={{ flex: 2, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(8,28,21,0.12)', background: 'white', color: '#081c15', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }} />
                    <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="₹ Amount" type="number"
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(8,28,21,0.12)', background: 'white', color: '#081c15', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }} />
                    <button onClick={handleAddExpense}
                      style={{ padding: '10px 16px', borderRadius: '10px', background: '#ffb703', color: '#081c15', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                      I PAID
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── Typing indicator ── */}
        {chatTab === 'chat' && typingUsers.length > 0 && (
          <div style={{ padding: '4px 32px 0', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(248,246,240,0.6)' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffb703',
                  animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ color: 'rgba(140,90,0,0.8)', fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        {/* ── Input ── */}
        {chatTab === 'chat' && <div style={{ padding: isMobile ? '10px 12px' : '14px 28px 16px',
          borderTop: '1.5px solid rgba(8,28,21,0.08)',
          display: 'flex', gap: '8px', alignItems: 'center', background: 'white', flexShrink: 0 }}>
          <input
            value={chatMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '12px 18px', borderRadius: '50px',
              border: '1.5px solid rgba(8,28,21,0.12)', background: 'rgba(248,246,240,0.8)',
              color: '#081c15', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem' }}
          />
          <button onClick={handleSendMessage}
            style={{ padding: '12px 22px', borderRadius: '50px', background: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)',
              color: '#081c15', border: 'none', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 900, fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', letterSpacing: '0.5px',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,183,3,0.4)', flexShrink: 0,
              transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            SEND <Send size={14} />
          </button>
        </div>}
      </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1000px', padding: hideNav ? 0 : (isMobile ? '16px 12px' : '20px'), overflowX: 'hidden', boxSizing: 'border-box' }}>
      <ToastUI />

      {/* Profile Modal — rendered via portal in ProfileModalUI */}
      {profileModalPortal}
      {/* Navigation Headers */}
      {!hideNav && view !== 'profile' && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          {/* Outer flex row: scrollable pills + bell outside overflow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '8px' }}>
            <div style={{ display: 'flex', gap: isMobile ? '5px' : '10px', flex: 1, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'feed',       label: 'EXPLORE',   icon: <Globe size={16} />,       info: 'Browse trips' },
              { id: 'list',       label: 'LIST TRIP',  icon: <Ticket size={16} />,      info: 'Post your trip' },
              { id: 'my_trips',   label: 'MY TRIPS',   icon: <Compass size={16} />,     info: 'Your trips', badge: myTripsHasUnread },
            ].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                style={{
                  padding: isMobile ? '8px 11px' : '11px 22px', borderRadius: '50px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '5px', position: 'relative',
                  background: view === tab.id ? 'linear-gradient(135deg, #ffb703, #ff8c00)' : 'rgba(255,255,255,0.05)',
                  color: view === tab.id ? '#081c15' : 'white',
                  border: '1px solid', borderColor: view === tab.id ? 'transparent' : 'rgba(255,255,255,0.1)',
                  fontWeight: 900, transition: 'all 0.3s ease', cursor: 'pointer', outline: 'none',
                  boxShadow: view === tab.id ? '0 10px 20px rgba(255,183,3,0.3)' : 'none',
                  letterSpacing: '1px', fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                {React.cloneElement(tab.icon, { color: view === tab.id ? '#081c15' : '#ffb703', size: isMobile ? 13 : 16 })}
                {tab.label}
                {tab.badge && <span style={{ width: '8px', height: '8px', background: '#ff5d73', borderRadius: '50%', position: 'absolute', top: '6px', right: '6px' }} />}
              </button>
            ))}
            </div>
            {/* Feature 9: Notification Bell — outside overflow so panel isn't clipped */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setShowNotifPanel(p => !p)}
                style={{ padding: isMobile ? '8px 11px' : '11px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 900, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", position: 'relative', outline: 'none' }}>
                <Bell size={isMobile ? 13 : 16} color="#ffb703" />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#ff5d73', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9999,
                  width: isMobile ? '280px' : '300px', maxWidth: 'calc(100vw - 24px)',
                  background: 'rgba(8,20,14,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,183,3,0.2)',
                  borderRadius: '16px', padding: '16px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: '#ffb703', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px' }}>NOTIFICATIONS</span>
                    <button onClick={() => { const all = {}; notifications.forEach(n => { all[n.id] = true; }); setNotifRead(all); localStorage.setItem('la_notif_read', JSON.stringify(all)); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', padding: '12px 0' }}>No notifications</div>}
                  {notifications.map(n => (
                    <div key={n.id}
                      onClick={() => {
                        const updated = { ...notifRead, [n.id]: true };
                        setNotifRead(updated);
                        localStorage.setItem('la_notif_read', JSON.stringify(updated));
                        setShowNotifPanel(false);
                        if (n.action === 'open_chat' && n.tripObj) {
                          localStorage.setItem(`lastRead_${n.tripId}`, Date.now().toString());
                          setActiveChat(n.tripObj);
                        } else if (n.action === 'my_trips') {
                          setView('my_trips');
                        }
                      }}
                      style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        opacity: notifRead[n.id] ? 0.5 : 1,
                        cursor: n.tripObj ? 'pointer' : 'default',
                        borderRadius: '8px',
                        transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (n.tripObj) e.currentTarget.style.background = 'rgba(255,183,3,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: '1rem' }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-word' }}>{n.text}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', marginTop: '2px' }}>{n.time ? new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                      {!notifRead[n.id] && <div style={{ width: '6px', height: '6px', background: '#ff5d73', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Feature 15: Enable notifications banner */}
          {notifPermission === 'default' && !notifDismissed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px', padding: '8px 16px',
              background: 'rgba(255,183,3,0.08)', border: '1px solid rgba(255,183,3,0.2)', borderRadius: '50px' }}>
              <Bell size={12} color="#ffb703" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif" }}>Enable notifications for trip alerts</span>
              <button onClick={requestNotifPermission} style={{ background: '#ffb703', color: '#081c15', border: 'none', borderRadius: '50px', padding: '4px 12px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>ENABLE</button>
              <button onClick={() => { setNotifDismissed(true); localStorage.setItem('la_notif_dismissed', '1'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          
          {view === 'list' && (
            <form onSubmit={handleListTrip} style={{ margin: '0 auto', maxWidth: '820px', borderRadius: isMobile ? '20px' : '28px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.12)', position: 'relative' }}>
              {/* Ambient glow */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

              {/* Header */}
              <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #0d2117, #1a3d27)', padding: isMobile ? '20px 18px 16px' : '28px 40px 24px', display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '20px', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />
                {!isMobile && <>
                  <div style={{ position: 'absolute', top: 0, right: '32px', width: '14px', height: '44px', background: 'linear-gradient(180deg, #d4af37, #ffb703)', borderRadius: '0 0 5px 5px', opacity: 0.9 }} />
                  <div style={{ position: 'absolute', top: 0, right: '52px', width: '14px', height: '28px', background: 'rgba(212,175,55,0.3)', borderRadius: '0 0 5px 5px' }} />
                </>}
                <div style={{ width: isMobile ? '38px' : '48px', height: isMobile ? '38px' : '48px', borderRadius: '12px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PlaneTakeoff size={isMobile ? 18 : 22} color="#d4af37" />
                </div>
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(212,175,55,0.55)', letterSpacing: '3px', fontFamily: "'DM Sans', sans-serif", marginBottom: '3px' }}>TRAVEL BUDDY</div>
                  <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, lineHeight: 1, margin: 0, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px', color: 'white' }}>TRIP PLANNER</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: '3px', marginBottom: 0, fontFamily: "'DM Sans', sans-serif" }}>Post your trip &amp; find your crew</p>
                </div>
              </div>

              {/* Form body */}
              <div style={{ position: 'relative', zIndex: 1, background: 'rgba(8,20,14,0.97)', backdropFilter: 'blur(20px)', padding: isMobile ? '20px 18px' : '32px 40px' }}>
                {/* Route row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: isMobile ? '14px' : '16px', marginBottom: isMobile ? '16px' : '20px', alignItems: 'end' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>FROM</label>
                    <input
                      value={origin}
                      onChange={e => { setOrigin(e.target.value); setOriginValid(false); setOriginError(''); setShowOriginSuggestions(true); }}
                      onFocus={() => setShowOriginSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                      placeholder="Starting city…"
                      autoComplete="off"
                      style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${originError ? '#e63946' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: 700, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                      onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; }}
                      onBlurCapture={e => { e.currentTarget.style.borderColor = originError ? '#e63946' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    />
                    {originError && <div style={{ color: '#e63946', fontSize: '0.6rem', fontWeight: 700, marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>{originError}</div>}
                    {showOriginSuggestions && origin.trim().length > 0 && (() => {
                      const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(origin.toLowerCase()));
                      return filtered.length > 0 ? (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'rgba(10,22,16,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', zIndex: 999, maxHeight: '180px', overflowY: 'auto' }}>
                          {filtered.map(city => (
                            <div key={city} onMouseDown={() => { setOrigin(city); setOriginValid(true); setOriginError(''); setShowOriginSuggestions(false); }}
                              style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {city}
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {!isMobile && <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '14px', color: 'rgba(212,175,55,0.4)', fontSize: '1.2rem' }}>→</div>}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>TO</label>
                    <input
                      value={destination}
                      onChange={e => { setDestination(e.target.value); setDestValid(false); setDestError(''); setShowDestSuggestions(true); }}
                      onFocus={() => setShowDestSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDestSuggestions(false), 150)}
                      placeholder="Destination city…"
                      autoComplete="off"
                      style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${destError ? '#e63946' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: 700, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                      onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; }}
                      onBlurCapture={e => { e.currentTarget.style.borderColor = destError ? '#e63946' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    />
                    {destError && <div style={{ color: '#e63946', fontSize: '0.6rem', fontWeight: 700, marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>{destError}</div>}
                    {showDestSuggestions && destination.trim().length > 0 && (() => {
                      const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(destination.toLowerCase()));
                      return filtered.length > 0 ? (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'rgba(10,22,16,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', zIndex: 999, maxHeight: '180px', overflowY: 'auto' }}>
                          {filtered.map(city => (
                            <div key={city} onMouseDown={() => { setDestination(city); setDestValid(true); setDestError(''); setShowDestSuggestions(false); }}
                              style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {city}
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: isMobile ? '4px 0 16px' : '4px 0 20px' }} />

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '14px', marginBottom: isMobile ? '16px' : '20px' }}>
                  {/* Budget custom dropdown */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>BUDGET</label>
                    <button type="button" onClick={() => { setShowBudgetDD(v => !v); setShowDaysDD(false); }}
                      style={{ width: '100%', padding: '12px 12px', background: showBudgetDD ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showBudgetDD ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: 'white', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', transition: 'all 0.2s', outline: 'none', textAlign: 'left' }}>
                      <span style={{ color: showBudgetDD ? '#d4af37' : 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{budget}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: showBudgetDD ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: showBudgetDD ? '#d4af37' : 'rgba(255,255,255,0.3)' }}><path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <AnimatePresence>
                      {showBudgetDD && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'rgba(8,18,12,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', overflow: 'hidden', zIndex: 200, boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
                          {['Under 1000 Rupees', 'Under 2000 Rupees', 'Under 5000 Rupees', 'Over 5000 Rupees'].map(opt => (
                            <button key={opt} type="button" onClick={() => { setBudget(opt); setShowBudgetDD(false); }}
                              style={{ width: '100%', padding: '11px 14px', background: budget === opt ? 'rgba(212,175,55,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: budget === opt ? '#d4af37' : 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                              onMouseEnter={e => { if (budget !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={e => { if (budget !== opt) e.currentTarget.style.background = 'transparent'; }}>
                              {opt}
                              {budget === opt && <span style={{ fontSize: '0.6rem', color: '#d4af37' }}>✓</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Duration custom dropdown */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>DURATION</label>
                    <button type="button" onClick={() => { setShowDaysDD(v => !v); setShowBudgetDD(false); }}
                      style={{ width: '100%', padding: '12px 12px', background: showDaysDD ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showDaysDD ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: 'white', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', transition: 'all 0.2s', outline: 'none', textAlign: 'left' }}>
                      <span style={{ color: showDaysDD ? '#d4af37' : 'rgba(255,255,255,0.85)' }}>{days}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: showDaysDD ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: showDaysDD ? '#d4af37' : 'rgba(255,255,255,0.3)' }}><path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <AnimatePresence>
                      {showDaysDD && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'rgba(8,18,12,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', overflow: 'hidden', zIndex: 200, boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
                          {['1 day', '2 day', '3 day', '3+ days'].map(opt => (
                            <button key={opt} type="button" onClick={() => { setDays(opt); setShowDaysDD(false); }}
                              style={{ width: '100%', padding: '11px 14px', background: days === opt ? 'rgba(212,175,55,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: days === opt ? '#d4af37' : 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                              onMouseEnter={e => { if (days !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={e => { if (days !== opt) e.currentTarget.style.background = 'transparent'; }}>
                              {opt}
                              {days === opt && <span style={{ fontSize: '0.6rem', color: '#d4af37' }}>✓</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>TRIP DATE</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '12px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', WebkitTextFillColor: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', colorScheme: 'dark', WebkitAppearance: 'none', minHeight: '44px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>MAX BUDDIES</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', height: '42px', boxSizing: 'border-box' }}>
                      <button type="button" onClick={() => setMaxBuddies(m => Math.max(1, m - 1))} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>−</button>
                      <span style={{ flex: 1, textAlign: 'center', color: 'white', fontSize: '1rem', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>{maxBuddies}</span>
                      <button type="button" onClick={() => setMaxBuddies(m => Math.min(20, m + 1))} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.1)', color: '#d4af37', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>+</button>
                    </div>
                    {maxBuddies > 10 && <div style={{ marginTop: '4px', fontSize: '0.58rem', color: '#e76f51', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>⚠️ Large groups can be hard to coordinate</div>}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: isMobile ? '4px 0 16px' : '4px 0 20px' }} />

                {/* Tags */}
                <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
                  <label style={{ display: 'block', color: 'rgba(212,175,55,0.65)', fontSize: '0.58rem', fontWeight: 700, marginBottom: '10px', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>TRIP VIBE <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PREDEFINED_TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        style={{ padding: '7px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                          background: selectedTags.includes(tag) ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${selectedTags.includes(tag) ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          color: selectedTags.includes(tag) ? '#d4af37' : 'rgba(255,255,255,0.4)',
                          boxShadow: selectedTags.includes(tag) ? '0 0 10px rgba(212,175,55,0.15)' : 'none' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button type="submit"
                  style={{ width: '100%', padding: isMobile ? '15px' : '17px', background: 'linear-gradient(135deg, #d4af37 0%, #ffb703 50%, #e8920a 100%)', color: '#0a1a0f', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: isMobile ? '0.88rem' : '0.95rem', letterSpacing: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 8px 28px rgba(212,175,55,0.35)', transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(212,175,55,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,175,55,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Plane size={16} /> POST THIS TRIP
                </button>
              </div>
            </form>
          )}

          {view === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : 'calc(100vh - 290px)' }}>
              {/* Feature 5: Tag filters — desktop only above search */}
              {!isMobile && (() => {
                const allTags = ['All', ...Array.from(new Set(trips.flatMap(t => t.tags || [])))];
                return allTags.length > 1 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTagFilter(tag)}
                        style={{ padding: '6px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                          background: activeTagFilter === tag ? '#ffb703' : 'rgba(255,255,255,0.07)',
                          color: activeTagFilter === tag ? '#081c15' : 'rgba(255,255,255,0.6)' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Search row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} color="#ffb703" style={{ position: 'absolute', top: '16px', left: '20px' }} />
                    <input
                      value={searchOrigin}
                      onChange={e => setSearchOrigin(e.target.value)}
                      placeholder="Search by starting point... (e.g. Mumbai)"
                      style={{ width: '100%', padding: '16px 20px 16px 50px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '20px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button onClick={() => { setDestFilter(''); fetchTrips(); }} className="glass-btn" style={{ padding: '16px 20px', background: '#ffb703', color: '#081c15', borderRadius: '20px', border: 'none', fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    SEARCH
                  </button>
                </div>
                {/* Feature 14: Map View toggle */}
                <button onClick={() => setMapView(p => !p)}
                  style={{ padding: '12px 20px', background: mapView ? 'rgba(255,183,3,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${mapView ? '#ffb703' : 'rgba(255,255,255,0.1)'}`, borderRadius: '20px',
                    color: mapView ? '#ffb703' : 'rgba(255,255,255,0.6)', fontWeight: 900, cursor: 'pointer',
                    fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', width: '100%' }}>
                  📍 MAP VIEW
                </button>
              </div>

              {/* Feature 5: Tag filters — mobile only, below MAP VIEW */}
              {isMobile && (() => {
                const allTags = ['All', ...Array.from(new Set(trips.flatMap(t => t.tags || [])))];
                return allTags.length > 1 ? (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '10px 0 4px', marginBottom: '4px' }}>
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTagFilter(tag)}
                        style={{ padding: '6px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', flexShrink: 0,
                          background: activeTagFilter === tag ? '#ffb703' : 'rgba(255,255,255,0.07)',
                          color: activeTagFilter === tag ? '#081c15' : 'rgba(255,255,255,0.6)' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Scrollable cards area — desktop only */}
              <div style={{
                overflowY: isMobile ? 'visible' : 'auto',
                flex: isMobile ? 'none' : 1,
                paddingRight: isMobile ? 0 : '4px',
                marginTop: '8px',
              }}>

              {/* Feature 14: Trip Board / Map View */}
              {mapView && (() => {
                const destMap = {};
                trips.forEach(t => {
                  if (!destMap[t.destination]) destMap[t.destination] = { count: 0, earliest: t.date };
                  destMap[t.destination].count++;
                  if (new Date(t.date) < new Date(destMap[t.destination].earliest)) destMap[t.destination].earliest = t.date;
                });
                return (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>TRIP DESTINATIONS BOARD</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {Object.entries(destMap).map(([dest, info]) => (
                        <button key={dest} onClick={() => { setDestFilter(dest); setMapView(false); }}
                          style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,183,3,0.2)',
                            borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                            minWidth: '120px' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,183,3,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📍</div>
                          <div style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>{dest}</div>
                          <div style={{ color: '#ffb703', fontSize: '0.6rem', fontWeight: 700, marginTop: '4px' }}>{info.count} trip{info.count !== 1 ? 's' : ''}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', marginTop: '2px' }}>From {new Date(info.earliest).toLocaleDateString()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Feature 8: Bookmarked trips section */}
              {bookmarks.length > 0 && (() => {
                const saved = trips.filter(t => bookmarks.includes(t._id));
                if (saved.length === 0) return null;
                return (
                  <div style={{ marginBottom: '24px', background: 'rgba(255,183,3,0.05)', border: '1px solid rgba(255,183,3,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', borderBottom: savedDrawerOpen ? '1px solid rgba(255,183,3,0.1)' : 'none' }} onClick={() => setSavedDrawerOpen(o => !o)}>
                      <div style={{ color: '#ffb703', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>SAVED TRIPS ({saved.length})</div>
                      <div style={{ color: '#ffb703', fontSize: '0.9rem', transform: savedDrawerOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>▲</div>
                    </div>
                    {savedDrawerOpen && saved.map(t => (
                      <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" }}>{t.origin} → {t.destination}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif" }}>
                            Departs: {new Date(t.date).toLocaleDateString()}
                          </span>
                          <button onClick={() => toggleBookmark(t._id)} title="Remove bookmark"
                            style={{ background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.25)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,183,3,0.1)'}>
                            <Bookmark size={11} color="#ffb703" fill="#ffb703" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {destFilter && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px',
                  padding: '10px 20px', background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', borderRadius: '50px' }}>
                  <span style={{ color: '#ffb703', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                    📍 Showing trips to: <strong>{destFilter}</strong>
                  </span>
                  <button onClick={() => setDestFilter('')}
                    style={{ padding: '4px 14px', background: 'rgba(255,183,3,0.2)', border: '1px solid rgba(255,183,3,0.4)',
                      borderRadius: '50px', color: '#ffb703', fontSize: '0.62rem', fontWeight: 900, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px' }}>
                    SHOW ALL
                  </button>
                  <button onClick={() => setDestFilter('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,183,3,0.5)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: '0' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: isMobile ? '16px' : '30px', maxWidth: '100%' }}>
              {trips.filter(t => (activeTagFilter === 'All' || (t.tags || []).includes(activeTagFilter)) && (!destFilter || t.destination === destFilter)).length === 0 && (
                  <div style={{ color: 'white', opacity: 0.5, textAlign: 'center', width: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" }}>No trips found. Try a different city or post your own!</div>
                )}
              {trips.filter(t => (activeTagFilter === 'All' || (t.tags || []).includes(activeTagFilter)) && (!destFilter || t.destination === destFilter)).map(trip => {
                const myMatch = trip.matches?.find(m => m.requesterUid === user.uid);
                const requested = !!myMatch;
                const accepted = myMatch?.status === 'accepted';
                const shortOrig = trip.origin.substring(0,3).toUpperCase();
                const shortDest = trip.destination.substring(0,3).toUpperCase();
                const countdown = getDaysUntil(trip.date);
                const acceptedCount = trip.matches?.filter(m => m.status === 'accepted').length || 0;
                const maxSlots = trip.maxBuddies || 3;
                const isFull = acceptedCount >= maxSlots;
                const creatorAv = getAvatar(trip.creatorName);


                return (
                <div key={trip._id} className="ticket-card" style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'transform 0.2s', position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                  {/* Countdown badge */}
                  {countdown.urgent && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: countdown.color, color: countdown.color === '#22c55e' ? 'white' : '#081c15',
                      padding: '3px 10px', borderRadius: '50px', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1px',
                      fontFamily: "'DM Sans', sans-serif", zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      {countdown.label}
                    </div>
                  )}
                  {/* Left Main Ticket Panel */}
                  <div style={{ flex: 1, padding: isMobile ? '18px 16px' : '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ color: '#081c15', fontWeight: 900, letterSpacing: '2px', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif" }}>POSTED BY</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => toggleBookmark(trip._id)} title="Bookmark"
                              style={{ background: 'rgba(8,28,21,0.07)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Bookmark size={13} color={bookmarks.includes(trip._id) ? '#ffb703' : 'rgba(8,28,21,0.4)'} fill={bookmarks.includes(trip._id) ? '#ffb703' : 'none'} />
                            </button>
                            <div style={{ position: 'relative' }}>
                              <button onClick={() => handleCopyLink(trip)} title="Copy link"
                                style={{ background: 'rgba(8,28,21,0.07)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Copy size={13} color={copiedId === trip._id ? '#22c55e' : 'rgba(8,28,21,0.4)'} />
                              </button>
                              {copiedId === trip._id && (
                                <div style={{ position: 'absolute', top: '36px', right: 0, background: '#1b4332', color: '#d8f3dc', padding: '3px 10px', borderRadius: '50px', fontSize: '0.58rem', fontWeight: 900, whiteSpace: 'nowrap', zIndex: 10, fontFamily: "'DM Sans', sans-serif" }}>Copied!</div>
                              )}
                            </div>
                          </div>
                       </div>
                       {/* Creator row with avatar — clickable profile */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}
                         onClick={() => openProfileModal(trip.creatorUid, trip.creatorName)}>
                         {profileCache[trip.creatorUid]
                           ? <img src={profileCache[trip.creatorUid]} alt={trip.creatorName} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #ffb703' }} />
                           : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: creatorAv.bg, flexShrink: 0,
                               display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'white', fontFamily: "'DM Sans', sans-serif" }}>
                               {creatorAv.initials}
                             </div>
                         }
                         <div style={{ fontSize: '1rem', color: '#081c15', fontWeight: 900, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline', textDecorationColor: 'rgba(8,28,21,0.2)' }}>{trip.creatorName.toUpperCase()}</div>
                       </div>

                       {/* Trip Route UI */}
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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

                       {/* Feature 12: Weather widget */}
                       {weatherData[trip.destination] && (
                         <div style={{ fontSize: '0.65rem', color: 'rgba(8,28,21,0.55)', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px', fontWeight: 600 }}>
                           📍 <span style={{ fontWeight: 900, color: 'rgba(8,28,21,0.7)' }}>{trip.destination}</span> · {weatherData[trip.destination]}
                         </div>
                       )}

                       {/* Feature 5: Tags */}
                       {(trip.tags || []).length > 0 && (
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                           {trip.tags.map(tag => (
                             <span key={tag} style={{ padding: '3px 10px', borderRadius: '50px', background: 'rgba(255,183,3,0.12)', color: '#b07d00', fontSize: '0.58rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{tag}</span>
                           ))}
                         </div>
                       )}
                     </div>

                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '2px solid rgba(8,28,21,0.1)', paddingTop: '15px' }}>
                        <div style={{ minWidth: 0 }}>
                           <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.5)', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>DATE</div>
                           <div style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', color: '#081c15', fontWeight: 900, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>{new Date(trip.date).toLocaleDateString('en-GB')}</div>
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
                     {!isMobile && <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '4px', color: 'rgba(8,28,21,0.5)', marginBottom: '30px' }}>TRIP</div>}
                     <button
                        onClick={() => !requested && !isFull && handleRequestMatch(trip._id)}
                        disabled={requested || isFull}
                        style={{ width: isMobile ? '42px' : '50px', height: isMobile ? '42px' : '50px', borderRadius: '50%',
                          background: accepted ? '#1b4332' : isFull ? 'rgba(8,28,21,0.2)' : requested ? 'rgba(8,28,21,0.1)' : '#081c15',
                          color: accepted ? '#d8f3dc' : isFull ? 'rgba(8,28,21,0.4)' : requested ? '#081c15' : '#ffb703',
                          border: 'none', cursor: requested || isFull ? 'default' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                          boxShadow: requested || isFull ? 'none' : '0 10px 15px rgba(0,0,0,0.2)', transition: 'all 0.2s', flexShrink: 0 }}
                     >
                        {accepted ? <CheckCircle size={isMobile ? 20 : 24}/> : isFull ? <XCircle size={isMobile ? 20 : 24}/> : requested ? <CheckCircle size={isMobile ? 20 : 24}/> : <PlusCircle size={isMobile ? 20 : 24}/>}
                     </button>
                     <div style={{ fontSize: isMobile ? '0.5rem' : '0.6rem', fontWeight: 900, textAlign: 'center', color: '#081c15', letterSpacing: isMobile ? '0' : '1px' }}>
                       {accepted ? 'IN GROUP' : isFull ? 'FULL' : requested ? 'PENDING' : 'JOIN'}
                     </div>
                     {/* Seats progress */}
                     {!isMobile && (
                       <div style={{ width: '100%', marginTop: '4px' }}>
                         <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(8,28,21,0.5)', textAlign: 'center', marginBottom: '4px', letterSpacing: '0.5px' }}>
                           {acceptedCount}/{maxSlots} SEATS
                         </div>
                         <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                           {Array.from({ length: maxSlots }).map((_, i) => (
                             <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px',
                               background: i < acceptedCount ? '#081c15' : 'rgba(8,28,21,0.2)' }} />
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              )})}
            </div>
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
                    const countdown = getDaysUntil(trip.date);
                    const acceptedMatches = trip.matches.filter(m => m.status === 'accepted');
                    return (
                    <div key={trip._id} style={{ padding: '20px', borderRadius: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.95)', borderLeft: hasAccepted ? '8px solid #ffb703' : '8px solid #081c15', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                       <Globe size={150} color="black" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }} />
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                         <div style={{ fontSize: '0.65rem', color: '#081c15', fontWeight: 900, opacity: 0.5, letterSpacing: '2px' }}>TRIP INFO</div>
                         {/* Feature 2: countdown badge */}
                         <div style={{ background: countdown.color, color: countdown.color === 'rgba(8,28,21,0.3)' ? 'rgba(8,28,21,0.5)' : countdown.color === '#22c55e' ? 'white' : '#081c15', padding: '3px 10px', borderRadius: '50px', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                           {countdown.label === 'DEPARTED' ? 'TRIP PASSED' : countdown.label}
                         </div>
                       </div>
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
                       <div style={{ fontSize: '0.7rem', color: hasAccepted ? '#ffb703' : 'rgba(8,28,21,0.5)', fontWeight: 900, marginBottom: '16px', padding: '4px 10px', background: hasAccepted ? 'rgba(255,183,3,0.1)' : 'rgba(8,28,21,0.05)', borderRadius: '50px', display: 'inline-block', marginTop: '6px' }}>{hasAccepted ? 'TRIP STARTED' : 'TRIP LISTED'}</div>

                       {/* Feature 10: Group Members */}
                       <div style={{ marginBottom: '14px' }}>
                         <div style={{ fontSize: '0.6rem', color: 'rgba(8,28,21,0.4)', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>GROUP MEMBERS</div>
                         <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                           {acceptedMatches.length === 0 ? (
                             <span style={{ color: 'rgba(8,28,21,0.3)', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif" }}>(empty)</span>
                           ) : acceptedMatches.map(m => {
                             const av = getAvatar(m.requesterName);
                             return (
                               <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                 <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: 'white', border: '2px solid #ffb703' }}>{av.initials}</div>
                                 <span style={{ fontSize: '0.52rem', color: 'rgba(8,28,21,0.5)', fontFamily: "'DM Sans', sans-serif", maxWidth: '40px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.requesterName.split(' ')[0]}</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>

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
                    const isPast = new Date(trip.date) < new Date();
                    const existingRating = getRating(trip._id);
                    const rInput = ratingInputs[trip._id] || {};
                    const countdown = getDaysUntil(trip.date);
                    return (
                    <div key={trip._id} style={{ padding: '20px', borderRadius: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.95)', borderLeft: isAccepted ? '8px solid #d8f3dc' : '8px solid #ffb703', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                       <Globe size={150} color="black" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }} />
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                         <div style={{ fontSize: '0.65rem', color: '#081c15', fontWeight: 900, opacity: 0.5, letterSpacing: '2px' }}>POSTED BY: {trip.creatorName.toUpperCase()}</div>
                         {/* Feature 2: countdown badge */}
                         <div style={{ background: countdown.color, color: countdown.color === 'rgba(8,28,21,0.3)' ? 'rgba(8,28,21,0.5)' : countdown.color === '#22c55e' ? 'white' : '#081c15', padding: '3px 10px', borderRadius: '50px', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                           {countdown.label === 'DEPARTED' ? 'TRIP PASSED' : countdown.label}
                         </div>
                       </div>
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
                       {/* Feature 7: Rate Your Buddy */}
                       {isAccepted && isPast && (
                         <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(255,183,3,0.06)', borderRadius: '12px', border: '1px solid rgba(255,183,3,0.15)' }}>
                           {existingRating || rInput.submitted ? (
                             <div style={{ color: '#1b4332', fontSize: '0.75rem', fontWeight: 900, fontFamily: "'DM Sans', sans-serif" }}>Rating submitted ✓</div>
                           ) : (
                             <>
                               <div style={{ color: '#081c15', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" }}>⭐ RATE YOUR BUDDY</div>
                               <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                                 {[1,2,3,4,5].map(s => (
                                   <button key={s} type="button" onClick={() => setRatingInputs(prev => ({ ...prev, [trip._id]: { ...(prev[trip._id] || {}), score: s } }))}
                                     style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '2px',
                                       color: (rInput.score || 0) >= s ? '#ffb703' : 'rgba(8,28,21,0.2)', transition: 'all 0.15s' }}>★</button>
                                 ))}
                               </div>
                               <input value={rInput.comment || ''} onChange={e => setRatingInputs(prev => ({ ...prev, [trip._id]: { ...(prev[trip._id] || {}), comment: e.target.value } }))}
                                 placeholder="Short comment (optional)"
                                 style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(8,28,21,0.1)', background: 'rgba(8,28,21,0.03)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                               <button onClick={() => saveRating(trip._id, rInput.score || 0, rInput.comment || '')} disabled={!rInput.score}
                                 style={{ padding: '7px 18px', background: rInput.score ? '#ffb703' : 'rgba(8,28,21,0.1)', color: '#081c15', border: 'none', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, cursor: rInput.score ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>
                                 SUBMIT
                               </button>
                             </>
                           )}
                         </div>
                       )}
                    </div>
                  )})}
               </div>
            </div>
          )}
          {/* Feature 11: Cost Estimator */}
          {view === 'cost' && (
            <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', padding: isMobile ? '0 0 100px' : '0 20px 60px', minHeight: isMobile ? 'calc(100svh - 160px)' : 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(90deg, transparent, #ffb703)' }} />
                <span style={{ color: '#ffb703', fontWeight: 900, letterSpacing: '3px', fontSize: isMobile ? '0.68rem' : '0.72rem', fontFamily: "'DM Sans', sans-serif" }}>AI COST ESTIMATOR</span>
                <div style={{ width: '32px', height: '1.5px', background: 'linear-gradient(-90deg, transparent, #ffb703)' }} />
              </div>

              {/* Form card */}
              <div style={{ background: 'rgba(10,20,16,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', padding: isMobile ? '24px 20px 20px' : '36px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', marginBottom: '16px' }}>

                {/* Route row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'rgba(255,183,3,0.7)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '7px', fontFamily: "'DM Sans', sans-serif" }}>FROM</label>
                    <input value={costOrigin} onChange={e => setCostOrigin(e.target.value)} placeholder="Origin city"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', boxSizing: 'border-box', WebkitAppearance: 'none', WebkitTextFillColor: 'white', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(255,183,3,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div style={{ marginTop: '20px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,183,3,0.12)', border: '1px solid rgba(255,183,3,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#ffb703', fontSize: '0.7rem', fontWeight: 900 }}>→</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'rgba(255,183,3,0.7)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '7px', fontFamily: "'DM Sans', sans-serif" }}>TO</label>
                    <input value={costDest} onChange={e => setCostDest(e.target.value)} placeholder="Destination"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', boxSizing: 'border-box', WebkitAppearance: 'none', WebkitTextFillColor: 'white', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(255,183,3,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>

                {/* Number of days with stepper */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,183,3,0.7)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '7px', fontFamily: "'DM Sans', sans-serif" }}>NUMBER OF DAYS</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" onClick={() => setCostDays(d => Math.max(1, (parseInt(d) || 1) - 1))}
                      style={{ width: '44px', height: '50px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>−</button>
                    <input type="number" min={1} max={30} value={costDays} placeholder="e.g. 5"
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '') { setCostDays(''); return; }
                        const n = parseInt(v);
                        if (!isNaN(n)) setCostDays(Math.min(30, Math.max(1, n)));
                      }}
                      style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', boxSizing: 'border-box', WebkitAppearance: 'none', WebkitTextFillColor: 'white', textAlign: 'center', fontWeight: 700, transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(255,183,3,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <button type="button" onClick={() => setCostDays(d => Math.min(30, (parseInt(d) || 0) + 1))}
                      style={{ width: '44px', height: '50px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ffb703', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>+</button>
                  </div>
                </div>

                {/* Travel Style */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,183,3,0.7)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '7px', fontFamily: "'DM Sans', sans-serif" }}>TRAVEL STYLE</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { label: 'Budget', emoji: '🪙' },
                      { label: 'Comfort', emoji: '✈️' },
                      { label: 'Luxury', emoji: '💎' },
                    ].map(({ label, emoji }) => (
                      <button key={label} type="button" onClick={() => setCostStyle(label)}
                        style={{ flex: 1, padding: '13px 6px', borderRadius: '14px', border: costStyle === label ? 'none' : '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s',
                          background: costStyle === label ? '#ffb703' : 'rgba(255,255,255,0.04)', color: costStyle === label ? '#081c15' : 'rgba(255,255,255,0.55)' }}>
                        <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCostEstimate} disabled={costLoading}
                  style={{ width: '100%', padding: '17px', background: costLoading ? 'rgba(255,183,3,0.3)' : 'linear-gradient(135deg, #ffb703 0%, #ff8c00 100%)', color: '#081c15', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem', letterSpacing: '2px', cursor: costLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: costLoading ? 'none' : '0 8px 24px rgba(255,183,3,0.25)', transition: 'all 0.2s' }}>
                  {costLoading ? '⏳ CALCULATING...' : '✨ ESTIMATE COST'}
                </button>
              </div>
              {costResult && (
                <div style={{ background: 'rgba(10,20,16,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', padding: isMobile ? '22px 20px' : '28px', border: '1px solid rgba(255,183,3,0.2)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                  {/* Trip summary pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: '8px 14px', background: 'rgba(255,183,3,0.08)', borderRadius: '50px', border: '1px solid rgba(255,183,3,0.15)', width: 'fit-content' }}>
                    <span style={{ fontSize: '0.65rem', color: '#ffb703', fontWeight: 900, fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px' }}>
                      {costOrigin} → {costDest} · {costDays}D · {costStyle.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>COST BREAKDOWN</div>
                  {[
                    { key: 'transport', label: 'Transport', icon: '✈️' },
                    { key: 'accommodation', label: 'Stay', icon: '🏨' },
                    { key: 'food', label: 'Food', icon: '🍽️' },
                    { key: 'activities', label: 'Activities', icon: '🎭' },
                    { key: 'misc', label: 'Misc', icon: '💼' },
                  ].map(({ key, label, icon }) => {
                    const val = costResult[key] || 0;
                    const pct = costResult.total > 0 ? (val / costResult.total * 100) : 0;
                    return (
                      <div key={key} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}><span>{icon}</span>{label}</span>
                          <span style={{ color: '#ffb703', fontWeight: 900, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>₹{val.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, rgba(255,183,3,0.6), #ff8c00)', borderRadius: '6px', transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ background: 'rgba(255,183,3,0.07)', borderRadius: '16px', padding: '16px 18px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,183,3,0.15)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px' }}>ESTIMATED TOTAL</span>
                    <span style={{ color: '#ffb703', fontWeight: 900, fontSize: '1.5rem', fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>₹{(costResult.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {(costResult.tips || []).length > 0 && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>SMART TIPS</div>
                      {costResult.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#ffb703', fontSize: '0.7rem', flexShrink: 0, marginTop: '1px' }}>✦</span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setCostResult(null)} style={{ width: '100%', marginTop: '16px', padding: '13px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    ← NEW ESTIMATE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feature 6: Profile */}
          {view === 'profile' && (
            <div style={{ maxWidth: '600px', margin: isMobile ? '0 -12px' : '0 auto' }}>
              <button onClick={() => setView('feed')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px', marginBottom: '14px', padding: isMobile ? '0 12px' : '0' }}>
                ← BACK TO EXPLORE
              </button>
              <div style={{ background: 'rgba(8,20,14,0.85)', backdropFilter: 'blur(20px)', borderRadius: isMobile ? '20px' : '24px', padding: isMobile ? '24px 20px' : '36px', border: '1px solid rgba(255,183,3,0.15)', marginBottom: '20px' }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                  <label htmlFor="la-avatar-input" style={{ position: 'relative', marginBottom: '14px', cursor: 'pointer', display: 'block' }}>
                    {avatarUploading ? (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,183,3,0.15)', border: '3px solid #ffb703', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '24px', height: '24px', border: '3px solid #ffb703', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : avatarImg ? (
                      <img src={avatarImg} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffb703', display: 'block' }} />
                    ) : (() => { const av = getAvatar(user.name); return (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: 'white', border: '3px solid #ffb703' }}>{av.initials}</div>
                    ); })()}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%',
                      background: '#ffb703', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)', border: '2px solid rgba(8,28,21,0.9)' }}>
                      <span style={{ fontSize: '0.7rem' }}>📷</span>
                    </div>
                  </label>
                  <input id="la-avatar-input" ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive", letterSpacing: '2px' }}>{(user.name || 'USER').toUpperCase()}</div>
                  {user.metadata?.creationTime && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>Member since {new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>}
                  <div style={{ color: 'rgba(255,183,3,0.5)', fontSize: '0.58rem', marginTop: '6px', fontFamily: "'DM Sans', sans-serif" }}>tap avatar to change photo</div>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'TRIPS POSTED', value: myTrips.created.length },
                    { label: 'TRIPS JOINED', value: myTrips.requested.length },
                    { label: 'ACCEPTED', value: myTrips.requested.filter(t => t.matches?.some(m => m.requesterUid === user.uid && m.status === 'accepted')).length },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,183,3,0.07)', border: '1px solid rgba(255,183,3,0.15)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#ffb703', fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Bebas Neue', cursive" }}>{stat.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                {/* Bio */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>YOUR BIO</label>
                  <textarea value={bio} onChange={e => e.target.value.length <= 200 && setBio(e.target.value)}
                    placeholder="Tell fellow travelers a bit about yourself..."
                    style={{ width: '100%', height: '90px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontFamily: "'DM Sans', sans-serif" }}>{bio.length}/200</span>
                    <button onClick={handleSaveProfile}
                      style={{ padding: '8px 20px', background: '#ffb703', color: '#081c15', border: 'none', borderRadius: '50px', fontWeight: 900, fontSize: '0.65rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>SAVE</button>
                  </div>
                </div>
                {/* Trips at a glance */}
                {myTrips.created.length > 0 && (
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" }}>YOUR TRIPS AT A GLANCE</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {myTrips.created.map(t => (
                        <div key={t._id} style={{ padding: '6px 14px', background: 'rgba(255,183,3,0.08)', border: '1px solid rgba(255,183,3,0.2)', borderRadius: '50px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
                          {t.origin} → {t.destination}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'contribute' && (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', padding: '6px 16px', borderRadius: '50px', marginBottom: isMobile ? '12px' : '20px' }}>
                  <FileText size={12} color="#ffb703" />
                  <span style={{ color: '#ffb703', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px' }}>COMMUNITY BLUEPRINT</span>
                </div>
                <h2 style={{ color: 'white', fontFamily: "'Bebas Neue', cursive", fontSize: isMobile ? '2rem' : '3rem', margin: 0, letterSpacing: '3px' }}>CONTRIBUTE A TRIP</h2>
                {!isMobile && <p style={{ color: 'rgba(216,243,220,0.5)', fontSize: '0.85rem', marginTop: '10px', fontFamily: "'DM Sans', sans-serif" }}>Share your travel experience. Our AI will transform it into an interactive itinerary.</p>}
              </div>

              {/* Text area + mic */}
              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '16px' : '24px', padding: isMobile ? '16px' : '30px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: 'rgba(216,243,220,0.6)', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>YOUR RAW ITINERARY</span>
                  <button
                    onClick={startListening}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: isMobile ? '7px 14px' : '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                      background: isListening ? 'rgba(255,59,59,0.2)' : 'rgba(255,183,3,0.15)',
                      color: isListening ? '#ff3b3b' : '#ffb703',
                      fontWeight: 900, fontSize: '0.65rem', letterSpacing: '1px',
                      transition: 'all 0.3s',
                      boxShadow: isListening ? '0 0 20px rgba(255,59,59,0.4)' : 'none',
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    {isListening ? 'LISTENING...' : 'MIC'}
                  </button>
                </div>
                <textarea
                  value={itineraryText}
                  onChange={e => setItineraryText(e.target.value)}
                  placeholder={'Describe your trip...\n\nExample: "Went to Manali for 3 days, stayed at Old Manali. Day 1 explored the mall road. Day 2 visited Jogini Falls..."'}
                  style={{
                    width: '100%', height: isMobile ? '160px' : '220px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                    padding: '14px', color: 'white', fontSize: isMobile ? '0.82rem' : '0.9rem', lineHeight: 1.6,
                    outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
                {isListening && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i}
                        animate={{ scaleY: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                        style={{ width: '4px', height: '18px', background: '#ff3b3b', borderRadius: '2px' }}
                      />
                    ))}
                    <span style={{ color: '#ff3b3b', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>RECORDING...</span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleContributionSubmit}
                disabled={isSubmittingContrib || !itineraryText.trim()}
                style={{
                  width: '100%', padding: isMobile ? '15px' : '20px',
                  background: isSubmittingContrib || !itineraryText.trim()
                    ? 'rgba(255,183,3,0.3)'
                    : 'linear-gradient(135deg, #ffb703, #ff8c00)',
                  color: '#081c15', border: 'none', borderRadius: '14px',
                  fontWeight: 900, fontSize: isMobile ? '0.85rem' : '1rem', letterSpacing: '2px',
                  cursor: isSubmittingContrib || !itineraryText.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: itineraryText.trim() ? '0 8px 24px rgba(255,183,3,0.35)' : 'none',
                  transition: 'all 0.3s', fontFamily: "'DM Sans', sans-serif"
                }}
              >
                <Send size={16} />
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
