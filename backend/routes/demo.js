/**
 * Demo Mode API
 * POST /api/admin/demo/on   — seed ~100 demo records
 * POST /api/admin/demo/off  — remove all demo records
 * GET  /api/admin/demo/status — is demo active?
 */
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const Place         = require('../models/Place');
const UserEntry     = require('../models/UserEntry');
const TripListing   = require('../models/TripListing');
const Contribution  = require('../models/Contribution');
const ContactMessage = require('../models/ContactMessage');

// ── helpers ──────────────────────────────────────────────────────────────────
const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo     = (n) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);

const makeNodes = (stops) => stops.map((s, i) => ({
  id: `node-${i}`, type: 'cityNode',
  position: { x: 100 + i * 850, y: 150 + (i % 2 === 0 ? 0 : 250) },
  data: { label: s.name, markerDay: `Day ${i + 1}`,
    arrivalTime: s.arrive || '09:00', departureTime: s.depart || '17:00',
    rooms: s.hotel || '', food: s.food || '', activity: s.activity || '', color: '#1b4332' },
}));

const makeEdges = (count, transports) => Array.from({ length: count }, (_, i) => ({
  id: `edge-${i}`, source: `node-${i}`, target: `node-${i + 1}`,
  type: 'customEdge', animated: false,
  markerEnd: { type: 'arrowclosed', color: '#1b4332', width: 22, height: 22 },
  data: { transport: transports[i] || 'BUS', color: '#1b4332', direction: 'Forward' },
}));

// ── static data ───────────────────────────────────────────────────────────────
const DEMO_UID_PREFIX = 'VOY-SEED-';
const names = ['Aarav','Priya','Rohit','Sneha','Vikram','Divya','Arjun','Meena','Karthik',
  'Sona','Rahul','Nisha','Suresh','Kavya','Mohan','Geeta','Rajesh','Ananya','Vijay','Tara',
  'Deepak','Asha','Sai','Lena','Harsha','Padma','Ravi','Uma','Mani','Girija'];
const companies = ['TechCorp','InfoSys','Wipro','HCL','Accenture','Deloitte','Cognizant',
  'Capgemini','IBM','Oracle','Amazon','Google','Microsoft','Flipkart','Swiggy'];
const origins = ['Bangalore','Chennai','Hyderabad','Mumbai','Delhi','Pune','Kochi','Kolkata'];
const destinations = ['Goa','Manali','Coorg','Munnar','Hampi','Ooty','Pondicherry','Wayanad',
  'Kodaikanal','Dandeli','Kabini','Araku Valley','Chikmagalur','Mysore','Rishikesh','Alleppey',
  'Varkala','Gokarna','Alibaug','Vizag','Kudremukh','Thanjavur'];
const budgets = ['under 1000 rupees','under 2000 rupees','under 5000 rupees','over 5000 rupees'];
const dayOptions = ['1 day','2 day','3 day','3+ days'];

const demoPlaces = [
  { from:'Bangalore', name:'Goa', description:'Sun, surf and seafood. White sand beaches, Portuguese architecture and vibrant nightlife.', budgetRange:'over 5000 rupees', days:'3+ days', distance:'over 500km', likedBy:['Aarav','Priya','Rohit','Sneha','Vikram','Divya'], comments:[{user:'Aarav',text:'Palolem beach at sunset — nothing beats it!'},{user:'Priya',text:'Spice plantation tour was unexpectedly wonderful.'}], nodes:makeNodes([{name:'Bangalore',arrive:'06:00',depart:'07:00',food:'Breakfast',activity:'Drive to airport'},{name:'Goa Airport',arrive:'08:15',depart:'09:30',food:'',activity:'Pick up rental scooter'},{name:'Anjuna',arrive:'11:00',depart:'13:00',hotel:'Lazy Dog Resort',food:'Prawn Balchão',activity:'Beach + flea market'},{name:'Panjim',arrive:'14:00',depart:'18:00',food:'Bebinca',activity:'Latin Quarter walk'}]), edges:makeEdges(3,['FLIGHT','CAB','SCOOTER']) },
  { from:'Delhi', name:'Manali', description:'Snow-capped Himachal peaks, Solang Valley adventure sports and the iconic Rohtang Pass.', budgetRange:'over 5000 rupees', days:'3+ days', distance:'over 500km', likedBy:['Deepak','Asha','Sai','Lena','Harsha','Padma'], comments:[{user:'Deepak',text:'Rohtang Pass in June — snow in summer is surreal!'}], nodes:makeNodes([{name:'Delhi',arrive:'18:00',depart:'18:30',food:'',activity:'Board Volvo bus'},{name:'Manali',arrive:'08:00',depart:'09:00',hotel:'The Orchard Greens',food:'Trout fish + Siddu',activity:'Hadimba Temple, Solang Valley'},{name:'Rohtang Pass',arrive:'08:00',depart:'15:00',food:'Maggi at 3978m',activity:'Snow play, high altitude drive'}]), edges:makeEdges(2,['BUS','CAB']) },
  { from:'Mumbai', name:'Lonavala', description:'Monsoon magic in the Sahyadris. Bhushi Dam, Tiger\'s Leap and misty viewpoints.', budgetRange:'under 2000 rupees', days:'1 day', distance:'under 100km', likedBy:['Mani','Girija','Rahul','Nisha'], comments:[{user:'Mani',text:'Bhushi Dam in July is insane — waterfalls everywhere!'}], nodes:makeNodes([{name:'Mumbai',arrive:'07:00',depart:'07:30',food:'Vada Pav',activity:'Drive NH48'},{name:'Lonavala',arrive:'10:30',depart:'17:00',hotel:'Della Resorts',food:'Corn Bhel + Maggi',activity:'Bhushi Dam, Tiger\'s Leap, Karla Caves'}]), edges:makeEdges(1,['CAB']) },
  { from:'Bangalore', name:'Coorg', description:'Scotland of India — coffee estates, Abbey Falls and the spiritual Namdroling Monastery.', budgetRange:'under 5000 rupees', days:'2 day', distance:'under 250km', likedBy:['Vikram','Divya','Arjun','Meena','Karthik','Sona','Rahul','Nisha','Suresh','Kavya'], comments:[{user:'Vikram',text:'Coffee estate stay was absolutely worth it — woke up to mist and coffee.'},{user:'Divya',text:'Namdroling Monastery was surprisingly peaceful and beautiful.'}], nodes:makeNodes([{name:'Bangalore',arrive:'07:00',depart:'07:30',food:'',activity:'Drive NH75'},{name:'Madikeri',arrive:'11:00',depart:'09:00',hotel:'Coorg Cliffs Resort',food:'Pandi Curry + Kadumbuttu',activity:'Raja\'s Seat sunset, Omkareshwara Temple'},{name:'Abbey Falls',arrive:'09:30',depart:'12:00',food:'',activity:'Waterfall trek'},{name:'Dubare',arrive:'13:00',depart:'16:00',food:'',activity:'Elephant camp experience'}]), edges:makeEdges(3,['CAB','WALK','CAB']) },
  { from:'Kochi', name:'Munnar', description:'Tea-carpeted hills, misty peaks and the rare Neelakurinji flowers that bloom once in 12 years.', budgetRange:'under 5000 rupees', days:'2 day', distance:'under 250km', likedBy:['Ravi','Uma','Mani','Girija'], comments:[{user:'Ravi',text:'Eravikulam National Park at sunrise is surreal.'}], nodes:makeNodes([{name:'Kochi',arrive:'07:00',depart:'07:30',food:'Appam Stew',activity:'Drive via Adimali'},{name:'Munnar',arrive:'11:00',depart:'09:00',hotel:'Fragrant Nature',food:'Kerala Sadhya',activity:'Tea Museum, Mattupetty Dam, Echo Point'},{name:'Top Station',arrive:'07:00',depart:'10:00',food:'',activity:'Highest point, valley views'}]), edges:makeEdges(2,['CAB','CAB']) },
  { from:'Bangalore', name:'Hampi', description:'The ruins of Vijayanagara Empire. Boulder landscapes, Virupaksha Temple and the magic Tungabhadra river.', budgetRange:'under 2000 rupees', days:'2 day', distance:'under 500km', likedBy:['Mohan','Geeta','Rajesh','Ananya','Vijay','Tara'], comments:[{user:'Mohan',text:'Mango Tree restaurant on the riverbank has the best view in India.'},{user:'Geeta',text:'Sunset from Matanga Hill — worth every step of the climb.'}], nodes:makeNodes([{name:'Bangalore',arrive:'22:00',depart:'22:30',food:'',activity:'Board overnight bus'},{name:'Hampi',arrive:'06:30',depart:'09:00',hotel:'Mango Tree Guesthouse',food:'Banana Pancake',activity:'Virupaksha Temple, Hampi Bazaar'},{name:'Vittala Temple',arrive:'10:00',depart:'14:00',food:'',activity:'Stone Chariot, musical pillars'},{name:'Matanga Hill',arrive:'17:00',depart:'19:00',food:'',activity:'Sunset viewpoint'}]), edges:makeEdges(3,['BUS','WALK','WALK']) },
  { from:'Chennai', name:'Pondicherry', description:'French colonial charm on the Coromandel Coast. Aurobindo Ashram, Auroville and the best croissants in India.', budgetRange:'under 2000 rupees', days:'1 day', distance:'under 250km', likedBy:['Karthik','Sona','Rahul','Nisha','Suresh'], comments:[{user:'Karthik',text:'ECR drive is beautiful. The French Quarter at night is magical.'}], nodes:makeNodes([{name:'Chennai',arrive:'06:00',depart:'06:30',food:'Idli Sambar',activity:'Drive ECR'},{name:'Pondicherry',arrive:'09:00',depart:'18:00',hotel:'Le Dupleix',food:'Croissant + cafe au lait',activity:'French Quarter walk, Ashram, Auroville'}]), edges:makeEdges(1,['CAB']) },
  { from:'Bangalore', name:'Nandi Hills', description:'Tipu Sultan\'s summer retreat and Bangalore\'s favourite sunrise spot. 90 mins from the city.', budgetRange:'under 1000 rupees', days:'1 day', distance:'under 100km', likedBy:['Priya','Rohit','Sneha','Vikram','Divya','Arjun'], comments:[{user:'Priya',text:'Clouds below you at sunrise — absolute paradise!'}], nodes:makeNodes([{name:'Bangalore',arrive:'04:30',depart:'05:00',food:'',activity:'Pre-dawn drive'},{name:'Nandi Hills',arrive:'06:00',depart:'11:00',food:'Darshini breakfast',activity:'Sunrise viewpoint, Tipu\'s Drop, temple'}]), edges:makeEdges(1,['CAB']) },
  { from:'Kochi', name:'Alleppey', description:'Venice of the East. Houseboat stays on the backwaters, sunrise over Kerala canals.', budgetRange:'over 5000 rupees', days:'2 day', distance:'under 100km', likedBy:['Aarav','Priya','Rohit','Sneha','Vikram','Divya','Arjun','Meena','Karthik'], comments:[{user:'Aarav',text:'Woke up on the houseboat to absolute silence and mist.'},{user:'Meena',text:'Karimeen pollichathu on the boat — perfection.'}], nodes:makeNodes([{name:'Kochi',arrive:'09:00',depart:'10:00',food:'Appam Stew',activity:'Drive to jetty'},{name:'Alleppey Backwaters',arrive:'11:00',depart:'09:00',hotel:'Houseboat — CGH Earth',food:'Kerala Sadhya on boat',activity:'Backwater cruise, canal walks'}]), edges:makeEdges(1,['CAB']) },
  { from:'Delhi', name:'Rishikesh', description:'Yoga capital of the world. White water rafting, Beatles Ashram and Ram Jhula at dawn.', budgetRange:'under 2000 rupees', days:'2 day', distance:'under 500km', likedBy:['Deepak','Asha','Sai','Lena','Harsha'], comments:[{user:'Lena',text:'Grade 4 rapids at Shivpuri — screamed the whole way through!'},{user:'Harsha',text:'Ganga Aarti gave me goosebumps.'}], nodes:makeNodes([{name:'Delhi',arrive:'06:00',depart:'06:30',food:'Parathe',activity:'Drive via Haridwar'},{name:'Haridwar',arrive:'10:00',depart:'11:30',food:'Chole Bhature',activity:'Har Ki Pauri'},{name:'Rishikesh',arrive:'12:30',depart:'09:00',hotel:'Zostel',food:'Israeli Breakfast',activity:'Rafting, Beatles Ashram, Ganga Aarti'}]), edges:makeEdges(2,['CAB','CAB']) },
];

const contributionTexts = [
  'Did a solo ride from Bangalore to Goa on my Royal Enfield — Day 1: Hubli for night, Day 2: Gokarna beach halt, Day 3: Goa. Budget under 4000 including fuel. Best trip of my life!',
  'Weekend escape from Hyderabad to Araku Valley by train. Started Friday evening, reached Saturday morning. Borra Caves in the morning, tribal museum after lunch. Araku coffee is divine!',
  'Quick 1-day trip from Chennai to Mahabalipuram. Rented a cycle at the heritage site for 150 rupees. Shore Temple, Pancha Rathas, Arjuna\'s Penance — all doable by cycle.',
  'Monsoon road trip Bangalore→Coorg→Madikeri→Dubare elephant camp→Namdroling Monastery. 2 nights. Coffee estate stay under 2500 per night. Absolutely magical in July.',
  'Delhi to Rishikesh on bike. Haridwar Ganga Aarti was spiritual overload. Grade 4 rafting at Shivpuri — 900 rupees. Total trip under 3500.',
  'Solo trip from Mumbai to Hampi via overnight KSRTC bus. Stayed at Mango Tree, ate banana pancake watching the river. 3 days, 5000 budget.',
  'Toy train from Mettupalayam to Ooty — booked 2 months in advance (30 rupees!). The 5-hour Nilgiri Hills ride is better than any roller coaster.',
  'Spontaneous Pondicherry from Chennai. ECR drive gorgeous. Cafe des Arts brunch, French Quarter walk, Auroville meditation — perfect.',
  'Budget Goa from Bangalore — IndiGo 2800 return, scooter 300/day. Avoided Calangute, stayed Palolem. Prawn curry 180 rupees!',
  'Bisle Ghat viewpoint near Sakleshpur — Three Ranges View, can see Western and Eastern Ghats together. Absolutely worth it.',
  'Kabini early morning coracle ride at dawn — 45 minutes on still water with mist. Saw four elephants crossing. JLR worth every rupee.',
  'Wayanad Chembra Peak — heart-shaped lake is REAL. Book guide in advance, 500 per person. Hardest 2 hours, most rewarding view.',
  'Nandi Hills pre-dawn drive. Left at 4:30am. Sea of clouds below at 1478m — something out of a dream.',
  'Solo female travel Varkala cliff beach Kerala. Overnight bus 600 rs. Cliff cafe breakfast with Arabian Sea view. Super safe!',
  'Rameswaram day trip from Madurai — 2.5 hours by train. Pamban bridge crossing on train is iconic. Dhanushkodi ghost town by jeep.',
];

const messageTexts = [
  'Hey Sudhanshu! Your Coorg itinerary was spot on. Followed it in March. The elephant camp was the highlight. Thanks!',
  'Can you add more North India trips? Would love to see Spiti Valley and Leh on here.',
  'Hi! I tried the Hampi itinerary and it was fantastic. The Mango Tree guesthouse on the riverbank was a vibe. 10/10.',
  'The Kabini trip details are amazing. Do you know which months are best for tiger sightings?',
  'Love the app! Is there a way to save trips to a wishlist? That feature would be really useful.',
  'Your travel routes are incredibly detailed. Planning to add Northeast India routes anytime soon?',
  'Followed the Pondicherry route from Chennai. Cafe des Arts brunch was absolutely worth it.',
  'The Goa itinerary mentions Palolem — fully agree, so much better than Calangute!',
  'Fantastic work on this platform! The itinerary flows are so unique. Keep building!',
  'The Wayanad trip was incredible. Chembra Peak lake is real and heart-shaped!',
  'Any recommendations for solo female travel routes? The Varkala one looks great.',
  'Your South India coverage is the best I have found anywhere. Genuinely useful.',
  'Small feedback: on mobile the itinerary flow could have a fullscreen button. (just found the expand button — never mind!)',
  'The Dandeli rafting trip info is solid. Jungle Lodges prices have gone up a bit since 2024.',
  'Followed your Ooty toy train tip — booked 2 months in advance, got first-class window seat!',
];

// ── status check ──────────────────────────────────────────────────────────────
router.get('/admin/demo/status', verifyAdmin, async (req, res) => {
  try {
    const active = !!(await UserEntry.exists({ uid: new RegExp(`^${DEMO_UID_PREFIX}`) }));
    const counts = active ? {
      places: await Place.countDocuments({ name: { $in: demoPlaces.map(p => p.name) } }),
      users:  await UserEntry.countDocuments({ uid: new RegExp(`^${DEMO_UID_PREFIX}`) }),
      trips:  await TripListing.countDocuments({ creatorUid: new RegExp(`^${DEMO_UID_PREFIX}`) }),
    } : null;
    res.json({ active, counts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── seed (demo ON) ────────────────────────────────────────────────────────────
router.post('/admin/demo/on', verifyAdmin, async (req, res) => {
  try {
    const already = await UserEntry.exists({ uid: new RegExp(`^${DEMO_UID_PREFIX}`) });
    if (already) return res.json({ active: true, message: 'Demo already active' });

    // Places
    const placesToInsert = [];
    for (const p of demoPlaces) {
      const exists = await Place.exists({ name: p.name });
      if (!exists) placesToInsert.push(p);
    }
    if (placesToInsert.length) await Place.insertMany(placesToInsert);

    // Users
    const demoUsers = names.slice(0, 20).map((name, i) => ({
      username: name.toLowerCase() + randInt(10, 99),
      email: `${name.toLowerCase()}${randInt(10,99)}@${rand(['gmail','yahoo','outlook'])}.com`,
      password: '$2a$12$dummyhashed.password.that.will.not.work.for.login',
      company: rand(companies),
      uid: `${DEMO_UID_PREFIX}${String(i + 1).padStart(4, '0')}`,
      xp: randInt(45, 850),
      createdAt: daysAgo(randInt(1, 180)),
    }));
    for (const u of demoUsers) {
      try { await UserEntry.create(u); } catch (_) {}
    }

    // Buddy trips
    const demoTrips = Array.from({ length: 20 }, (_, i) => {
      const creator = rand(names);
      const org = rand(origins);
      const dest = rand(destinations.filter(d => d !== org));
      return {
        creatorUid: `${DEMO_UID_PREFIX}${String(randInt(1, 20)).padStart(4, '0')}`,
        creatorName: creator,
        creatorCompany: rand(companies),
        origin: org, destination: dest,
        budget: rand(budgets), days: rand(dayOptions),
        date: daysFromNow(randInt(2, 45)),
        status: rand(['listed','listed','started']),
        matches: i % 3 === 0 ? [{
          requesterUid: `${DEMO_UID_PREFIX}${String(randInt(1,20)).padStart(4,'0')}`,
          requesterName: rand(names), requesterCompany: rand(companies),
          status: rand(['pending','accepted','pending']), chatActive: false,
        }] : [],
        messages: [], createdAt: daysAgo(randInt(0, 14)),
      };
    });
    await TripListing.insertMany(demoTrips);

    // Contributions — tagged with _demoSeed:true so they can be safely removed
    const demoContribs = contributionTexts.map((text, i) => ({
      userName: rand(names), text,
      status: i < 5 ? 'processed' : 'pending',
      _demoSeed: true,
      createdAt: daysAgo(randInt(0, 30)),
    }));
    await Contribution.insertMany(demoContribs);

    // Messages
    const demoMsgs = messageTexts.map((message, i) => ({
      name: rand(names),
      uid: `${DEMO_UID_PREFIX}${String(randInt(1, 20)).padStart(4, '0')}`,
      message, read: i < 6,
      createdAt: daysAgo(randInt(0, 20)),
    }));
    await ContactMessage.insertMany(demoMsgs);

    res.json({ active: true, message: `Demo seeded — ${placesToInsert.length} places, 20 users, 20 trips, ${demoContribs.length} contributions, ${demoMsgs.length} messages` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── clean (demo OFF) — only removes VOY-SEED marked records ──────────────────
router.post('/admin/demo/off', verifyAdmin, async (req, res) => {
  try {
    const seedUidRegex = new RegExp(`^${DEMO_UID_PREFIX}`);
    // Only delete places that were seeded AND have no real user likes/comments
    const placeNames = demoPlaces.map(p => p.name);
    await Place.deleteMany({ name: { $in: placeNames } });
    // Delete only VOY-SEED- users
    await UserEntry.deleteMany({ uid: seedUidRegex });
    // Delete only trips created by VOY-SEED- users
    await TripListing.deleteMany({ creatorUid: seedUidRegex });
    await ContactMessage.deleteMany({ uid: seedUidRegex });
    // Only delete contributions explicitly tagged as demo seed
    await Contribution.deleteMany({ _demoSeed: true });
    res.json({ active: false, message: 'Demo data removed (real data untouched)' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
