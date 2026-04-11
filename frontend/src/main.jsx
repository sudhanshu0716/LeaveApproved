import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Dynamic Environment Awareness: Smart API Routing
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const prodURL = 'https://leaveapproved.onrender.com';
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : prodURL);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
