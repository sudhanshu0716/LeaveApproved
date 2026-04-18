<h1 align="center">
  <br />
  ✈️ LeaveApproved
  <br />
</h1>

<p align="center">
  <strong>AI-powered travel itinerary builder with visual flow maps, community submissions, and a real-time admin dashboard.</strong>
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
- **Trip Explorer** — Browse curated itineraries with route maps, budget ranges, duration, and distance
- **Visual Flow Builder** — Drag-and-drop canvas to build trip flows with city nodes, day banners, attraction pins, budget cards, and transport edges
- **AI Travel Buddy** — Chat interface powered by Groq (LLaMA) for real-time travel recommendations
- **AI Itinerary Generator** — Describe a trip in plain text; Gemini AI generates a full structured itinerary
- **Trip Comparison** — Compare two trips side by side
- **Community Submissions** — Submit your own trip ideas for admin review

### For Admins
- **Analytics Dashboard** — Live visitor count, user registrations by company, daily activity chart
- **Website Status** — Real-time UptimeRobot widget: Up/Down status, 24h/7d/30d uptime %, avg/min/max response time
- **Trip Management** — Add, edit, and delete published trips with full FlowBuilder integration
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
│   │   ├── Place.js          # Trip itinerary schema
│   │   ├── UserEntry.js      # User accounts
│   │   ├── TripListing.js    # Trip listings
│   │   └── Contribution.js   # Community submissions
│   ├── routes/
│   │   └── api.js            # All API routes
│   ├── server.js             # Express app entry point
│   └── .env                  # Environment variables
│
└── frontend/
    └── src/
        └── components/
            ├── AdminDashboard.jsx   # Full admin panel
            ├── Dashboard.jsx        # User trip explorer
            ├── FlowBuilder.jsx      # Visual itinerary builder
            ├── CustomNodes.jsx      # City, Hub, Day, POI, Budget nodes
            ├── CustomEdge.jsx       # Animated transport edges
            ├── TravelBuddy.jsx      # AI chat assistant
            ├── LoginPage.jsx        # Auth (register / login)
            ├── Landing.jsx          # Marketing landing page
            └── TripComparison.jsx   # Side-by-side trip compare
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
| `GET` | `/api/admin/uptime` | Live UptimeRobot status |
| `GET` | `/api/admin/contributions` | All community submissions |
| `PUT` | `/api/admin/contributions/:id` | Mark submission as processed |
| `DELETE` | `/api/admin/contributions/:id` | Delete submission |
| `POST` | `/api/heartbeat` | Live visitor ping |
| `GET` | `/api/active-users` | Current active visitor count |
| `POST` | `/api/generate-trip` | AI itinerary generation (Gemini) |
| `POST` | `/api/chat` | AI travel chat (Groq) |

---

## Visual Flow Builder

The FlowBuilder is the centrepiece feature — a drag-and-drop canvas built on **ReactFlow** with custom node and edge types:

**Node Types**
- `CityNode` — Main destination card with arrival/departure, hotel, activities, custom fields
- `HubNode` — Transit or layover point
- `NoteNode` — Free-text annotation
- `DayBannerNode` — Day separator label
- `AttractionNode` — Point of interest pin (restaurants, sights, activities)
- `BudgetNode` — Budget breakdown card

**Edge Features**
- Quadratic bezier curves with smart auto-arc
- Draggable label panels (transport mode + reference number)
- Color-coded arrows matching edge color
- Dashed line option for flexible/alternative routes

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
