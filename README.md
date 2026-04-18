<h1 align="center">
  <br />
  ✈️ LeaveApproved
  <br />
</h1>

<p align="center">
  <strong>AI-powered travel itinerary builder with visual flow maps, multi-transport routing, community submissions, and a real-time admin dashboard.</strong>
</p>

<p align="center">
  <a href="https://leaveapproved.online">
    <img src="https://img.shields.io/badge/Live-leaveapproved.online-1b4332?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Node.js-52b788?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/DB-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%2B%20Groq-ffb703?style=for-the-badge&logo=google&logoColor=black" />
</p>

---

## What is LeaveApproved?

LeaveApproved is a travel planning platform where users can explore curated trip itineraries, build custom visual travel flows, chat with an AI travel buddy, and share their own trip ideas. Admins manage all content through a real-time dashboard with live analytics, UptimeRobot monitoring, and AI-assisted trip synthesis.

---

## Features

### For Travelers
- **Trip Explorer** — Browse curated itineraries with route maps, budget ranges, duration, and stop count
- **Visual Flow Maps** — Each itinerary renders as an interactive node-edge canvas. City cards show arrival/departure times, hotel, food and activities. Transport edges show mode, price and duration between every stop
- **Multi-Transport Routing** — Multiple transport edges can exist between the same two cities (e.g. flight vs. overnight train vs. bus), each fanning out with distinct labels and colours so travellers can see all options at a glance
- **AI Travel Buddy** — Chat interface powered by Groq (LLaMA) for real-time travel recommendations
- **AI Itinerary Generator** — Describe a trip in plain text; Gemini AI generates a full structured itinerary and renders it as a flow map
- **Trip Comparison** — Compare two trips side by side across budget, duration, and stops
- **Community Submissions** — Submit your own trip ideas for admin review and AI conversion
- **Like & Review** — Like itineraries with confetti animation, leave comments, delete your own

### For Admins
- **Analytics Dashboard** — Live visitor count, user registrations by company, daily activity chart
- **Website Status** — Real-time UptimeRobot widget: Up/Down status, 24h/7d/30d uptime %, avg/min/max response time
- **Trip Management** — Add, edit, and delete published trips with full FlowBuilder integration
- **Demo Mode** — One-click seed/unseed of 11 rich demo itineraries (Spiti Valley, Ladakh, Rajasthan, Andaman Islands, Meghalaya, Varanasi, Gokarna, Ooty, Chikmagalur, Varkala, Goa) complete with users, buddy trip listings, contributions, and contact messages
- **Submissions Queue** — Review, convert to trip with AI, or delete community submissions
- **Review Moderation** — Manage user reviews across all trips

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Framer Motion, ReactFlow, Three.js |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini API, Groq (LLaMA) |
| Monitoring | UptimeRobot API |
| Deployment | Render (full-stack) |
| Analytics | Google Tag Manager |

---

## Project Structure

```
LeaveApproved/
├── backend/
│   ├── models/
│   │   ├── Place.js            # Trip itinerary schema
│   │   ├── UserEntry.js        # User accounts
│   │   ├── TripListing.js      # Buddy trip listings
│   │   ├── Contribution.js     # Community submissions
│   │   └── ContactMessage.js   # Contact form messages
│   ├── routes/
│   │   ├── places.js           # Trip CRUD + likes/comments
│   │   ├── auth.js             # Register / login
│   │   ├── ai.js               # Gemini + Groq endpoints
│   │   ├── buddy.js            # Buddy trip matching
│   │   ├── admin.js            # Admin dashboard APIs
│   │   └── demo.js             # Demo mode seed/unseed
│   └── server.js               # Express app entry point
│
└── frontend/
    └── src/
        └── components/
            ├── AdminDashboard.jsx    # Full admin panel
            ├── Dashboard.jsx         # User trip explorer
            ├── FlowBuilder.jsx       # Visual itinerary builder
            ├── ItineraryFlow.jsx     # Read-only flow renderer
            ├── CustomNodes.jsx       # City, Hub, Note, Sticker nodes
            ├── CustomEdge.jsx        # Transport edges with emoji + labels
            ├── TravelBuddy.jsx       # AI chat assistant
            ├── TripComparison.jsx    # Side-by-side trip compare
            └── LoginPage.jsx         # Auth (register / login)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gemini API key
- Groq API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/sudhanshu0716/LeaveApproved.git
cd LeaveApproved

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

Create `backend/.env`:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password
UPTIMEROBOT_API_KEY=your_uptimerobot_api_key
UPTIMEROBOT_MONITOR_ID=your_monitor_id
```

```bash
# Start backend (from /backend)
node server.js

# Start frontend (from /frontend)
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5001`.

---

## Deployment (Render)

The project is configured for single-service deployment on Render:

- **Build command:** `npm run build` (installs + builds frontend)
- **Start command:** `npm start` (serves frontend static files + API from Express)
- Set all `.env` variables in Render → Settings → Environment

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/places` | Get all published trips |
| `POST` | `/api/places/:id/like` | Toggle like on a trip |
| `POST` | `/api/places/:id/comment` | Post a comment |
| `GET` | `/api/admin/uptime` | Live UptimeRobot status |
| `GET` | `/api/admin/contributions` | All community submissions |
| `POST` | `/api/admin/demo/on` | Seed demo data |
| `POST` | `/api/admin/demo/off` | Remove demo data |
| `GET` | `/api/admin/demo/status` | Check demo state |
| `POST` | `/api/heartbeat` | Live visitor ping |
| `GET` | `/api/active-users` | Current active visitor count |
| `POST` | `/api/generate-trip` | AI itinerary generation (Gemini) |
| `POST` | `/api/chat` | AI travel chat (Groq) |

---

## Visual Flow Builder

The FlowBuilder is the centrepiece feature — a drag-and-drop canvas built on **ReactFlow** with custom node and edge types.

### Node Types

| Node | Purpose |
|---|---|
| `CityNode` | Main destination card — arrival/departure times, day marker, hotel, food, activities |
| `HubNode` | Transit or layover point |
| `NoteNode` | Free-text annotation |
| `StickerNode` | Decorative emoji sticker |

### Transport Edges

Edges connect city nodes and display transport mode with an auto-matched emoji:

| Emoji | Modes |
|---|---|
| ✈️ | FLIGHT |
| 🚆 | TRAIN |
| 🚇 | METRO |
| 🚌 | BUS |
| 🚕 | CAB, CAR |
| 🛺 | AUTO |
| 🛵 | BIKE, SCOOTER, CYCLE |
| 🏍️ | MOTORBIKE, ENFIELD |
| ⛵ | FERRY, BOAT, HOUSEBOAT |
| 🚣 | CANOE, KAYAK, CORACLE, RAFT |
| 🥾 | WALK, TREK, HIKE |
| 🚙 | JEEP, SAFARI |
| 🐪 | CAMEL |
| 🚀 | anything else |

**Multiple transport edges** between the same two nodes are supported — each fans out with an independent bezier arc, distinct colour, and its own label showing mode, price and duration. This lets itineraries express real-world route choices (e.g. Mumbai → Goa by flight, overnight train, or sleeper bus — all visible on the canvas simultaneously).

Edge label panels are draggable in edit mode and display `transportDetails` (price/duration) as a subtitle in read-only view.

---

## Demo Mode

Admins can toggle a fully seeded demo state from the dashboard in one click. Seeding creates:

- **11 curated itineraries** across India with 6–8 stops each, specific hotels, food recommendations, and mixed transport modes
- **20 demo user accounts**
- **20 buddy trip listings**
- **15 community contribution texts**
- **15 contact messages**

Demo data is tagged and removed cleanly on toggle-off without touching any real user content.

### Itineraries included in demo

| # | Route | Highlights |
|---|---|---|
| 1 | Delhi → **Spiti Valley** | Chandratal Lake 4300m, Key Monastery, Hikkim post office (world's highest) |
| 2 | Delhi → **Ladakh** | Khardung La 5359m, Pangong Tso, Nubra Valley camel dunes, Tso Moriri flamingos |
| 3 | Delhi → **Rajasthan** | Jaipur, Pushkar, Jodhpur, Ranakpur Jain Temple, Jaisalmer, Sam Sand Dunes |
| 4 | Chennai → **Andaman Islands** | Cellular Jail, bioluminescent kayaking, Radhanagar Beach, Neil Island, Baratang caves |
| 5 | Kolkata → **Meghalaya** | Nongriat living root bridge, Dawki glass river, Mawlynnong cleanest village |
| 6 | Mumbai → **Varanasi** | Pre-dawn Ganga ghats, Kashi Vishwanath 3:30am, Sarnath, Bodh Gaya Mahabodhi tree |
| 7 | Mumbai → **Gokarna** | Konkan Railway, Om Beach, Paradise Beach cliff trek, Murudeshwar, Yana caves |
| 8 | Chennai → **Ooty** | Nilgiri Mountain Railway (UNESCO), Coonoor tea factory, Kodaikanal, Pillar Rocks |
| 9 | Bangalore → **Chikmagalur** | Mullayanagiri 1930m, Kudremukh trek, Bhadra Tiger Reserve jeep safari |
| 10 | Bangalore → **Varkala** | Padmanabhaswamy Temple, Kovalam beach, cliff sunset, Ashtamudi houseboat |
| 11 | Mumbai → **Goa** *(multi-transport demo)* | 3 routes Mumbai→Goa (flight/train/bus), 2 ferry options, scooter vs bus at each leg |

---

## Live Visitor Tracking

A lightweight heartbeat system tracks real active sessions without any external analytics dependency:

- Browser pings `/api/heartbeat` every 30 seconds with a stable `sessionStorage` ID
- Backend keeps an in-memory Map of session → last seen timestamp
- Sessions inactive for 2+ minutes are pruned automatically
- Admin dashboard polls `/api/active-users` every 30 seconds

---

<p align="center">
  Built with care for travelers who plan obsessively.
</p>
