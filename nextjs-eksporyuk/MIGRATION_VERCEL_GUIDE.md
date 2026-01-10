# 🚀 Migration Guide: VPS → Vercel + Neon

## Timeline & Strategy

### FASE 1: Emergency Fix (HARI INI)
**Tujuan:** Restore server VPS, prevent future crashes

1. ✅ Restart VPS via IDCloudHost panel
2. ✅ Setup health monitoring
3. ✅ Backup database ke Neon

### FASE 2: Parallel Deployment (MINGGU INI)
**Tujuan:** Deploy ke Vercel tanpa ganggu production

1. ✅ Deploy staging ke Vercel
2. ✅ Setup Neon dengan pooled connection
3. ✅ Testing & performance comparison

### FASE 3: Traffic Split (2 MINGGU)
**Tujuan:** Gradual migration dengan monitoring

1. ✅ 20% traffic → Vercel
2. ✅ Monitor performance & errors
3. ✅ Increase to 50% if stable

### FASE 4: Full Migration (1 BULAN)
**Tujuan:** 100% Vercel, shutdown VPS

---

## 📋 Setup Instructions

### Step 1: Vercel Account Setup (5 menit)

```bash
# 1. Sign up di https://vercel.com (pakai GitHub)
# 2. Install Vercel CLI
npm i -g vercel

# 3. Login
vercel login

# 4. Link project
cd nextjs-eksporyuk
vercel
```

Pilih:
- **Scope:** Your personal account
- **Link to existing project?** No
- **Project name:** eksporyuk
- **Directory:** `.` (current)
- **Override settings?** No

### Step 2: Environment Variables

Setelah project created, set env vars di dashboard:

```
https://vercel.com/[username]/eksporyuk/settings/environment-variables
```

**Variables needed:**
```bash
# Database (Neon Pooled)
DATABASE_URL=postgresql://...?pgbouncer=true&connect_timeout=15
DIRECT_URL=postgresql://... # untuk migrations

# NextAuth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://eksporyuk.vercel.app

# Xendit (from database IntegrationConfig)
# Tidak perlu di env, sudah di database

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Other integrations
# Tidak perlu, semua di database IntegrationConfig
```

### Step 3: Neon Database Setup (10 menit)

#### 3.1 Create Neon Project
```bash
# 1. Sign up https://console.neon.tech
# 2. Create new project: eksporyuk-production
# 3. Region: Singapore (ap-southeast-1)
```

#### 3.2 Get Connection Strings
```
Dashboard → Connection Details

✅ Pooled connection (for runtime):
postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?pgbouncer=true

✅ Direct connection (for migrations):
postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb
```

#### 3.3 Migrate Data from VPS

**Option A: Backup & Restore (RECOMMENDED)**
```bash
# Di VPS, dump database
ssh eksporyuk@157.10.253.103 'pg_dump -U eksporyuk_user eksporyuk' > backup.sql

# Restore ke Neon
psql "postgresql://user:pass@ep-xxx.neon.tech/neondb" < backup.sql
```

**Option B: Prisma Migrate**
```bash
# Push schema ke Neon
DATABASE_URL="postgresql://...neon.tech..." npx prisma db push

# Seed data jika perlu
npm run prisma:seed
```

### Step 4: GitHub Secrets (5 menit)

Add to repository secrets:
```
https://github.com/abdurrahmanaziz/eksporyuk/settings/secrets/actions
```

**Required secrets:**
```
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # From Vercel project settings
VERCEL_PROJECT_ID     # From Vercel project settings
```

**How to get:**
1. **VERCEL_TOKEN:**
   - https://vercel.com/account/tokens
   - Create → Scope: Full Account → Copy token

2. **VERCEL_ORG_ID & PROJECT_ID:**
   ```bash
   cd nextjs-eksporyuk
   vercel link
   cat .vercel/project.json
   ```

### Step 5: Deploy Staging (2 menit)

```bash
# Create staging branch
git checkout -b staging
git push origin staging

# GitHub Actions akan auto-deploy
# Check: https://github.com/abdurrahmanaziz/eksporyuk/actions
```

URL staging: `https://eksporyuk-git-staging-[username].vercel.app`

### Step 6: Test Staging (30 menit)

**Test checklist:**
- [ ] Homepage load < 1s
- [ ] Login/register works
- [ ] Admin dashboard accessible
- [ ] Affiliate features work
- [ ] Payment flow (use test mode)
- [ ] Email sending
- [ ] Database queries fast
- [ ] No 500 errors in logs

**Performance test:**
```bash
# Test 100 concurrent users
npx artillery quick --count 100 --num 10 https://eksporyuk-staging.vercel.app
```

### Step 7: Domain Setup (10 menit)

**Option A: Vercel Custom Domain**
```bash
# 1. Go to Vercel project settings → Domains
# 2. Add: staging.eksporyuk.com
# 3. Update DNS:
#    - Type: CNAME
#    - Name: staging
#    - Value: cname.vercel-dns.com
```

**Option B: Cloudflare Traffic Split**
```
Cloudflare → Load Balancing → Create Pool:
- 80% → VPS (157.10.253.103)
- 20% → Vercel (cname.vercel-dns.com)
```

---

## 🔥 Emergency Rollback Plan

Jika Vercel bermasalah:

### Rollback ke VPS (5 menit)
```bash
# 1. Update DNS
# Type: A
# Name: @
# Value: 157.10.253.103

# 2. Atau di Cloudflare:
# Load Balancing → 100% → VPS
```

### Restore Database dari Backup
```bash
# Jika Neon error, restore ke VPS
psql -U eksporyuk_user eksporyuk < backup.sql
```

---

## 📊 Monitoring Setup

### Vercel Analytics (Built-in)
```
Dashboard → Analytics
- Response times
- Error rates
- Geographic distribution
```

### Sentry Error Tracking
```bash
# Install
npm install @sentry/nextjs

# Setup
npx @sentry/wizard@latest -i nextjs
```

### PM2 Plus (for VPS during transition)
```bash
# Register https://pm2.io
pm2 link <secret> <public>
```

---

## 💰 Cost Comparison

### Current (VPS Only)
- VPS 16GB: $30/bulan
- **Total: $30/bulan**

### After Migration (Vercel + Neon)
- Vercel Free: $0/bulan (100GB bandwidth)
- Neon Free: $0/bulan (3GB storage)
- **Total: $0/bulan** 

### If High Traffic
- Vercel Pro: $20/bulan (1TB bandwidth)
- Neon Scale: $19/bulan (unlimited)
- **Total: $39/bulan**
- **Benefit:** Auto-scaling, zero downtime, no maintenance

---

## ✅ Success Criteria

### Staging Ready When:
- [ ] Response time < 500ms
- [ ] Zero 500 errors in 24h
- [ ] All features tested
- [ ] Database queries optimized

### Production Migration When:
- [ ] Staging stable for 1 week
- [ ] Traffic split tested (20% → 50%)
- [ ] Backup & rollback plan verified
- [ ] Team comfortable with Vercel

---

## 🆘 Support & Troubleshooting

### Common Issues

**1. Build fails on Vercel**
```bash
# Check build logs in Vercel dashboard
# Common fix: Update Node version in package.json
"engines": {
  "node": "20.x"
}
```

**2. Database connection timeout**
```bash
# Use pooled connection string
DATABASE_URL="...?pgbouncer=true&connect_timeout=15"
```

**3. Environment variables not loading**
```bash
# Force dynamic in API routes
export const dynamic = 'force-dynamic'
```

**4. CORS errors**
```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ]
}
```

---

## 📞 Next Steps

1. **Hari Ini:** Restart VPS via panel IDCloudHost
2. **Besok:** Setup Vercel & Neon (saya bantu)
3. **Minggu ini:** Deploy staging, test lengkap
4. **2 minggu:** Traffic split, monitoring
5. **1 bulan:** Full migration jika sukses

**Ready to start?** 🚀
