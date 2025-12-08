# 🔐 PRODUCTION ENVIRONMENT SETUP GUIDE

**Status:** ✅ Ready for Configuration  
**Created:** November 25, 2025

---

## 📋 QUICK START

### 1. Generate Secrets (WAJIB!)

Jalankan di PowerShell:

```powershell
# Generate NEXTAUTH_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate CRON_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Atau gunakan online: https://generate-secret.vercel.app/32

---

## 🗄️ DATABASE OPTIONS

### Option 1: Vercel Postgres (Recommended)

**Pros:** Auto-scaling, zero config, terintegrasi dengan Vercel  
**Pricing:** $0.25/GB storage + $0.12/GB transfer

```bash
# Install Vercel CLI
npm i -g vercel

# Login & create database
vercel login
vercel postgres create

# Copy connection string dari output
```

**Format:**
```
DATABASE_URL="postgres://default:abc123@ep-xyz.region.vercel-storage.com:5432/verceldb?sslmode=require"
```

### Option 2: PlanetScale (MySQL)

**Pros:** Serverless MySQL, branching, 5GB free  
**Pricing:** Free tier available

1. Daftar: https://planetscale.com/
2. Create database: `eksporyuk-production`
3. Copy connection string dari dashboard

**Format:**
```
DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/eksporyuk?ssl={"rejectUnauthorized":true}"
```

### Option 3: Railway (MySQL/PostgreSQL)

**Pros:** Simple setup, $5/month  
**Pricing:** Pay as you go, ~$5-10/month

1. Daftar: https://railway.app/
2. New Project → Deploy MySQL/PostgreSQL
3. Copy connection string

---

## 💳 XENDIT SETUP (CRITICAL!)

### 1. Login ke Dashboard

https://dashboard.xendit.co/

### 2. Aktivasi LIVE Mode

1. Lengkapi verifikasi bisnis
2. Submit dokumen (KTP, NPWP, Akta)
3. Tunggu approval (1-3 hari kerja)

### 3. Dapatkan API Keys

Navigate: **Settings → Developers → API Keys**

**Yang dibutuhkan:**
- ✅ **Public API Key** → `XENDIT_API_KEY`
- ✅ **Secret Key** → `XENDIT_SECRET_KEY`
- ✅ **Webhook Verification Token** → `XENDIT_WEBHOOK_TOKEN`

⚠️ **PENTING:** Pastikan menggunakan **LIVE keys**, bukan TEST keys!

### 4. Setup Webhook URL

Navigate: **Settings → Webhooks**

**Add webhook URL:**
```
https://eksporyuk.com/api/webhooks/xendit
```

**Events yang harus diaktifkan:**
- ✅ Invoice paid
- ✅ Invoice expired
- ✅ Virtual account paid
- ✅ E-wallet payment success

---

## 🌐 DOMAIN SETUP

### 1. Purchase Domain

Beli domain `eksporyuk.com` di:
- Niagahoster (recommended)
- Cloudflare
- Namecheap

### 2. Configure DNS (Untuk Vercel)

Di DNS provider, tambahkan records:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Short Link (Optional):**
```
Type: CNAME
Name: link
Value: cname.vercel-dns.com
TTL: Auto
```

### 3. Vercel Domain Configuration

```bash
# Add domain to Vercel project
vercel domains add eksporyuk.com
vercel domains add www.eksporyuk.com
vercel domains add link.eksporyuk.com
```

SSL certificate akan auto-generate dalam 24 jam.

---

## 📝 ENVIRONMENT VARIABLES CHECKLIST

### CRITICAL (Harus diisi):
- [ ] `DATABASE_URL` - Connection string database production
- [ ] `NEXTAUTH_URL` - https://eksporyuk.com
- [ ] `NEXTAUTH_SECRET` - Random 32 chars (generated)
- [ ] `XENDIT_API_KEY` - Live API key dari Xendit
- [ ] `XENDIT_SECRET_KEY` - Live secret key dari Xendit
- [ ] `XENDIT_WEBHOOK_TOKEN` - Webhook verification token
- [ ] `APP_URL` - https://eksporyuk.com
- [ ] `CRON_SECRET` - Random 32 chars (generated)

### OPTIONAL (Phase 1 bisa kosong):
- [ ] `MAILKETING_API_KEY` - Email marketing
- [ ] `STARSENDER_API_KEY` - WhatsApp automation
- [ ] `ONESIGNAL_APP_ID` - Push notifications
- [ ] `PUSHER_APP_ID` - Real-time features
- [ ] `ZOOM_API_KEY` - Video conferencing
- [ ] `GOOGLE_CLIENT_ID` - OAuth login

---

## 🚀 DEPLOYMENT STEPS

### Method 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
cd nextjs-eksporyuk
vercel link

# 4. Add environment variables
vercel env add NEXTAUTH_SECRET production
# (paste generated secret)

vercel env add NEXTAUTH_URL production
# (paste: https://eksporyuk.com)

vercel env add DATABASE_URL production
# (paste database connection string)

vercel env add XENDIT_API_KEY production
# (paste Xendit API key)

# ... tambahkan semua required env vars

# 5. Deploy to production
vercel --prod
```

### Method 2: Manual via Vercel Dashboard

1. Login: https://vercel.com/dashboard
2. Import project dari GitHub
3. Settings → Environment Variables
4. Add semua variables dari `.env.production.template`
5. Deploy

---

## 🗃️ DATABASE MIGRATION

Setelah deploy, jalankan migration:

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke production database
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

Atau via Vercel CLI:

```bash
vercel env pull .env.production
npx prisma db push
```

---

## ✅ POST-DEPLOYMENT TESTING

### 1. Basic Tests

- [ ] Website accessible di https://eksporyuk.com
- [ ] SSL certificate active (hijau di browser)
- [ ] Homepage loading dengan benar
- [ ] Login page accessible

### 2. Authentication Tests

- [ ] Register user baru
- [ ] Email verification working
- [ ] Login dengan credentials
- [ ] Login dengan Google (jika diaktifkan)
- [ ] Logout working

### 3. Payment Tests

**TEST MODE (First):**
```bash
# Gunakan Xendit TEST keys dulu
vercel env add XENDIT_API_KEY production
# (paste TEST key)
```

- [ ] Buka halaman membership purchase
- [ ] Pilih paket (PRO/LIFETIME/6_MONTHS)
- [ ] Checkout working
- [ ] Virtual Account number generated
- [ ] Payment page showing correctly

**LIVE MODE (After test success):**
```bash
# Ganti ke LIVE keys
vercel env add XENDIT_API_KEY production
# (paste LIVE key)

# Redeploy
vercel --prod
```

- [ ] Test dengan nominal kecil (Rp 1.000)
- [ ] Virtual Account created
- [ ] Payment notification received
- [ ] Membership auto-activated
- [ ] Email notification sent (jika diaktifkan)

### 4. Membership Tests

- [ ] Membership status showing correctly
- [ ] Tier benefits accessible
- [ ] Group access based on tier
- [ ] Course enrollment working
- [ ] Certificate generation

### 5. Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://eksporyuk.com --view

# Target scores:
# Performance: >90
# Accessibility: >90
# Best Practices: >90
# SEO: >90
```

---

## 🔍 MONITORING SETUP

### 1. Vercel Analytics (Built-in)

Aktifkan di dashboard Vercel:
- Settings → Analytics → Enable

### 2. Error Tracking (Optional)

**Sentry Setup:**
```bash
npm install @sentry/nextjs

npx @sentry/wizard@latest -i nextjs
```

Add to `next.config.js`:
```js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // existing config
  },
  {
    silent: true,
  }
);
```

### 3. Uptime Monitoring (Free)

**UptimeRobot:**
1. Daftar: https://uptimerobot.com/
2. Add monitor: https://eksporyuk.com
3. Set interval: 5 minutes
4. Add alert contacts (email)

---

## 🔐 SECURITY CHECKLIST

- [ ] Semua secrets unique (tidak pakai default)
- [ ] HTTPS aktif (SSL certificate)
- [ ] Environment variables tidak di-commit ke Git
- [ ] `.env.production` ada di `.gitignore`
- [ ] Xendit webhook verification active
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (upcoming)
- [ ] Database backups automated

---

## 📊 SUCCESS METRICS

**Phase 1 Deployment SUKSES jika:**

1. ✅ Website accessible & fast (<3s load time)
2. ✅ SSL certificate active
3. ✅ User registration working
4. ✅ Payment flow tested (test + live)
5. ✅ Membership activation automatic
6. ✅ Zero critical errors dalam 24 jam
7. ✅ Monitoring active
8. ✅ Backup system running

---

## 🆘 TROUBLESHOOTING

### Database Connection Error

```
Error: Can't reach database server at ...
```

**Solution:**
- Check DATABASE_URL format
- Verify database is running
- Check firewall rules (whitelist Vercel IPs)

### Xendit Webhook Not Working

```
Payment received but membership not activated
```

**Solution:**
- Check webhook URL: https://eksporyuk.com/api/webhooks/xendit
- Verify XENDIT_WEBHOOK_TOKEN matches dashboard
- Check webhook logs di Xendit dashboard
- Test webhook: `POST /api/webhooks/xendit` dengan Postman

### Build Error on Vercel

```
Error: Module not found
```

**Solution:**
```bash
# Clear cache & redeploy
vercel --force

# Or rebuild locally
rm -rf .next node_modules
npm install
npm run build
```

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Vercel Support: https://vercel.com/support
- Xendit Support: support@xendit.co
- Database Issues: Check provider documentation

**Internal:**
- Developer: [Your contact]
- Product Owner: [Contact]

---

**Last Updated:** November 25, 2025  
**Version:** Phase 1 Production  
**Status:** ✅ Ready for Deployment
