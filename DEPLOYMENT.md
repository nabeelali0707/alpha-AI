# 🚀 AlphaAI Deployment Guide

**Production deployment strategies for AlphaAI with Render, Railway, Vercel, and Docker.**

---

## Table of Contents
1. [Render (Recommended)](#render-recommended)
2. [Railway](#railway)
3. [Vercel (Frontend Only)](#vercel-frontend-only)
4. [Docker (Self-Hosted)](#docker-self-hosted)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Scaling](#monitoring--scaling)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Render (Recommended)

### Why Render?
- ✅ Free PostgreSQL database included
- ✅ Simple GitHub integration
- ✅ Auto-deploy on push
- ✅ Built-in SSL certificates
- ✅ Low-cost scaling

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Database name: `alphaai-db`
4. Plan: **Free** (optional)
5. Create
6. Save the connection string (look like `postgresql://user:pass@host:5432/db`)

### Step 2: Deploy Backend

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repo
   - Name: `alphaai-backend`
   - Environment: `Python 3.11`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan: **Starter** ($7/month)

2. **Set Environment Variables** (Settings → Environment)
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE=your-service-key
   SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://user:pass@host:5432/db
   LOG_LEVEL=INFO
   ```

3. **Deploy**
   - Click **"Deploy"**
   - Backend accessible at: `https://alphaai-backend.render.com`

### Step 3: Deploy Frontend

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repo (frontend directory)
   - Name: `alphaai-frontend`
   - Environment: `Node`
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Plan: **Free** (limited, upgrade to Starter for better performance)

2. **Set Environment Variables**
   ```
   NEXT_PUBLIC_ALPHAAI_API_BASE_URL=https://alphaai-backend.render.com/api/v1
   NODE_ENV=production
   ```

3. **Deploy**
   - Click **"Deploy"**
   - Frontend accessible at: `https://alphaai-frontend.render.com`

### Step 4: Run Database Migration

Connect to your Render PostgreSQL instance and execute `supabase/tables.sql`:

```bash
# From local machine
psql "postgresql://user:pass@host:5432/db" < supabase/tables.sql
```

Or use Render's PostgreSQL console.

---

## 🚂 Railway

### Why Railway?
- ✅ GitHub integration (push to deploy)
- ✅ Simple pricing
- ✅ Database templates included
- ✅ CLI for local testing

### Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
railway init
# Select: Node + Python
# Configure backend and frontend services
```

### Step 3: Add Services

```bash
# Add PostgreSQL
railway add postgresql

# Configure environment
railway variables set SUPABASE_URL=... SUPABASE_SERVICE_ROLE=...
```

### Step 4: Deploy

```bash
railway up
```

---

## ✨ Vercel (Frontend Only)

### Why Vercel?
- ✅ Free tier
- ✅ Next.js optimized
- ✅ Edge Functions support
- ✅ Zero-config deployment

### Step 1: Connect GitHub

1. Go to [Vercel](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repo
4. Select **frontend** directory

### Step 2: Environment Variables

```
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=https://alphaai-backend.onrender.com/api/v1
```

(Use your deployed backend URL)

### Step 3: Deploy

- Click **"Deploy"**
- Frontend available at: `https://alphaai.vercel.app` (custom domain available)

---

## 🐳 Docker (Self-Hosted)

### Option 1: Local Docker

```bash
docker-compose up -d

# Services:
# - http://localhost:3000 (frontend)
# - http://localhost:8001 (backend)
# - localhost:5432 (postgres)
```

### Option 2: VPS Deployment (AWS EC2, DigitalOcean, Linode)

**1. SSH into your VPS**
```bash
ssh ubuntu@your-vps-ip
```

**2. Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**3. Clone Repository**
```bash
git clone https://github.com/your-org/alphaai.git
cd alphaai
```

**4. Configure Environment**
```bash
# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-key
POSTGRES_PASSWORD=strong-password
EOF
```

**5. Start Services**
```bash
docker-compose up -d

# Check status
docker-compose logs -f
```

**6. Setup Domain (Optional)**

Use Nginx as reverse proxy:

```nginx
# /etc/nginx/sites-available/alphaai
upstream backend {
    server localhost:8001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name alphaai.app;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo systemctl restart nginx
```

---

## 🔑 Environment Variables

### Backend (required)

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Server
BACKEND_PORT=8001 (Docker: use $PORT)
LOG_LEVEL=INFO

# Cache (optional)
CACHE_TTL_PRICES=30
CACHE_TTL_HISTORY=300
CACHE_TTL_INFO=3600
```

### Frontend (required)

```bash
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=https://api.alphaai.app/api/v1
NODE_ENV=production
```

---

## 📊 Monitoring & Scaling

### Health Checks

```bash
# Backend health
curl https://api.alphaai.app/api/v1/

# Frontend health
curl https://alphaai.app -o /dev/null -s -w "%{http_code}\n"
```

### Log Monitoring

**Render:**
```
Dashboard → Service → Logs
```

**Railway:**
```
railway logs
```

**Docker:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Performance Metrics

Monitor on Render/Railway/AWS dashboards:
- CPU usage
- Memory usage
- Database connections
- Request latency

### Scaling

**Horizontal Scaling:**
1. Add load balancer (AWS ALB, Nginx)
2. Deploy multiple backend instances
3. Route requests with round-robin

**Vertical Scaling:**
1. Upgrade VPS plan
2. Increase database resources
3. Enable Redis caching (optional)

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port 8001 already in use
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# 2. Missing environment variables
docker-compose ps  # Check if service restarting
```

### Frontend can't connect to backend

```bash
# 1. Check backend URL
echo $NEXT_PUBLIC_ALPHAAI_API_BASE_URL

# 2. Test connectivity
curl $NEXT_PUBLIC_ALPHAAI_API_BASE_URL/

# 3. Check CORS headers
curl -i https://api.alphaai.app/api/v1/
```

### Database connection errors

```bash
# 1. Test Supabase connection
psql "postgresql://..." -c "SELECT 1;"

# 2. Verify schema exists
psql "postgresql://..." -c "\dt public.*"

# 3. Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
```

### Performance issues

```bash
# 1. Check cache hit rates
# Monitor backend logs for cache hits

# 2. Increase cache TTL (backend/.env)
CACHE_TTL_PRICES=60  # Was 30

# 3. Enable Redis (advanced)
# Replace cachetools with redis client
pip install redis
```

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set in deployment platform
- [ ] Database schema migrated (supabase/tables.sql executed)
- [ ] Frontend API URL points to production backend
- [ ] Backend logs configured (check LOG_LEVEL)
- [ ] SSL certificate installed (auto on Render/Railway/Vercel)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled on critical endpoints
- [ ] Database backups configured (Render/Railway handle this)
- [ ] Monitoring set up (logs, metrics, alerts)
- [ ] Custom domain configured (optional)

---

## 🎉 Success Indicators

✅ Frontend loads without errors  
✅ Backend API responds to requests  
✅ Real-time stock data populates  
✅ Portfolio endpoints working  
✅ Urdu translations loading  
✅ Technical indicators calculating  
✅ No CORS errors in browser console  
✅ Response times < 1s  

---

**Last Updated:** May 16, 2026  
**Questions?** See [SETUP.md](SETUP.md) or [README.md](README.md)
