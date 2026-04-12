# 🚀 Kisaan AI - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying Kisaan AI to production using Railway or Render for the backend and Vercel for the frontend.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Changes Applied
- [x] All file paths converted to absolute paths using `os.path.abspath()`
- [x] Database path configurable via `DATABASE_PATH` environment variable
- [x] CORS configured to allow all origins (`["*"]`)
- [x] `gunicorn` added to `requirements.txt`
- [x] Production Dockerfile created (`Dockerfile.production`)
- [x] Railway config created (`railway.toml`)
- [x] Render config created (`render.yaml`)

### 🔑 Required Environment Variables
You'll need to set these in your cloud platform dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | `AIzaSy...` |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API key for weather data | `797f57...` |
| `JWT_SECRET_KEY` | Secret key for JWT authentication | Auto-generated or custom |
| `VITE_API_URL` | Backend URL (set after deployment) | `https://your-app.railway.app` |
| `DATABASE_PATH` | (Optional) Custom database location | `/var/data/kisaan_ai.db` |

---

## 🚂 Option 1: Deploy to Railway (Recommended)

### Why Railway?
- ✅ Automatic HTTPS
- ✅ Built-in persistent volumes
- ✅ Zero-config deployments
- ✅ Free tier: 500 hours/month

### Steps:

#### 1. Push Code to GitHub
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

#### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `kisaan-ai` repository
4. Railway will auto-detect `railway.toml` and use `Dockerfile.production`

#### 3. Add Environment Variables
In Railway dashboard:
1. Click your service → **"Variables"** tab
2. Add each variable from the table above
3. Click **"Deploy"** to restart with new variables

#### 4. Add Persistent Volume (Critical!)
SQLite database needs persistent storage:
1. Go to **"Settings"** → **"Volumes"**
2. Click **"Add Volume"**
3. Mount path: `/app` (this persists `kisaan_ai.db` and `/uploads`)
4. Size: 1 GB (free tier)
5. Click **"Add"**

#### 5. Get Your Backend URL
1. Go to **"Settings"** → **"Domains"**
2. Copy the Railway-provided URL (e.g., `https://kisaan-ai-production.up.railway.app`)
3. Update `VITE_API_URL` environment variable with this URL
4. Redeploy

#### 6. Test Deployment
```bash
curl https://your-app.railway.app/health
# Expected: {"status":"healthy","version":"2.0"}
```

---

## 🎨 Option 2: Deploy to Render

### Why Render?
- ✅ Free tier with persistent disks
- ✅ Auto-deploy from GitHub
- ✅ Built-in SSL

### Steps:

#### 1. Push Code to GitHub
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

#### 2. Deploy to Render
1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`

#### 3. Configure Environment Variables
Render will prompt you to fill in:
- `GEMINI_API_KEY`
- `OPENWEATHERMAP_API_KEY`
- `JWT_SECRET_KEY` (auto-generated)
- `VITE_API_URL` (use your Render URL after deployment)

#### 4. Persistent Disk (Auto-configured)
The `render.yaml` already configures a 1GB disk at `/var/data` for:
- SQLite database (`kisaan_ai.db`)
- Uploaded images (`/uploads`)
- ChromaDB vectors (`/chroma_db`)

#### 5. Get Your Backend URL
1. After deployment, copy the Render URL (e.g., `https://kisaan-ai-backend.onrender.com`)
2. Update `VITE_API_URL` in environment variables
3. Trigger a manual redeploy

#### 6. Test Deployment
```bash
curl https://kisaan-ai-backend.onrender.com/health
# Expected: {"status":"healthy","version":"2.0"}
```

---

## 🌐 Frontend Deployment (Vercel)

### Steps:

#### 1. Update Frontend API URL
In your local `.env` file:
```bash
VITE_API_URL=https://your-backend-url.railway.app
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or use Vercel's GitHub integration:
1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select your GitHub repo
4. Add environment variable: `VITE_API_URL=https://your-backend-url`
5. Click **"Deploy"**

#### 3. Test Full Stack
1. Open your Vercel URL
2. Try scanning a plant image
3. Check weather alerts
4. Test voice chat

---

## 🔧 Post-Deployment Tasks

### 1. Ingest RAG Data (Optional but Recommended)
The `/data` PDFs need to be indexed for expert advisory features:

**Option A: Run locally and upload database**
```bash
python scripts/ingest_data.py
# Upload kisaan_ai.db and chroma_db/ to your cloud storage
```

**Option B: Run on server (Railway/Render)**
```bash
# SSH into your Railway/Render instance
railway run python scripts/ingest_data.py
# or
render ssh kisaan-ai-backend
python scripts/ingest_data.py
```

### 2. Monitor Logs
**Railway:**
```bash
railway logs
```

**Render:**
Check the "Logs" tab in Render dashboard

### 3. Set Up Custom Domain (Optional)
**Railway:**
1. Go to **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Add your domain and configure DNS

**Render:**
1. Go to **"Settings"** → **"Custom Domain"**
2. Follow DNS configuration instructions

---

## 🐛 Troubleshooting

### Issue: "0°C" showing in weather
**Cause:** OpenWeatherMap API key not set or invalid  
**Fix:** Verify `OPENWEATHERMAP_API_KEY` in environment variables

### Issue: Image upload fails with 422 error
**Cause:** Starlette version mismatch  
**Fix:** Verify `requirements.txt` has:
```
fastapi==0.115.5
starlette==0.41.3
python-multipart==0.0.12
```

### Issue: Database resets on every deploy
**Cause:** No persistent volume configured  
**Fix:** 
- **Railway:** Add volume mounted at `/app`
- **Render:** Verify `render.yaml` has disk configuration

### Issue: "ChromaDB EMPTY" warning
**Cause:** RAG data not ingested  
**Fix:** Run `python scripts/ingest_data.py` (see Post-Deployment Tasks)

### Issue: CORS errors from frontend
**Cause:** `VITE_API_URL` mismatch  
**Fix:** Ensure frontend's `VITE_API_URL` matches backend URL exactly

---

## 📊 Performance Optimization

### Recommended Settings

**Railway/Render:**
- Workers: 2 (configured in Dockerfile)
- Timeout: 120s (for AI inference)
- Memory: 512MB minimum

**Vercel:**
- Region: Same as backend (reduce latency)
- Build command: `npm run build`
- Output directory: `dist`

---

## 🔒 Security Checklist

- [ ] `JWT_SECRET_KEY` is strong and unique
- [ ] API keys are stored as environment variables (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] HTTPS is enabled (automatic on Railway/Render/Vercel)
- [ ] Database backups configured (Railway/Render auto-backup)

---

## 📞 Support

If you encounter issues:
1. Check logs: `railway logs` or Render dashboard
2. Verify all environment variables are set
3. Test `/health` endpoint
4. Check GitHub Issues for known problems

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ `/health` returns `{"status":"healthy","version":"2.0"}`
- ✅ Weather data loads without showing "0°C"
- ✅ Image upload and diagnosis works
- ✅ Voice chat returns audio responses
- ✅ Database persists between deploys
- ✅ Frontend connects to backend without CORS errors

---

**Deployment Time Estimate:** 15-20 minutes  
**Cost:** $0 (using free tiers)

Good luck with your hackathon demo! 🚀🌾
