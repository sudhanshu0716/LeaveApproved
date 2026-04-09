# 🚀 Deployment Guide: LeaveApproved

I have prepared the codebase for production deployment on **Render.com**. Follow these steps to get your site live and secure.

## 1. Security Enhancements
I have already made the following critical changes to secure your app:
- **API Key Proxying**: Removed the Gemini API Key from the frontend. It is now stored safely on the backend server.
- **Environment Variables**: Created a `.env` system to handle sensitive keys.
- **Root Configuration**: Added a root `package.json` and `.gitignore` so Render knows how to build your project automatically.

## 2. GitHub Preparation
Run these commands in your project folder to push to your repository:

```bash
# Initialize git if not already done
git init

# Add all files (the .gitignore will automatically exclude node_modules and .env)
git add .

# Initial commit
git commit -m "chore: prepare for production deployment"

# Link to your repo
git remote add origin https://github.com/sudhanshu0716/LeaveApproved.git

# Push to main
git push -u origin main
```

## 3. Render.com Setup
When creating a new **Web Service** on Render, use these settings:

| Setting | Value |
| :--- | :--- |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

### Environment Variables
You **MUST** add these variables in the Render "Environment" tab:

1. `NODE_ENV`: `production`
2. `MONGODB_URI`: *Your MongoDB Atlas connection string*
3. `GEMINI_API_KEY`: `AIzaSyBoz7MS06NaL-KDfar7hIVeMNk7JP8mes4`

## 4. Production Files Added
- [/package.json](file:///c:/Users/91897/Desktop/LeaveApproved/package.json): Root script for Render to build both frontend and backend.
- [/.gitignore](file:///c:/Users/91897/Desktop/LeaveApproved/.gitignore): Prevents `node_modules` and `.env` from being leaked to GitHub.
- [/backend/server.js](file:///c:/Users/91897/Desktop/LeaveApproved/backend/server.js): Updated to serve the built frontend files.

## 5. OPTIONAL: Deploy as a separate "Static Site"
If you want to separate the frontend for better performance:
1. **New Render Service**: Choose "Static Site".
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variable**: `VITE_API_URL` = `https://leaveapproved.onrender.com`

---
**Your Live Website is currently served at:** [https://leaveapproved.onrender.com](https://leaveapproved.onrender.com)
