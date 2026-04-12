# ✈️ Kisaan AI - Pre-Flight Deployment Checklist

## Before You Deploy - Verify Everything

---

## 1️⃣ Code Verification

### ✅ Critical Files Modified
- [ ] `main.py` - Uses `BASE_DIR` and absolute paths
- [ ] `models.py` - Database path uses `os.getenv("DATABASE_PATH")`
- [ ] `requirements.txt` - Contains `gunicorn==23.0.0`

### ✅ New Files Present
- [ ] `Dockerfile.production` exists
- [ ] `railway.toml` exists
- [ ] `render.yaml` exists
- [ ] `.env.production.example` exists

### ✅ Documentation Complete
- [ ] `DEPLOYMENT_GUIDE.md` exists
- [ ] `PRODUCTION_READY.md` exists
- [ ] `QUICK_DEPLOY.md` exists
- [ ] `DEPLOYMENT_SUMMARY.md` exists

---

## 2️⃣ Environment Variables Ready

### Required Keys (Copy from `.env`)
```bash
✅ GEMINI_API_KEY=AIzaSy...
✅ OPENWEATHERMAP_API_KEY=797f57...
```

### Generate New Keys
```bash
✅ JWT_SECRET_KEY (32+ random characters)
   Generate: openssl rand -hex 32
   Or use: https://randomkeygen.com/
```

### Will Set After Deploy
```bash
⏳ VITE_API_URL (get from Railway/Render after first deploy)
```

---

## 3️⃣ Git Repository Status

### Check Git Status
```bash
git status
# Should show: modified main.py, models.py, requirements.txt
# Should show: new files Dockerfile.production, railway.toml, etc.
```

### Commit Changes
```bash
git add .
git commit -m "Production deployment ready - absolute paths, gunicorn, configs"
git push origin main
```

### Verify Remote
```bash
git remote -v
# Should show your GitHub repository URL
```

---

## 4️⃣ Local Testing (Optional but Recommended)

### Test Backend Locally
```bash
# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload

# Test health endpoint
curl http://localhost:8000/health
# Expected: {"status":"healthy","version":"2.0"}
```

### Test Frontend Locally
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

---

## 5️⃣ Platform Account Setup

### Railway
- [ ] Account created at [railway.app](https://railway.app)
- [ ] GitHub connected
- [ ] Railway CLI installed: `npm i -g @railway/cli`
- [ ] Logged in: `railway login`

### Render
- [ ] Account created at [render.com](https://render.com)
- [ ] GitHub connected
- [ ] Email verified

### Vercel
- [ ] Account created at [vercel.com](https://vercel.com)
- [ ] GitHub connected
- [ ] Vercel CLI installed: `npm i -g vercel`

---

## 6️⃣ Deployment Strategy Decision

### Choose Your Platform

#### Option A: Railway (Recommended)
**Pros:**
- ✅ Fastest setup
- ✅ Built-in volumes
- ✅ 500 free hours/month

**Cons:**
- ⚠️ Manual volume setup required

**Choose if:** You want speed and simplicity

---

#### Option B: Render
**Pros:**
- ✅ Persistent disk auto-configured
- ✅ 750 free hours/month
- ✅ Zero manual setup

**Cons:**
- ⚠️ Slightly slower cold starts

**Choose if:** You want zero-config persistence

---

## 7️⃣ Persistent Storage Plan

### Railway
- [ ] Will add volume at `/app` after first deploy
- [ ] Volume size: 1 GB (free tier)

### Render
- [ ] `render.yaml` already configures disk at `/var/data`
- [ ] Will set `DATABASE_PATH=/var/data/kisaan_ai.db`

---

## 8️⃣ Deployment Order

### Correct Order (Important!)
1. **Backend first** (Railway/Render)
2. **Get backend URL**
3. **Update `VITE_API_URL`** in backend env vars
4. **Redeploy backend**
5. **Frontend last** (Vercel) with correct `VITE_API_URL`

### Why This Order?
- Frontend needs backend URL to connect
- Backend needs to know its own URL for CORS and audio file URLs

---

## 9️⃣ Testing Plan

### Automated Tests
```bash
# After backend deploy
bash verify-deployment.sh https://your-backend-url
```

### Manual Tests
- [ ] Open frontend URL in browser
- [ ] Check weather widget (should NOT show 0°C)
- [ ] Upload plant image via "Scan Plant"
- [ ] Test voice chat (speak in Hindi)
- [ ] Check browser console (no CORS errors)

---

## 🔟 Rollback Plan

### If Deployment Fails

#### Railway
```bash
# Rollback to previous deployment
railway rollback
```

#### Render
- Go to dashboard → "Manual Deploy" → Select previous commit

#### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

---

## 1️⃣1️⃣ Post-Deployment Tasks

### Immediate
- [ ] Test all endpoints
- [ ] Verify persistent storage (upload image → redeploy → check if exists)
- [ ] Check logs for errors
- [ ] Update README with live URLs

### Optional (Enhanced Features)
- [ ] Run `python scripts/ingest_data.py` for RAG
- [ ] Set up custom domain
- [ ] Configure monitoring
- [ ] Add Firebase for push notifications

---

## 1️⃣2️⃣ Demo Preparation

### URLs to Share with Judges
```
Backend: https://_____________________.railway.app
Frontend: https://_____________________.vercel.app
GitHub: https://github.com/___________/kisaan-ai
```

### Demo Script
1. **Show live app** - Open frontend URL
2. **Weather feature** - Point to real-time data
3. **Scan plant** - Upload image, show AI diagnosis
4. **Voice chat** - Speak in Hindi, get audio response
5. **Expert advisory** - Ask farming question
6. **Code walkthrough** - Show GitHub repo

### Backup Plan
- [ ] Screenshots of working app
- [ ] Video recording of features
- [ ] Local version ready (if internet fails)

---

## ✅ Final Go/No-Go Decision

### All Green? Deploy!
- [x] Code changes verified
- [x] Environment variables ready
- [x] Git pushed to GitHub
- [x] Platform accounts set up
- [x] Deployment strategy chosen
- [x] Testing plan prepared
- [x] Rollback plan understood

### Any Red? Fix First!
- [ ] Missing environment variables → Get API keys
- [ ] Git not pushed → Push to GitHub
- [ ] Platform not set up → Create accounts
- [ ] Local tests failing → Debug locally first

---

## 🚀 Ready to Deploy?

If all checkboxes above are ✅, proceed with:

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect repo
4. Deploy

**Vercel (after backend is live):**
```bash
vercel --prod
```

---

## 📞 Emergency Contacts

### Documentation
- Full guide: `DEPLOYMENT_GUIDE.md`
- Quick reference: `QUICK_DEPLOY.md`
- Technical details: `PRODUCTION_READY.md`

### Platform Support
- Railway: [docs.railway.app](https://docs.railway.app)
- Render: [render.com/docs](https://render.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

---

## ⏱️ Time Budget

| Task | Time | Status |
|------|------|--------|
| Pre-flight checks | 10 min | ⏳ |
| Backend deploy | 10 min | ⏳ |
| Frontend deploy | 5 min | ⏳ |
| Testing | 5 min | ⏳ |
| **Total** | **30 min** | ⏳ |

---

**Status:** ✅ PRE-FLIGHT COMPLETE  
**Next Step:** Deploy backend to Railway or Render  
**Confidence:** 🟢 HIGH

Let's go! 🚀
