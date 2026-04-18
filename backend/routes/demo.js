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
const destinations = ['Spiti Valley','Ladakh','Rajasthan','Andaman Islands','Meghalaya',
  'Varanasi','Gokarna','Ooty','Chikmagalur','Varkala','Hampi','Coorg','Munnar','Alleppey',
  'Rishikesh','Pondicherry','Manali','Goa','Dandeli','Kabini','Araku Valley','Vizag'];
const budgets = ['under 1000 rupees','under 2000 rupees','under 5000 rupees','over 5000 rupees'];
const dayOptions = ['1 day','2 day','3 day','3+ days'];

const demoPlaces = [

  /* ── 1. SPITI VALLEY ─────────────────────────────────────────────────────── */
  {
    from: 'Delhi', name: 'Spiti Valley',
    description: 'The Last Shangri-La. A bone-rattling 7-day circuit across the world\'s highest motorable roads — Shimla colonial hills, Kinnaur\'s apple orchards clinging to vertical cliffs, Nako Lake at 3,662m, Key Monastery perched like a fortress at 4,166m, the fossil-rich Hikkim post office (world\'s highest at 4,400m), Chandratal Lake\'s sapphire crescent at 4,300m, and the Atal Tunnel descent into Manali. No mobile network for 4 days. Pack warm clothes and an open mind.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Aarav','Deepak','Sai','Lena','Harsha','Rajesh','Vijay','Tara','Mohan'],
    comments: [
      { user: 'Deepak', text: 'Chandratal at 4300m under the Milky Way — no light pollution, no phone signal, just silence and stars. The most profound night of my life.' },
      { user: 'Lena', text: 'Key Monastery monk\'s chai at sunrise while reading 1000-year-old thangkas. This place breaks your brain in the best way.' },
      { user: 'Sai', text: 'Hikkim post office is real. I sent postcards home. They arrived 3 weeks later. Worth every rupee of the ₹20 stamp.' },
      { user: 'Rajesh', text: 'Kinnaur road is terrifying — single lane on a cliff face. The driver was calm. I was not. Do not take cabs without experience.' },
    ],
    nodes: makeNodes([
      { name: 'Delhi ISBT Kashmiri Gate', arrive: '05:30', depart: '06:00', food: 'Chole bhature at ISBT dhaba', activity: 'Board HRTC Volvo sleeper Delhi→Shimla — 9 hour journey, book front upper berth for mountain approach views' },
      { name: 'Shimla (The Ridge)', arrive: '15:30', depart: '09:00', hotel: 'Wildflower Hall, Mashobra (Cecil Hotel for budget)', food: 'Sidhu + Madra at Himachali Rasoi, Lakkar Bazaar', activity: 'Christ Church sunrise, The Ridge promenade, Jakhu Temple ropeway (2455m), Lower Bazaar woollens shopping' },
      { name: 'Kalpa, Kinnaur', arrive: '15:00', depart: '09:30', hotel: 'Kinner Kailash Guesthouse', food: 'Trout + Chhang (barley beer) at riverside dhaba', activity: 'Kinnaur Kailash sacred peak views (6050m), Roghi village suspension bridge, apple orchard walk, Recong Peo market' },
      { name: 'Nako Lake', arrive: '13:00', depart: '15:30', food: 'Butter tea + tsampa (roasted barley) at monastery', activity: 'Sacred Nako Lake at 3662m, ancient Nako Monastery (11th century Rinchen Zangpo), willow grove circumambulation trail' },
      { name: 'Kaza Town', arrive: '18:00', depart: '09:00', hotel: 'Zostel Kaza (solar-heated, best in valley)', food: 'Momos + thukpa at Kaza Café, yak cheese omelette', activity: 'Pin Valley National Park snowleopard zone info, Kaza market local crafts, nightsky photography from terrace at 3800m' },
      { name: 'Key Monastery & Hikkim', arrive: '08:00', depart: '15:00', food: 'Monastery kitchen dal + rice (monks invite guests)', activity: 'Key Gompa sunrise (1000-year-old, 4166m), Kibber village (one of world\'s highest inhabited villages), Hikkim post office at 4400m — send a postcard' },
      { name: 'Chandratal Lake', arrive: '12:00', depart: '07:00', hotel: 'Chandratal Camp (luxury tents, no electricity)', food: 'Camp bonfire dinner — dal, rice, papad under stars', activity: 'Crescent-shaped glacial lake at 4300m, circumambulation trail (5km, 2 hours), sunset light turns water sapphire-to-gold' },
      { name: 'Manali Old Town', arrive: '15:00', depart: '20:00', hotel: 'Johnson\'s Lodge', food: 'Trout fillet + apple pie at Johnson\'s Café', activity: 'Atal Tunnel (world\'s longest above 10000ft) exit, Vashisht hot sulphur springs recovery soak, Mall Road celebration dinner' },
    ]),
    edges: makeEdges(7, ['BUS', 'CAB', 'CAB', 'CAB', 'WALK', 'CAB', 'CAB']),
  },

  /* ── 2. LADAKH ──────────────────────────────────────────────────────────── */
  {
    from: 'Delhi', name: 'Ladakh',
    description: 'Roof of the world, 7 days. Fly into Leh at 3500m and acclimatise with monastery hops, then push north to Nubra Valley\'s Bactrian camel dunes at Hunder, cross the highest motorable pass in the world (Khardung La, 5359m) on a Royal Enfield, camp beside Pangong Tso\'s impossible blue waters, and loop back through Tso Moriri\'s flamingo-pink shores. Roads, monasteries, silence.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Aarav','Priya','Vikram','Divya','Arjun','Sneha','Karthik','Rahul','Mohan','Geeta'],
    comments: [
      { user: 'Aarav', text: 'Pangong at 5am — the water was literally mirror-flat and reflected the mountains perfectly. I cried. No shame.' },
      { user: 'Priya', text: 'Khardung La on an Enfield at 5359m. Your lungs are at 40% but your soul is at 1000%. Do not skip this.' },
      { user: 'Arjun', text: 'Nubra double-hump camel ride in the sand dunes with snow peaks behind — that is the most absurd beautiful combination.' },
      { user: 'Karthik', text: 'Diskit Monastery at sunrise with the giant Maitreya Buddha watching over the valley — completely alone. No tourists at 6am.' },
    ],
    nodes: makeNodes([
      { name: 'Delhi IGI Airport T3', arrive: '04:30', depart: '06:00', food: 'Pre-packed sandwiches, hydration critical', activity: 'Board IndiGo/Air India 6E-2403 to Leh — window seat left side for Himalayan sunrise approach over K2 range' },
      { name: 'Leh Town (Acclimatise)', arrive: '08:00', depart: '09:00', hotel: 'The Grand Dragon Ladakh (oxygen-assisted rooms)', food: 'Tibetan butter tea + tsampa porridge — mandatory first meal', activity: 'Mandatory 24hr rest at 3500m, Leh Palace exterior walk (15 min max), Shanti Stupa evening, Leh Market thangka shopping' },
      { name: 'Thiksey & Hemis Monasteries', arrive: '09:30', depart: '15:00', food: 'Monastery kitchen skyu (root vegetable stew)', activity: 'Thiksey Gompa — 12-storey replica of Potala Palace, sunrise puja drums, Hemis Museum rare thangkas and Guru Padmasambhava mask' },
      { name: 'Nubra Valley via Khardung La', arrive: '13:00', depart: '09:00', hotel: 'Desert Himalaya Resort, Hunder', food: 'Apricot jam toast + local dry apricots at Diskit market', activity: 'Khardung La pass at 5359m (highest motorable road, photo stop), Diskit Monastery giant Buddha, Hunder sand dunes camel safari at sunset' },
      { name: 'Pangong Tso (Blue Lake)', arrive: '13:00', depart: '07:00', hotel: 'Pangong Retreat Camp (lake-edge tents)', food: 'Bonfire dinner — dal makhani, naan, shooting stars overhead', activity: '5:30am golden hour on the lake, colour shifts blue→green→purple with light, 3 Idiots filming spot, Chang La pass (5360m) crossing' },
      { name: 'Tso Moriri (Flamingo Lake)', arrive: '14:00', depart: '09:00', hotel: 'Korzok Eco Camp (only settlement on lake)', food: 'Nomad-cooked tsampa breakfast, yak butter tea', activity: 'Bar-headed geese and Eurasian flamingos on glacial lake, Korzok Monastery (18th century), Rupshu Plateau nomad camp visit' },
      { name: 'Magnetic Hill & Gurudwara', arrive: '10:00', depart: '13:00', food: 'Langar (free Sikh community meal) at Pathar Sahib', activity: 'Magnetic Hill optical illusion (cars roll uphill), Pathar Sahib Gurudwara 500-year history, Indus-Zanskar river confluence (two colours)' },
      { name: 'Leh Airport Departure', arrive: '07:00', depart: '09:00', food: 'Last Ladakhi butter tea and local apricot juice', activity: 'Final Leh market — pashmina scarves, Ladakhi jewellery, thangka painting bookmarks, fly back Delhi' },
    ]),
    edges: makeEdges(7, ['FLIGHT', 'CAB', 'BIKE', 'CAB', 'CAB', 'CAB', 'CAB']),
  },

  /* ── 3. RAJASTHAN DESERT CIRCUIT ─────────────────────────────────────────── */
  {
    from: 'Delhi', name: 'Rajasthan',
    description: 'A 6-day royal desert odyssey — Jaipur\'s pink city bazaars and amber fortress, Pushkar\'s 52 ghats and camel fair, Jodhpur\'s cobalt blue labyrinth under Mehrangarh\'s shadow, Ranakpur\'s impossibly intricate Jain marble temple, and Jaisalmer\'s golden sandstone city dissolving into Sam Sand Dunes at sunset. Three colours: pink, blue, gold.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Rohit','Sneha','Meena','Suresh','Kavya','Uma','Padma','Asha','Girija','Tara'],
    comments: [
      { user: 'Rohit', text: 'Mehrangarh Fort at blue hour — the entire city of Jodhpur lit up cobalt blue below the walls. Nothing prepares you for it.' },
      { user: 'Sneha', text: 'Ranakpur Jain Temple is completely free and almost always empty. 1444 individually carved marble pillars, no two alike.' },
      { user: 'Uma', text: 'Sam Sand Dunes at sunset — camel silhouette against an orange sky. Basic, yes. But still magical every single time.' },
      { user: 'Kavya', text: 'Pushkar lake at dawn with the ghats and Brahma temple. If you don\'t do the sunrise, you missed Pushkar.' },
    ],
    nodes: makeNodes([
      { name: 'Delhi Hazrat Nizamuddin Station', arrive: '17:30', depart: '18:10', food: 'Jama Masjid biryani packed for train', activity: 'Board Ajmer Shatabdi Express / Rajdhani to Jaipur — 4.5 hours, arrive Pink City by midnight' },
      { name: 'Jaipur', arrive: '22:30', depart: '09:00', hotel: 'Samode Haveli (heritage courtyard hotel)', food: 'Dal baati churma + ghevar at Laxmi Misthan Bhandar, Johari Bazaar', activity: 'Amber Fort elephant ride + mirror palace, Jantar Mantar UNESCO observatory, Hawa Mahal facade, Johari Bazaar gemstone shopping' },
      { name: 'Pushkar', arrive: '12:00', depart: '09:00', hotel: 'Inn Seventh Heaven (rooftop Brahma Temple view)', food: 'Malpua + rabri at Ram Bhandar, only veg food in holy city', activity: 'Brahma Temple darshan (one of only 3 in India), 52 ghats sunrise boat, camel fair grounds walk, rose powder factory tour' },
      { name: 'Jodhpur', arrive: '14:00', depart: '09:00', hotel: 'Raas Haveli (Mehrangarh wall-facing rooms)', food: 'Mirchi vada + makhaniya lassi + Pyaaz kachori at Shri Mishrilal Hotel', activity: 'Mehrangarh Fort cannon views (1459 AD), Jaswant Thada marble cenotaph, Ghanta Ghar clock tower market, Pal Haveli rooftop dinner' },
      { name: 'Ranakpur Jain Temple', arrive: '11:00', depart: '14:30', food: 'Temple prasad + dhaba thali at Ranakpur Road', activity: '1444 individually carved marble pillars (1437 AD), no two alike — mandapa labyrinth, sunrise light through carved lattices, forest guesthouse' },
      { name: 'Jaisalmer Golden Fort', arrive: '16:00', depart: '09:00', hotel: 'Suryagarh Palace (desert luxury fort)', food: 'Ker sangri sabji + bajre ki roti + langcha at 1st Gate Haveli', activity: 'Sonar Qila (living fort, 1156 AD) sunset walk, Patwon Ki Haveli 5 interconnected mansions, Gadisar Lake boat at dawn, desert music evening' },
      { name: 'Sam Sand Dunes', arrive: '16:00', depart: '20:30', food: 'Bonfire camp dinner — dal bati + gatta curry under desert stars', activity: 'Camel trek to dune crest (45 min), sunset silhouette photo, folk music & kalbeliya snake dance, overnight tent camp, desert silence 3am' },
      { name: 'Jaisalmer Railway Station', arrive: '06:30', depart: '07:15', food: 'Kachori + chai at station stall', activity: 'Board Jaisalmer Express back to Delhi — 18 hour return journey, buy desert handicrafts at platform stalls' },
    ]),
    edges: makeEdges(7, ['TRAIN', 'CAB', 'CAB', 'CAB', 'CAB', 'CAMEL', 'TRAIN']),
  },

  /* ── 4. ANDAMAN ISLANDS ──────────────────────────────────────────────────── */
  {
    from: 'Chennai', name: 'Andaman Islands',
    description: 'An 8-day Bay of Bengal archipelago circuit — colonial Port Blair and the haunting Cellular Jail, glass-bottom boat over Jolly Buoy reef, the legendary Radhanagar Beach at Havelock (Asia\'s best), night kayaking through bioluminescent plankton, scuba diving at Elephant Beach, the eerily beautiful deserted Neil Island, mangrove kayaking at Baratang, and limestone cave exploration. Turquoise water everywhere.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Priya','Aarav','Vikram','Arjun','Sona','Nisha','Ravi','Uma','Harsha','Padma'],
    comments: [
      { user: 'Priya', text: 'Bioluminescent kayaking at Havelock at midnight — every paddle stroke lit up blue. Completely wordless experience.' },
      { user: 'Vikram', text: 'Radhanagar Beach at sunset is genuinely the most beautiful beach in Asia. Time magazine was right in 2004 and still right.' },
      { user: 'Ravi', text: 'Cellular Jail light and sound show is devastating. 1000 freedom fighters imprisoned here. Go with a full stomach — you won\'t eat after.' },
      { user: 'Harsha', text: 'Neil Island is so quiet you can hear your heartbeat. One main road, 3 restaurants, zero crowds. Do not skip it.' },
    ],
    nodes: makeNodes([
      { name: 'Chennai MAA Airport', arrive: '05:00', depart: '06:15', food: 'Idli + filter coffee at terminal', activity: 'Board IndiGo/Air India to Port Blair (Veer Savarkar Airport) — 2hr flight over open ocean, watch sea depth change colour' },
      { name: 'Port Blair — Cellular Jail', arrive: '08:30', depart: '18:00', hotel: 'SeaShell Hotel Port Blair', food: 'Red snapper curry + coconut rice at Ananda restaurant', activity: 'Cellular Jail National Memorial (1906) — solitary confinement cells, evening Light & Sound show (book ahead), Ross Island British ruins, Corbyn\'s Cove beach sunset' },
      { name: 'Jolly Buoy Island', arrive: '09:30', depart: '15:00', food: 'Packed lunch — no restaurants on island', activity: 'Glass-bottom boat over coral garden, snorkelling with clownfish & sea turtles, pristine government-protected reef, strict no plastic zone' },
      { name: 'Havelock Island (Radhanagar)', arrive: '11:00', depart: '09:00', hotel: 'Jalakara Boutique Hotel (beachfront)', food: 'Crab masala + kingfish at Anju Coco, watermelon juice on beach', activity: 'Radhanagar Beach (Beach 7) — 2km crescent rated Asia\'s best, sunset swim, night bioluminescence kayaking with Barefoot Scuba' },
      { name: 'Elephant Beach Scuba Dive', arrive: '07:30', depart: '14:00', food: 'Beachside bbq fish + coconut water at shack', activity: 'Boat to Elephant Beach, 3-hour beginner scuba dive (₹3500 with PADI instructor), coral garden at 8m depth, octopus, moray eel, parrotfish' },
      { name: 'Neil Island', arrive: '10:30', depart: '09:00', hotel: 'Summer Sand Beach Resort (beachfront cottage)', food: 'Lobster grilled + beer at Chill Out café', activity: 'Natural Bridge rock formation at low tide, Bharatpur Beach crystal shallow water, Laxmanpur sunset, bicycle rent for full island loop (14km)' },
      { name: 'Baratang Island Mangroves', arrive: '08:30', depart: '16:00', food: 'Andamanese tribal food experience — smoked fish', activity: 'Early morning speedboat through Jarawa tribal reserve (photography strictly prohibited), mangrove creek kayak, limestone cave stalactites 2km trek' },
      { name: 'Port Blair Airport Departure', arrive: '07:00', depart: '09:30', food: 'Last coconut water + Andamanese prawn pickle to carry home', activity: 'Aberdeen Bazaar last-minute shells, black pearls, coconut carvings — fly back Chennai, carry wet suits separately' },
    ]),
    edges: makeEdges(7, ['FLIGHT', 'FERRY', 'FERRY', 'BOAT', 'FERRY', 'BOAT', 'FERRY']),
  },

  /* ── 5. MEGHALAYA ────────────────────────────────────────────────────────── */
  {
    from: 'Kolkata', name: 'Meghalaya',
    description: 'The Abode of Clouds, 6 days. Fly to Guwahati, cross into the wettest place on Earth, explore Shillong\'s colonial bungalows and Khasi rock bands, trek to the double-decker living root bridge at Nongriat (3,500 steps), witness Nohkalikai Falls plunging 340m into green pools, cycle through Asia\'s cleanest village Mawlynnong, and kayak into Dawki\'s glass-bottom river on the Bangladesh border.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Sneha','Divya','Meena','Ananya','Vijay','Tara','Suresh','Nisha','Kavya','Geeta'],
    comments: [
      { user: 'Sneha', text: 'Nongriat living root bridge — a tree grown into a bridge over 500 years. You walk on living roots. Nothing in India prepares you for this.' },
      { user: 'Divya', text: 'Dawki river is so clear you cannot tell if the boats are floating or flying. The photos look fake. They are 100% real.' },
      { user: 'Ananya', text: 'Mawlynnong village — every house has a bamboo dustbin, flowers on every windowsill. The cleanest place I\'ve been anywhere in the world.' },
      { user: 'Vijay', text: 'Nohkalikai waterfall in monsoon falls 340m into a turquoise pool — the mist reaches you from 300m away. Stand there and feel small.' },
    ],
    nodes: makeNodes([
      { name: 'Kolkata Netaji Subhas Airport', arrive: '05:30', depart: '07:00', food: 'Kochuri + alur tarkari at airport', activity: 'IndiGo/Air India to Guwahati — 1 hour flight, window right side for Brahmaputra River delta views on approach' },
      { name: 'Guwahati — Kamakhya Temple', arrive: '09:00', depart: '13:00', food: 'Assamese thali — rice, fish curry, pitika at Khorikaa', activity: 'Kamakhya Devi Temple (tantric shakti peeth, sunrise darshan), Brahmaputra river cruise on ferry, Umananda island temple' },
      { name: 'Shillong', arrive: '15:00', depart: '09:00', hotel: 'Hotel Polo Towers (Laitumkhrah)', food: 'Jadoh (red rice + pork) + tungrymbai at Hotel Trattoria', activity: 'Ward\'s Lake colonial gardens, Police Bazaar rock music shops (Shillong is India\'s rock capital), Don Bosco Museum of Indigenous Cultures, Elephant Falls' },
      { name: 'Cherrapunji (Sohra)', arrive: '11:00', depart: '09:00', hotel: 'Cherrapunjee Holiday Resort (cliff-edge rooms)', food: 'Pork with bamboo shoots + kiad um (local rice beer) at resort', activity: 'Nohkalikai Falls (340m, India\'s tallest plunge fall), Seven Sisters Falls viewpoint, Mawsmai Cave (limestone, with torch), Eco Park cliff walk over Bangladesh plains' },
      { name: 'Nongriat Living Root Bridge', arrive: '07:00', depart: '15:00', food: 'Local homestay lunch — smoked pork + rice', activity: '3500 steps down Tyrna village, double-decker living root bridge (2 bridges grown together over 500 years by Khasi tribe), Rainbow Falls swim, night stay at Nongriat homestay' },
      { name: 'Mawlynnong (Asia\'s Cleanest Village)', arrive: '11:00', depart: '14:30', food: 'Village home-cooked meal — red rice, forest mushroom curry', activity: 'Bamboo watchtower (Bangladesh plains view), single-decker living root bridge nearby, community garden cycling, zero-waste village walk' },
      { name: 'Dawki River (Glass-Bottom Boats)', arrive: '10:00', depart: '14:00', food: 'Smoked fish + flatbread at Bangladesh border market', activity: 'Umngot River crystal-clear boat (kayak + motorboat, boats appear to float in air), India-Bangladesh Dawki bridge walk, river beach picnic' },
      { name: 'Guwahati Airport Departure', arrive: '16:00', depart: '18:30', food: 'Til pitha + narikolor ladoo to carry back', activity: 'Buy Assamese silk, Khasi bamboo crafts, local tea at Paltan Bazaar — fly back Kolkata' },
    ]),
    edges: makeEdges(7, ['FLIGHT', 'CAB', 'CAB', 'TREK', 'CAB', 'KAYAK', 'CAB']),
  },

  /* ── 6. VARANASI + SARNATH + BODH GAYA ──────────────────────────────────── */
  {
    from: 'Mumbai', name: 'Varanasi',
    description: 'The eternal city of Shiva, extended 5-day circuit. Pre-dawn boat through 88 ghats as Ganga fog lifts, Ganga Aarti\'s 1000 fire lamps, silk weaving workshops in Muslim weavers\' lanes, ancient Kashi Vishwanath Temple reconstruction, the precise deer park at Sarnath where Buddha first taught, and the sacred Bodh Gaya Mahabodhi tree where enlightenment happened 2500 years ago.',
    budgetRange: 'under 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Ravi','Uma','Mohan','Geeta','Padma','Asha','Girija','Mani','Karthik','Suresh'],
    comments: [
      { user: 'Ravi', text: 'Pre-dawn boat on the Ganga — bodies being cremated at Manikarnika, children bathing, priests praying, sadhus meditating. All simultaneously. Life and death together.' },
      { user: 'Geeta', text: 'Kashi Vishwanath at 4am during Mangala Aarti. 600-year-old gold-plated temple, hundreds of devotees, absolute frenzy of devotion. Shivers.' },
      { user: 'Uma', text: 'Sarnath deer park at sunset — completely quiet, the exact spot where Buddha gave his first sermon. The Dhamek Stupa is 2500 years old.' },
      { user: 'Mani', text: 'Varanasi silk weaving alley — Muslim master weavers, one Banarasi sari takes 3 months. Watch the Jacquard loom and you\'ll never look at fabric the same way.' },
    ],
    nodes: makeNodes([
      { name: 'Mumbai CSMT Railway Station', arrive: '21:00', depart: '21:35', food: 'Vada pav + cutting chai on platform 18', activity: 'Board Mahanagari Express / Kamayani Express — 24hr overnight journey, Rajasthan desert crossing at dawn from upper berth window' },
      { name: 'Varanasi Junction', arrive: '21:00', depart: '04:30', hotel: 'Brijrama Palace (Darbhanga Ghat heritage hotel)', food: 'Malaiyo (winter only saffron foam sweet) + Banarasi paan + kachori sabzi at Ksheer Sagar', activity: 'Check in, rest, nightwalk through Dashashwamedh Ghat lanes, silk showrooms, lassi at Blue Lassi shop' },
      { name: 'Ganga Ghats at Dawn', arrive: '05:00', depart: '09:00', food: 'Chai + jalebi on boat while floating', activity: 'Rowing boat 88-ghat circuit — Assi, Dashashwamedh, Manikarnika cremation ghat (photography restricted), Scindia Ghat sunken temple, flower offerings at Panchaganga Ghat' },
      { name: 'Kashi Vishwanath Temple', arrive: '09:30', depart: '12:00', food: 'Temple prasad + thandai at Bhang Shop nearby', activity: 'New Kashi Vishwanath Corridor (2022), 900kg gold-plated spire, Gyanvapi Mosque courtyard view, Annapurna Devi temple next door, antique jewellery market' },
      { name: 'Banarasi Silk Weaving Quarter', arrive: '14:00', depart: '17:00', food: 'Biryani + korma at Aala Hazrat restaurant', activity: 'Madanpura Muslim weavers\' colony, Jacquard loom demonstration, zari goldwork embroidery workshop, buy authentic Banarasi sari directly from weaver (₹3000-50000)' },
      { name: 'Sarnath Deer Park', arrive: '09:00', depart: '13:00', food: 'Tibetan momos at Sarnath monastery café', activity: 'Dhamek Stupa (Buddha\'s first sermon, 249 BC), Ashoka Pillar (Lion Capital — original at Sarnath Museum), Myanmar/Thai/Chinese Buddhist temples, Jain temple at Sarnath' },
      { name: 'Bodh Gaya — Mahabodhi Temple', arrive: '11:00', depart: '17:00', hotel: 'Root Institute for Wisdom Culture', food: 'Tibetan thukpa at Japanese Temple café', activity: 'Mahabodhi Temple UNESCO (original bodhi tree descendant), diamond throne where Buddha sat, Animesh Lochan Chaitya (where he gazed at tree for 7 days), monks from 12 countries chanting simultaneously' },
      { name: 'Dashashwamedh Ghat Aarti', arrive: '17:30', depart: '20:30', food: 'Banarasi thali dinner — kachori, dum aloo, jalebis at Baati Chokha restaurant', activity: 'Ganga Aarti ceremony (6:30pm) — 7 priests, 1000 lamps, conch shells, incense, floating diyas, boat viewing highly recommended (book ahead)' },
    ]),
    edges: makeEdges(7, ['TRAIN', 'BOAT', 'WALK', 'AUTO', 'CAB', 'CAB', 'WALK']),
  },

  /* ── 7. GOKARNA ──────────────────────────────────────────────────────────── */
  {
    from: 'Mumbai', name: 'Gokarna',
    description: 'The hippie pilgrim paradox — a sacred Shiva temple town with no-tourist beaches a 10-minute trek away. A 4-day circuit: Konkan Railway coastal train, the ancient Mahabaleshwar Temple lingam (older than Varanasi), the famous Paradise Beach only reachable by boat or 2-hour cliff trek, Half Moon and Om Beaches, the dramatic Murudeshwar Shiva statue on a sea cliff, and the hidden Yana Rock Formation caves.',
    budgetRange: 'under 2000 rupees', days: '2 day', distance: 'over 500km',
    likedBy: ['Rohit','Aarav','Arjun','Sai','Lena','Vijay','Ananya','Rajesh','Deepak','Sneha'],
    comments: [
      { user: 'Rohit', text: 'Paradise Beach is genuinely paradise — 2-hour cliff trek or ₹150 boat. Zero shacks, zero tourists in January. Just you and the Arabian Sea.' },
      { user: 'Lena', text: 'Om Beach at 6am with the sun rising over the Om-shaped bay — I sat there for 3 hours and said nothing. Nothing needed to be said.' },
      { user: 'Arjun', text: 'Murudeshwar Shiva statue at 20 storeys is absurd and magnificent. Elevator to the top for panoramic sea views. Budget ₹5 for the temple.' },
      { user: 'Sai', text: 'Yana rock caves are unknown even to most Karnataka locals — giant black crystalline rock formations rising 300m from the forest floor.' },
    ],
    nodes: makeNodes([
      { name: 'Mumbai CSMT', arrive: '19:30', depart: '20:05', food: 'Platform vada pav + nimbu pani', activity: 'Board Konkan Kanya Express or Mandovi Express — overnight Konkan Railway — wake up to sea on your right, coconut palms, tunnels, bridges' },
      { name: 'Goa Madgaon (Margao)', arrive: '07:30', depart: '09:00', food: 'Bebinca + pork sorpotel at Longuinhos, Margao', activity: 'Quick layover — transfer to Gokarna-bound intercity bus/cab, Goa border market stop' },
      { name: 'Gokarna Town Temple', arrive: '12:00', depart: '15:00', hotel: 'Nimmu House Guesthouse (temple view rooftop)', food: 'Malnad thali — rice, fish curry, solkadhi at Hotel Prasad', activity: 'Mahabaleshwar Temple (Atma Linga — the original, 1500 years old), Car Street procession route walk, Koti Teertha tank dip, Tamra Gauri Temple' },
      { name: 'Kudle & Om Beach', arrive: '16:00', depart: '20:00', food: 'Sunset chai + banana pancakes at Namaste Café, Om Beach', activity: 'Kudle Beach cliff path (30 min), Om Beach bay view from hilltop — the bay literally forms the Om symbol, night beach bonfire, hammock sleep shacks' },
      { name: 'Half Moon & Paradise Beach', arrive: '07:00', depart: '15:00', food: 'Fresh coconut water from beach shack + boiled corn', activity: 'Trek cliff path: Om → Half Moon (20 min) → Full Moon (40 min) → Paradise (2 hrs), or boat ₹150 — Paradise Beach has zero shacks, pristine sand, clothing optional' },
      { name: 'Murudeshwar Shiva Temple', arrive: '10:00', depart: '14:00', food: 'Malnad fish thali at temple town dhaba', activity: '20-storey Shiva statue on sea cliff (2nd tallest in world), Rajagopura elevator to top, Arabian Sea 360° view, Murudeshwar Fort ruins on island, Netrani Island snorkel (book ahead)' },
      { name: 'Yana Rock Caves', arrive: '09:00', depart: '13:00', food: 'Packed lunch — no food near caves', activity: 'Bhairaveshwara Shikhara (320m crystalline black karst rock), forest trek 1.5km, Mohini Shikhara twin formation, Bhairaveshwara cave shrine inside rock fissure' },
      { name: 'Gokarna Station Departure', arrive: '15:30', depart: '16:20', food: 'Last sol kadi + kokum sherbet to carry', activity: 'Board Mangalore-Mumbai Matsyagandha Express back — book window seat, Konkan sunset over sea' },
    ]),
    edges: makeEdges(7, ['TRAIN', 'CAB', 'WALK', 'BOAT', 'CAB', 'TREK', 'TRAIN']),
  },

  /* ── 8. OOTY + KODAIKANAL ────────────────────────────────────────────────── */
  {
    from: 'Chennai', name: 'Ooty',
    description: 'A 5-day Nilgiri twin-hills circuit — the legendary Nilgiri Mountain Railway toy train (UNESCO, the steepest rack-and-pinion in Asia), Ooty Botanical Gardens, Avalanche Lake trout fishing, Doddabetta peak at 2637m, Coonoor\'s heritage tea factory, Kodaikanal\'s star-shaped lake, Pillar Rocks, Guna Cave and Coaker\'s Walk fog trail. Misty hills, toy trains, colonial relics.',
    budgetRange: 'under 5000 rupees', days: '3+ days', distance: 'under 500km',
    likedBy: ['Priya','Sneha','Meena','Kavya','Nisha','Ravi','Uma','Suresh','Karthik','Sona'],
    comments: [
      { user: 'Priya', text: 'Nilgiri toy train from Mettupalayam — book Class 1 months in advance. The 46-tunnel-5-hour journey is worth more than any destination.' },
      { user: 'Uma', text: 'Kodaikanal Pillar Rocks in the fog at 7am — you hear the drop (400m) before you see it. Do not stand at the edge.' },
      { user: 'Kavya', text: 'Avalanche Lake trout fishing — they give you a rod and charge per catch. I caught nothing but it was perfect.' },
      { user: 'Ravi', text: 'Coonoor\'s Highfield Tea Factory — smell of tea drying fills the whole building. Freshest Nilgiri tea I\'ve had anywhere.' },
    ],
    nodes: makeNodes([
      { name: 'Chennai Central', arrive: '21:00', depart: '21:30', food: 'Platform dosa + sambar at Chennai Central food court', activity: 'Board Nilgiri Express 12671 to Mettupalayam — overnight train, arrive base of hills by dawn' },
      { name: 'Mettupalayam Station', arrive: '06:20', depart: '07:15', food: 'Idli + podi + filter coffee at station hotel', activity: 'Board Nilgiri Mountain Railway steam train (UNESCO) — rack-and-pinion mechanism, 208 curves, 16 viaducts, 46 tunnels, 5 hour ascent through eucalyptus and tea' },
      { name: 'Ooty (Udhagamandalam)', arrive: '12:00', depart: '09:00', hotel: 'Savoy Hotel (1829 colonial heritage)', food: 'Nilgiri tea toast breakfast + homemade chocolate at King Star Chocolates', activity: 'Botanical Gardens (1848, 650 species), Ooty Lake pedal boat, Doddabetta Peak (2637m Tamil Nadu highest), tribal Toda people village visit' },
      { name: 'Coonoor Tea Country', arrive: '10:00', depart: '15:00', food: 'Freshest Nilgiri Orthodox tea with shortbread at Highfield Estate', activity: 'Highfield Tea Factory tour — withering, rolling, fermenting, drying, Lamb\'s Rock viewpoint, Sim\'s Park colonial garden, Droog Fort 16km trek' },
      { name: 'Avalanche Lake', arrive: '07:00', depart: '12:00', food: 'Packed bhakri + pickle — no restaurants in reserve', activity: 'Silent Valley Reserve trout fishing (permit ₹50, rod ₹100 rental), eucalyptus forest cycling, stream wading, deer sighting zone, Emerald Lake extension' },
      { name: 'Kodaikanal Lake', arrive: '14:00', depart: '09:00', hotel: 'Carlton Hotel (star-shaped lake facing)', food: 'Homemade Kodaikanal cheese + strawberry jam on toast at Café Cariappa', activity: 'Star-shaped lake boat at sunset, Kodai Bazaar Tibetan market, homemade chocolate tasting trail, Coaker\'s Walk cliff path at dawn fog' },
      { name: 'Pillar Rocks & Guna Cave', arrive: '07:30', depart: '12:00', food: 'Hot corn + peanuts at viewpoint stalls', activity: 'Pillar Rocks viewpoint (three granite pillars 120m, Guna Cave (Devil\'s Kitchen) 60m deep crater cave, Bryant Park rose garden, Silver Cascade waterfall' },
      { name: 'Kodaikanal Bus Stand', arrive: '14:00', depart: '15:00', food: 'Last Kodaikanal homemade cheese + chocolate to carry', activity: 'Board overnight bus to Chennai / Coimbatore — mountain descent via hairpin bends, Palani plains at night, arrive Chennai dawn' },
    ]),
    edges: makeEdges(7, ['TRAIN', 'TRAIN', 'CAB', 'BIKE', 'CAB', 'WALK', 'BUS']),
  },

  /* ── 9. CHIKMAGALUR + KUDREMUKH ─────────────────────────────────────────── */
  {
    from: 'Bangalore', name: 'Chikmagalur',
    description: 'Karnataka\'s coffee heartland, 4 days. The drive through Shravanabelagola\'s 60ft Gomateshwara monolith, Chikmagalur coffee plantation sunrise homestay, Mullayanagiri peak trek (Karnataka\'s highest, 1930m), Baba Budangiri dargah sacred to both Hindus and Muslims, the mist-shrouded Kudremukh peak trail through shola forest, and the Bhadra Tiger Reserve dawn jeep for sloth bear, gaur and leopard.',
    budgetRange: 'under 5000 rupees', days: '2 day', distance: 'under 500km',
    likedBy: ['Vikram','Arjun','Rohit','Deepak','Sai','Harsha','Lena','Asha','Padma','Ravi'],
    comments: [
      { user: 'Vikram', text: 'Mullayanagiri at 5am — Karnataka\'s highest point in the mist, alone, cold, coffee growing below you at 1930m. Reset your entire brain.' },
      { user: 'Arjun', text: 'Kudremukh trek through shola forest is magical — 22km but every metre is through untouched forest with whistling thrush birds.' },
      { user: 'Deepak', text: 'Bhabha Budangiri dargah is unique — Hindu and Muslim pilgrims side by side. Baba brought coffee to India from Yemen. Original coffee beans still in the cave.' },
      { user: 'Harsha', text: 'Bhadra Tiger Reserve jeep at 6am — a sloth bear walked straight past our vehicle, 4 metres away. Also spotted a leopard on the rock ledge.' },
    ],
    nodes: makeNodes([
      { name: 'Bangalore Majestic', arrive: '06:00', depart: '06:30', food: 'Masala dosa at Vidhyarthi Bhavan (arrive by 6am)', activity: 'Drive NH75 — stop at Ramanagara silk cocoon market, Channapatna toy town, Shravanabelagola detour' },
      { name: 'Shravanabelagola', arrive: '09:30', depart: '11:30', food: 'Temple prasad + coconut', activity: '618 granite steps up Vindhyagiri Hill, 60-ft monolithic Gomateshwara statue (981 AD, world\'s largest monolith of a single figure), panoramic plains view' },
      { name: 'Chikmagalur Coffee Estate', arrive: '15:00', depart: '09:00', hotel: 'Devana Coffee Estate Homestay (150-year-old bungalow)', food: 'Estate-grown pour-over breakfast + plum cake, dinner — pork curry + kori rotti', activity: 'Evening estate walk through arabica rows in mist, coffee cherry picking demo, night sky gazing from estate veranda' },
      { name: 'Mullayanagiri & Baba Budangiri', arrive: '05:00', depart: '12:00', food: 'Roadside omelette + chai at foothills', activity: 'Karnataka highest peak at 1930m (1-hour trek from road), Baba Budangiri dargah in cloud (Dattatreya Peetha Hindu shrine + Sufi dargah), Manikyadhara waterfall' },
      { name: 'Kudremukh National Park', arrive: '07:00', depart: '17:00', food: 'Forest rest house lunch — dal rice', activity: 'Kudremukh peak full-day trek (22km, mandatory forest guard), shola-grassland mosaic, Bhadra river origin, horse-face summit view, endemic birds & Indian wild dog' },
      { name: 'Bhadra Tiger Reserve', arrive: '05:30', depart: '09:30', hotel: 'Jungle Lodges Bhadra River Lodge', food: 'Pre-dawn biscuits + coffee in jeep, full breakfast post-safari', activity: 'Dawn jeep safari — sloth bear, gaur, barking deer, leopard on rock ledge, 200+ bird species, ancient tribal rock art sites inside reserve' },
      { name: 'Hebbe Falls & Kemmanagundi', arrive: '10:00', depart: '14:00', food: 'Malnad thali — rice, pandi curry, soppu at forest hotel', activity: 'Hebbe Falls (168ft two-tier, jeep to base), Kemmanagundi hill station colonial bungalow, Z-Point Sunrise Point, Raj Bhavan gardens' },
      { name: 'Hassan Town (Return Journey)', arrive: '16:00', depart: '18:30', food: 'Malnad coffee + dose at local udupi hotel', activity: 'Belur Hoysala Temple 1116 AD (3000 sculpted panels, 1hr tour), Halebidu double-shrine (UNESCO tentative list), drive back Bangalore via Nelamangala' },
    ]),
    edges: makeEdges(7, ['CAB', 'CAB', 'WALK', 'TREK', 'JEEP', 'CAB', 'CAB']),
  },

  /* ── 10. VARKALA + KOVALAM ──────────────────────────────────────────────── */
  {
    from: 'Bangalore', name: 'Varkala',
    description: 'Kerala\'s cliffside paradise, 5 days — fly to Trivandrum, treasure the Padmanabhaswamy Temple\'s labyrinthine gopurams and ₹1.2 trillion vault, Kovalam Lighthouse Beach dawn swim, then take the train north to Varkala\'s laterite cliff cafés overlooking the Arabian Sea, an Ayurvedic treatment at a cliff-edge spa, Sivagiri pilgrimage hill, Jatayu Nature Park paragliding, and Ashtamudi Lake houseboat at Kollam.',
    budgetRange: 'under 5000 rupees', days: '3+ days', distance: 'under 500km',
    likedBy: ['Priya','Divya','Sneha','Nisha','Kavya','Uma','Padma','Asha','Tara','Ananya'],
    comments: [
      { user: 'Priya', text: 'Varkala cliff at sunset — cliff cafés with fairy lights, the sea 50m below, chai in hand, no wifi, everything exactly right.' },
      { user: 'Divya', text: 'Padmanabhaswamy darshan at 3:30am Thiruvananthapuram — the priest opens the gold door at 3:30am. Queue from midnight. The calmest frenzy you\'ve experienced.' },
      { user: 'Sneha', text: 'Jatayu Nature Park — the world\'s largest bird sculpture, 200ft wingspan, carved into a natural cliff. Also has zip line and rock climbing.' },
      { user: 'Uma', text: 'Ashtamudi houseboat is quieter than Alleppey — less touristy, more authentic canals, cashew plantation shore, kingfisher every 5 minutes.' },
    ],
    nodes: makeNodes([
      { name: 'Bangalore Kempegowda Airport', arrive: '05:30', depart: '07:00', food: 'Filter coffee + idli at Udupi Krishna, Terminal 1', activity: 'IndiGo/Air India to Thiruvananthapuram (TRV) — 1.5hr flight, window right side for Kerala coastal approach and backwater mouth views' },
      { name: 'Padmanabhaswamy Temple, Trivandrum', arrive: '03:30', depart: '07:00', hotel: 'Vivanta Trivandrum', food: 'Temple prasad + banana chips, breakfast at hotel', activity: 'Padmanabhaswamy 3:30am Thiruvananthapuram darshan (earliest in India), 8-storey Dravidian gopuram, gold-plated corridor, Anantha-shayan Vishnu on 5-hood serpent' },
      { name: 'Kovalam Beach', arrive: '09:00', depart: '14:00', food: 'Kerala prawn masala + appam at Sea View Hotel, Lighthouse Beach', activity: 'Lighthouse Beach sunrise swim (calm in Oct-Mar), Kovalam Lighthouse climb (2km beach view), Hawah Beach catamaran fishing boat watch, Samudra Beach ayurvedic massage shack' },
      { name: 'Varkala Cliff (North Cliff)', arrive: '16:00', depart: '09:00', hotel: 'Clafouti Beach Resort (cliff-edge cottage)', food: 'Grilled kingfish + coconut rice at Café del Mar, cliff sunset chai at Taj Garden', activity: 'Papanasham Beach sunset (sacred, pilgrims bathe), cliff path walk 2km, natural spring waterfall on beach, evening cliff cafés with Arabian Sea panorama' },
      { name: 'Sivagiri Mutt & Jatayu Park', arrive: '09:30', depart: '15:00', food: 'Ashram sattvic meals (₹80) at Sivagiri', activity: 'Sivagiri pilgrimage hill — Sree Narayana Guru samadhi, panoramic valley view, Jatayu Nature Park (world\'s largest bird sculpture 200ft, cable car, rock climbing, zip line — ₹800)' },
      { name: 'Kappil Beach Backwaters', arrive: '16:00', depart: '18:30', food: 'Toddy + spicy tapioca at Kappil Bridge toddy shop', activity: 'Varkala Backwater Lake meeting Arabian Sea at Kappil — rare estuary, sunset boat, fishing village walk, mussel farm on stilts' },
      { name: 'Ashtamudi Lake Houseboat, Kollam', arrive: '10:00', depart: '09:00', hotel: 'Premium houseboat — Ashtamudi Eco Trails', food: 'Karimeen pollichathu + avial + papadum on boat deck at sunset', activity: 'Ashtamudi 8-armed lake cruise — less tourists than Alleppey, cashew plantation shores, Munroe Island canoe detour, colonial Kollam port at dusk' },
      { name: 'Trivandrum Airport Departure', arrive: '10:00', depart: '12:00', food: 'Last Kerala sadya plate + fresh coconut water', activity: 'Connemara Market last-minute pickles, banana chips 10 varieties, handloom Kasavu sarees — fly back Bangalore' },
    ]),
    edges: makeEdges(7, ['FLIGHT', 'AUTO', 'CAB', 'WALK', 'CAB', 'BOAT', 'CAB']),
  },

  /* ── 11. GOA (MULTI-TRANSPORT DEMO) ─────────────────────────────────────── */
  {
    from: 'Mumbai', name: 'Goa',
    description: 'The classic Mumbai escape — but showing every way to get there and move around. Three routes between Mumbai and Goa (flight, Konkan Railway, overnight bus), two options from the airport into town (cab or ferry across the Mandovi), dual scooter-or-ferry choices between Panjim and Old Goa, and onward flexibility at every leg. A 4-day itinerary designed to show that no two people need to take the same road.',
    budgetRange: 'over 5000 rupees', days: '3+ days', distance: 'over 500km',
    likedBy: ['Aarav','Priya','Rohit','Sneha','Vikram','Divya','Arjun','Meena','Karthik','Sona'],
    comments: [
      { user: 'Aarav', text: 'Took the Konkan Kanya overnight — woke up to palm trees and the sea. Far better than flying. Book 2nd AC months ahead.' },
      { user: 'Priya', text: 'Ferry from Dabolim across the Zuari to Panjim jetty is the most scenic arrival in India. Costs ₹20. Takes 40 minutes.' },
      { user: 'Rohit', text: 'Scooter from Panjim to Old Goa is 20 minutes and you see the countryside. Cab is 10 minutes and you miss everything.' },
      { user: 'Sneha', text: 'Dudhsagar by jeep in monsoon — the falls were deafening, soaked us in 5 seconds. Non-negotiable stop.' },
    ],
    nodes: makeNodes([
      { name: 'Mumbai CST', arrive: '07:00', depart: '08:00', food: 'Vada pav + cutting chai at PF-11 stall', activity: 'Three departure options: (A) Domestic airport — IndiGo/SpiceJet 1hr15min flight; (B) Konkan Kanya Express 10020 overnight 11hrs; (C) Paulo Travels sleeper bus 14hrs via NH66' },
      { name: 'Goa — Dabolim Airport / Madgaon Station', arrive: '09:30', depart: '11:00', food: 'Chegão fish cutlet + kokum sherbet at Margao Market', activity: 'Two onward options from here: (A) Pre-paid cab ₹700 direct to Panjim 45min; (B) Ferry across Zuari River to Panjim jetty ₹20, 40min scenic crossing' },
      { name: 'Panjim (Panaji)', arrive: '11:30', depart: '14:00', hotel: 'Panjim Inn — Heritage 1882 Portuguese villa', food: 'Prawn recheado + Bebinca at Venite Restaurant, 31st January Road', activity: 'Fontainhas Latin Quarter walk, Church of Our Lady of Immaculate Conception, Mandovi riverside promenade, Mahalaxmi Temple' },
      { name: 'Old Goa UNESCO Churches', arrive: '14:30', depart: '17:30', food: 'Bebinca + port wine at Old Goa bakery', activity: 'Basilica of Bom Jesus (St. Francis Xavier relics), Sé Cathedral (largest church in Asia), Museum of Christian Art, Chapel of St. Catherine' },
      { name: 'Anjuna + Dudhsagar', arrive: '07:00', depart: '15:00', hotel: 'Lazy Dog Resort, Anjuna (sea-facing cottage)', food: 'Whole pomfret grilled + Kingfisher at Curlies beach shack', activity: 'Dudhsagar Falls jeep safari (Bhagwan Mahaveer Wildlife Sanctuary, ₹2500 per jeep), Chapora Fort sunset, Anjuna Flea Market Wednesdays' },
      { name: 'Palolem Beach', arrive: '10:00', depart: '18:00', hotel: 'Oceanic Hotel (palm grove cottages)', food: 'Lobster thali + Goan prawn curry at Dropadi restaurant', activity: 'Kayak to Honeymoon Island (30 min), dolphin watching sunrise boat (₹400), silent disco beach night (Tuesdays), Cotigao Wildlife Sanctuary half-day' },
    ]),
    edges: [
      /* Mumbai → Goa: THREE transport options fan out */
      { id: 'e0-flight', source: 'node-0', target: 'node-1', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#081c15', width: 22, height: 22 },
        data: { transport: 'FLIGHT', transportDetails: '1hr 15min · ₹2800 avg', color: '#081c15', direction: 'Forward', edgeIndex: 0 } },
      { id: 'e0-train', source: 'node-0', target: 'node-1', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#1b4332', width: 22, height: 22 },
        data: { transport: 'TRAIN', transportDetails: 'Konkan Kanya · 11hrs · ₹650', color: '#1b4332', direction: 'Forward', edgeIndex: 1 } },
      { id: 'e0-bus', source: 'node-0', target: 'node-1', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#2d6a4f', width: 22, height: 22 },
        data: { transport: 'BUS', transportDetails: 'Paulo Travels · 14hrs · ₹1100', color: '#2d6a4f', direction: 'Forward', edgeIndex: 2 } },

      /* Dabolim/Madgaon → Panjim: TWO options */
      { id: 'e1-cab', source: 'node-1', target: 'node-2', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#081c15', width: 22, height: 22 },
        data: { transport: 'CAB', transportDetails: 'Pre-paid · 45min · ₹700', color: '#081c15', direction: 'Forward', edgeIndex: 0 } },
      { id: 'e1-ferry', source: 'node-1', target: 'node-2', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#1b4332', width: 22, height: 22 },
        data: { transport: 'FERRY', transportDetails: 'Zuari River · 40min · ₹20', color: '#1b4332', direction: 'Forward', edgeIndex: 1 } },

      /* Panjim → Old Goa: TWO options */
      { id: 'e2-scooter', source: 'node-2', target: 'node-3', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#081c15', width: 22, height: 22 },
        data: { transport: 'SCOOTER', transportDetails: 'Rent ₹300/day · 20min', color: '#081c15', direction: 'Forward', edgeIndex: 0 } },
      { id: 'e2-bus', source: 'node-2', target: 'node-3', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#1b4332', width: 22, height: 22 },
        data: { transport: 'BUS', transportDetails: 'KTC local · 25min · ₹12', color: '#1b4332', direction: 'Forward', edgeIndex: 1 } },

      /* Old Goa → Anjuna: single scooter */
      { id: 'e3-scooter', source: 'node-3', target: 'node-4', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#081c15', width: 22, height: 22 },
        data: { transport: 'SCOOTER', transportDetails: 'NH366 coastal · 40min', color: '#081c15', direction: 'Forward', edgeIndex: 0 } },

      /* Anjuna → Palolem: TWO options */
      { id: 'e4-scooter', source: 'node-4', target: 'node-5', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#081c15', width: 22, height: 22 },
        data: { transport: 'SCOOTER', transportDetails: 'Coastal NH66 · 1hr 30min', color: '#081c15', direction: 'Forward', edgeIndex: 0 } },
      { id: 'e4-cab', source: 'node-4', target: 'node-5', type: 'customEdge', animated: false,
        markerEnd: { type: 'arrowclosed', color: '#1b4332', width: 22, height: 22 },
        data: { transport: 'CAB', transportDetails: 'AC · 1hr 15min · ₹1200', color: '#1b4332', direction: 'Forward', edgeIndex: 1 } },
    ],
  },

];

const contributionTexts = [
  'Spiti Valley solo on a Royal Enfield — Delhi→Shimla→Kaza→Chandratal→Manali in 8 days. Chandratal lake at 4300m under the Milky Way with zero phone signal. Changed me completely. Budget ₹28,000 all in.',
  'Ladakh on a bicycle — yes, really. Flew to Leh, rented a bicycle, did Khardung La on two wheels. It took 6 hours. I cried at the top. Best decision of my life.',
  'Meghalaya solo female, 5 days, ₹12,000. Shillong→Cherrapunji→Nongriat→Mawlynnong→Dawki. Felt completely safe. Locals are warm and English is universal. Just go.',
  'Konkan Railway Mumbai→Gokarna night train — woke up to palm trees and sea. Om Beach at 6am with nobody around. The cliff cafés at sunset with chai. Gokarna is everything Goa should be.',
  'Varanasi pre-dawn boat at 5am — mist, priests, cremation fires, children bathing, sadhus meditating, all simultaneously. Nothing anywhere in the world is this concentrated. Do it.',
  'Chikmagalur coffee estate stay — woke up at 6am to mist through arabica rows. Owner\'s grandmother\'s pork curry for dinner. Filter coffee from beans picked that morning. ₹2000/night, worth 10x.',
  'Nilgiri toy train Mettupalayam to Ooty — first class coach, booked 3 months in advance for ₹30. 5 hours, 46 tunnels, 16 viaducts. Children waving from every village platform. UNESCO heritage for a reason.',
  'Andaman bioluminescent kayaking at midnight — Havelock Island, every paddle stroke lit up bright blue. The entire bay was glowing. Zero artificial light. One of the 5 best experiences of my life.',
  'Rajasthan 6-day circuit — Jaipur→Pushkar→Jodhpur→Ranakpur→Jaisalmer. Sam Sand Dunes night camp. Folk music around bonfire. Woke to camel silhouettes at dawn. Classic for a reason.',
  'Varkala cliff solo female — overnight bus from Bangalore, cliff cottage ₹900/night, fresh grilled fish ₹200 at sunset. Arabian Sea, 50m below, all evening. Repeat every year without fail.',
  'Ooty→Kodaikanal road trip via Coonoor — entire route through tea estates. Highfield Tea Factory tour is free and the freshest tea you\'ll ever taste. Kodaikanal cheese from local dairy is extraordinary.',
  'Andaman Cellular Jail sound and light show — devastatingly well done. 1000 freedom fighters tortured here. You leave in complete silence. Do not skip this for beaches. Context matters.',
  'Meghalaya living root bridge — 3500 steps down to Nongriat village. A tree grown into a bridge over 500 years. You walk on living wood. Book homestay ahead. Best trek under 10km in India.',
  'Ladakh Pangong Tso dawn — 5am, alone, no tourists, the lake perfectly mirror-still, mountains reflected. I sat for 2 hours without speaking. Not a single regret about the 8-hour drive from Leh.',
  'Gokarna Paradise Beach via cliff trek — 2 hours from Om Beach, zero shacks, zero tourists, pristine sand, clothing optional. The best beach I found after 6 years searching coastal India.',
];

const messageTexts = [
  'Hey Sudhanshu! Your Spiti Valley itinerary is the most detailed I have seen anywhere online. Following it exactly in June. Thank you!',
  'The Ladakh circuit is perfect — Nubra, Pangong, Tso Moriri in one loop is exactly what I needed. Booking flights now.',
  'Meghalaya itinerary blew my mind. I had no idea the living root bridges existed. Planning a solo trip in October.',
  'Andaman bioluminescent kayaking — is this something you have to book in advance? Which operator do you recommend for Havelock?',
  'Love that the Rajasthan route goes all the way to Jaisalmer. Most itineraries stop at Jodhpur. The Sam Dunes overnight was magical.',
  'Varanasi itinerary is the best I\'ve seen — including the 3:30am Padmanabhaswamy darshan note. That detail is gold.',
  'Followed the Chikmagalur route last month. Bhadra Tiger Reserve jeep safari saw a leopard on a rock. Exactly as described!',
  'Gokarna Paradise Beach via cliff trek is genuinely difficult to find information about. Your route description is the clearest anywhere.',
  'Nilgiri toy train booking tip saved us — booked 3 months in advance, got first class. The experience was incredible.',
  'The Varkala itinerary is the most complete Kerala cliff guide I have found. Following it next month solo. Thank you!',
  'Your North India coverage (Spiti + Ladakh) is exceptional. Please add Zanskar Valley next — it\'s even more remote!',
  'Followed the Andaman itinerary. Cellular Jail sound and light show was more moving than any museum I\'ve visited. Thank you for including it.',
  'Small feedback: can you add estimated costs per person per day for each itinerary? Would really help with planning.',
  'The Rajasthan camel transport node made me laugh and then cry when I actually did it at Sam Dunes. Perfect detail.',
  'Followed your Meghalaya route. Dawki river photos look fake but are completely real — confirmed. The boat literally appears to float in air.',
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
    // Delete contributions tagged as demo seed OR matching demo texts (handles legacy seeded data)
    await Contribution.deleteMany({
      $or: [
        { _demoSeed: true },
        { text: { $in: contributionTexts } },
      ],
    });
    res.json({ active: false, message: 'Demo data removed (real data untouched)' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
