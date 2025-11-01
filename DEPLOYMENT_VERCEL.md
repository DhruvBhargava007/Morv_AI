# Deployment Guide - Vercel (Full Stack)

This guide shows how to deploy both frontend (Next.js) and backend (Flask API) to Vercel.

## Architecture

```
Vercel Deployment:
├── Frontend (Next.js) → Served as static/SSR pages
└── Backend (Flask API) → Served as serverless functions
    └── /api/* routes → Handled by api/index.py (Flask app)
```

## Prerequisites

1. GitHub account with repository pushed
2. Vercel account (sign up at https://vercel.com)

## Step-by-Step Deployment

### Step 1: Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: Leave empty (root)
   - **Build Command**: (auto-detected from vercel.json)
   - **Output Directory**: (auto-detected from vercel.json)
5. Add Environment Variables:
   ```
   OPENAI_API_KEY=your-openai-api-key
   HYPERSPELL_API_KEY=your-hyperspell-key (optional)
   USE_HYPERSPELL_CLOUD=false
   ```
6. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
cd /Users/Ambikabhargava/Desktop/Morv_AI
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N** (first time)
- Project name? (default: Morv_AI)
- Directory? (default: ./)
- Override settings? **N**

Set environment variables:
```bash
vercel env add OPENAI_API_KEY
vercel env add HYPERSPELL_API_KEY  # Optional
vercel env add USE_HYPERSPELL_CLOUD  # Set to "false"
```

Deploy:
```bash
vercel --prod
```

### Step 2: Configure Frontend API URL

After deployment, Vercel will give you a URL like: `https://your-project.vercel.app`

Since both frontend and backend are on the same domain, the frontend will automatically use:
```
NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api
```

**If deploying to preview branches**, you may need to set this environment variable.

### Step 3: Database Considerations

⚠️ **Important**: SQLite databases don't persist in Vercel serverless functions!

**Options:**

1. **Use Vercel KV or Postgres** (Recommended for production)
   - Add Vercel Postgres from your Vercel dashboard
   - Migrate from SQLite to Postgres
   - Update `get_db_connection()` in `backend/api.py`

2. **Use Cloud SQLite** (Temporary solution)
   - Use a service like Cloudflare Workers KV or Upstash
   - Or store database in external storage (S3, etc.)

3. **Initialize database on cold start** (Not recommended)
   - Copy database to `/tmp` on function initialization
   - Data will be lost when function restarts

### Step 4: Verify Deployment

1. Visit your deployed URL
2. Test frontend pages
3. Test API endpoints:
   - `https://your-project.vercel.app/api/health`
   - `https://your-project.vercel.app/api/tanks`

## File Structure for Vercel

```
Morv_AI/
├── api/
│   ├── index.py          # Flask app serverless wrapper
│   └── requirements.txt  # Python dependencies
├── backend/              # Backend source code
│   ├── api.py           # Flask app
│   ├── requirements.txt
│   └── ...
├── frontend/            # Next.js app
│   ├── package.json
│   └── ...
└── vercel.json          # Vercel configuration
```

## Configuration Details

### vercel.json

The `vercel.json` file routes requests:
- `/api/*` → Python serverless function (`api/index.py`)
- `/*` → Next.js frontend

### API Serverless Function

`api/index.py`:
- Imports Flask app from `backend/api.py`
- Exports app for Vercel Python runtime
- Handles all `/api/*` routes

## Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI agents |
| `HYPERSPELL_API_KEY` | No | Hyperspell API key (if using cloud) |
| `USE_HYPERSPELL_CLOUD` | No | Set to `true` to use Hyperspell cloud |
| `NEXT_PUBLIC_API_URL` | No* | API URL (auto-set on same domain) |

*Only needed if using different domain or preview deployments

## Troubleshooting

### Build Errors

1. **Python dependencies not found**
   - Check `api/requirements.txt` includes all dependencies
   - Ensure `backend/requirements.txt` is up to date

2. **Import errors**
   - Verify Python path in `api/index.py`
   - Check backend directory structure

3. **Database errors**
   - SQLite won't persist in serverless - use external database
   - Check `/tmp` is writable (temporary files only)

### Runtime Errors

1. **404 on API routes**
   - Check `vercel.json` routing configuration
   - Verify `api/index.py` exports Flask app correctly

2. **CORS errors**
   - Flask-CORS should handle this automatically
   - Check CORS settings in `backend/api.py`

3. **Module not found**
   - Ensure all imports are available
   - Check Python path configuration

## Local Development

For local development, run separately:

```bash
# Backend (Terminal 1)
cd backend
python api.py  # Runs on http://localhost:8000

# Frontend (Terminal 2)
cd frontend
npm run dev  # Runs on http://localhost:3000
```

The frontend will use `http://localhost:8000/api` for API calls (configured in `api-client.ts`).

## Database Migration for Production

For production, consider migrating from SQLite to Postgres:

1. Add Vercel Postgres from dashboard
2. Update `get_db_connection()` to use Postgres
3. Run migrations to create tables

This is recommended for production deployments.

