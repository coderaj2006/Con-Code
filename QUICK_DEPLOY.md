# ⚡ Kisaan AI - Quick Deploy Reference

## 🚂 Railway (5 Commands)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Deploy
railway up

# 5. Set environment variables (in Railway dashboard)
# GEMINI_API_KEY, OPENWEATHERMAP_API_KEY, JWT_SECRET_KEY, VITE_API_URL
```

**Don't forget:** Add volume at `/app` in Railway dashboard!

---

## 🎨 Render (Web UI)

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Fill in environment variables when prompted
5. Deploy (disk auto-configured via `render.yaml`)

---

## 🌐 Vercel Frontend

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Set backend URL
echo "VITE_API_URL=https://your-backend-url" > .env.production

# 3. Deploy
vercel --prod
```

---

## 🔑 Environment Variables Checklist

```bash
✅ GEMINI_API_KEY=AIzaSy...
✅ OPENWEATHERMAP_API_KEY=797f57...
✅ JWT_SECRET_KEY=<32+ random chars>
✅ VITE_API_URL=https://your-backend-url
⚠️ DATABASE_PATH=/var/data/kisaan_ai.db (Render only)
```

---

## 🧪 Test After Deploy

```bash
# Health check
curl https://your-app.railway.app/health

# Weather check
curl "https://your-app.railway.app/weather-alerts?lat=28.6139&lon=77.2090"
```

Expected: JSON responses, no errors.

---

## 📁 Files Created

- `Dockerfile.production` - Production container
- `railway.toml` - Railway config
- `render.yaml` - Render config
- `DEPLOYMENT_GUIDE.md` - Full instructions
- `.env.production.example` - Env var template

---

## ⏱️ Time Estimate

- Railway deploy: **10 min**
- Render deploy: **10 min**
- Vercel frontend: **5 min**
- **Total: 15-20 min**

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| 0°C weather | Check `OPENWEATHERMAP_API_KEY` |
| Upload fails | Verify `python-multipart==0.0.12` |
| DB resets | Add persistent volume |
| CORS errors | Match `VITE_API_URL` exactly |

---

**Full docs:** See `DEPLOYMENT_GUIDE.md`
