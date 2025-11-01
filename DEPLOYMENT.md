# Deployment Guide

This project consists of two parts:
1. **Frontend**: Next.js app (deploy to Vercel)
2. **Backend**: Flask API (deploy to Railway, Render, or Fly.io)

## Backend Deployment

### Option 1: Railway (Recommended)

1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn api:app --bind 0.0.0.0:$PORT`
5. Add Environment Variables:
   ```
   OPENAI_API_KEY=your-key-here
   HYPERSPELL_API_KEY=your-key-here (optional)
   USE_HYPERSPELL_CLOUD=false (or true if using cloud)
   PORT=8000
   ```
6. Railway will generate a URL like: `https://your-app.railway.app`
7. Copy this URL for frontend configuration

### Option 2: Render

1. Go to [Render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `morv-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn api:app --bind 0.0.0.0:$PORT`
5. Add Environment Variables (same as Railway)
6. Render will generate a URL like: `https://your-app.onrender.com`

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly auth login`
3. Create `fly.toml` in backend directory:
   ```toml
   app = "morv-backend"
   primary_region = "iad"

   [build]
   builder = "paketobuildpacks/builder:base"

   [env]
   PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
4. Run `cd backend && fly deploy`
5. Set secrets: `fly secrets set OPENAI_API_KEY=your-key`

## Frontend Deployment (Vercel)

### Step 1: Deploy Backend First

**Important**: Deploy the backend first and get its URL, then configure the frontend.

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```
   (Replace with your actual backend URL)
6. Click "Deploy"

### Alternative: Vercel CLI

```bash
cd frontend
vercel
# When prompted, set:
# NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

## Local Development Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python api.py
# Backend runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## Environment Variables Summary

### Backend (Railway/Render/Fly.io)
- `OPENAI_API_KEY` - Required for AI agents
- `HYPERSPELL_API_KEY` - Optional, for Hyperspell Cloud
- `USE_HYPERSPELL_CLOUD` - Optional, set to `true` to use cloud
- `PORT` - Automatically set by hosting platform

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` - **Required**: Your backend API URL (e.g., `https://your-app.railway.app/api`)

## Troubleshooting

### Backend Issues
- Ensure `gunicorn` is in `requirements.txt`
- Check that `Procfile` is in the `backend` directory
- Verify environment variables are set correctly
- Check logs in your hosting platform dashboard

### Frontend Issues
- Ensure `NEXT_PUBLIC_API_URL` is set correctly
- Verify CORS is enabled in backend (should be handled by Flask-CORS)
- Check browser console for API connection errors
- Ensure backend URL includes `/api` at the end

### CORS Issues
The backend uses Flask-CORS which should allow all origins. If you encounter CORS errors:
- Check that Flask-CORS is installed and enabled
- Verify the backend URL is correct
- Check browser console for specific CORS error messages

## Architecture

```
┌─────────────────┐         HTTP Requests         ┌─────────────────┐
│                 │ ────────────────────────────> │                 │
│  Vercel         │                                │  Railway/Render │
│  (Frontend)     │ <──────────────────────────── │  (Backend API)  │
│  Next.js        │         JSON Responses        │  Flask          │
│                 │                                │                 │
└─────────────────┘                                └─────────────────┘
```

The frontend (Next.js on Vercel) makes API calls to the backend (Flask on Railway/Render/Fly.io).

