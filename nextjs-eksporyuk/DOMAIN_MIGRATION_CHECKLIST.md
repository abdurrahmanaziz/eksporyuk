# ✅ Quick Checklist: Migrasi Domain eksporyuk.com

## 📋 Pre-Migration (Lakukan Sebelum Migrasi)

- [ ] **Backup database** (export dari Neon atau Vercel Postgres)
- [ ] **Backup .env files** 
- [ ] **Commit semua changes** yang belum di-commit

## 🚀 Langkah Migrasi (Urut dari atas)

### 1. Update Code & Config

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# A. Update semua hardcoded domain di code
bash update-domain-in-code.sh

# B. Update .env.local manually
# Ubah NEXTAUTH_URL=https://eksporyuk.com

# C. Review changes
git diff

# D. Test build locally
npm run build
```

### 2. Update Database Templates

```bash
# Update semua template di database
node update-domain-templates.js
```

### 3. Commit & Push

```bash
git add .
git commit -m "chore: migrate domain to eksporyuk.com"
git push origin main
```

### 4. Vercel Configuration

#### A. Add Domain
1. Buka https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/domains
2. Click "Add Domain"
3. Input: `eksporyuk.com`
4. Click "Add"

#### B. Configure DNS
**Di Domain Registrar Anda** (GoDaddy/Namecheap/Cloudflare):

**Option 1 - A Record (Recommended):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**Option 2 - CNAME:**
```
Type: CNAME  
Name: @
Value: cname.vercel-dns.com
TTL: Auto
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

#### C. Update Environment Variables
1. Buka https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/environment-variables
2. Edit `NEXTAUTH_URL`:
   - Production: `https://eksporyuk.com`
   - Preview: `https://eksporyuk.com`
   - Development: `https://eksporyuk.com`

#### D. Deploy
```bash
vercel --prod
```

#### E. Set as Primary Domain
1. Tunggu domain verified (hijau di dashboard)
2. Click menu (⋮) di samping `eksporyuk.com`
3. Pilih "Set as Primary Domain"

#### F. Setup Redirect (Opsional tapi Recommended)
1. Keep `eksporyuk.com` di domain list
2. Akan otomatis redirect ke `eksporyuk.com`

### 5. Third-Party Services Update

#### A. Google OAuth (jika aktif)
- [ ] https://console.cloud.google.com
- [ ] Update Authorized JavaScript origins: `https://eksporyuk.com`
- [ ] Update Authorized redirect URIs: `https://eksporyuk.com/api/auth/callback/google`

#### B. Xendit
- [ ] Login ke Xendit Dashboard
- [ ] Update Webhook URL: `https://eksporyuk.com/api/webhooks/xendit`

#### C. WhatsApp / Starsender
- [ ] Update callback URLs (jika ada)

#### D. Email Service (Mailketing)
- [ ] Update base URL untuk links di email

### 6. Testing (WAJIB!)

```bash
# Test checklist:
# ✅ Homepage
curl -I https://eksporyuk.com

# ✅ Login page
curl -I https://eksporyuk.com/auth/login

# ✅ API health
curl https://eksporyuk.com/api/health

# Test di browser:
```

- [ ] https://eksporyuk.com - Homepage loads
- [ ] https://eksporyuk.com/auth/login - Login works
- [ ] https://eksporyuk.com/auth/register - Register works
- [ ] https://eksporyuk.com/dashboard - Dashboard loads
- [ ] https://eksporyuk.com/admin - Admin panel works
- [ ] Test checkout flow (buat order)
- [ ] Test forgot password email
- [ ] Test affiliate short links
- [ ] Test webhook (Xendit payment)

### 7. Monitoring (24 jam pertama)

```bash
# Check Vercel logs
vercel logs https://eksporyuk.com --follow

# Check for errors
vercel logs https://eksporyuk.com | grep ERROR
```

## 📞 Troubleshooting

### DNS Not Propagating?
```bash
# Check DNS status
dig eksporyuk.com
nslookup eksporyuk.com

# Online tool
# https://dnschecker.org
```

### SSL Certificate Issue?
- Tunggu 10-15 menit setelah domain verified
- Clear browser cache
- Try incognito/private mode

### Redirect Loop?
- Check NEXTAUTH_URL di environment variables
- Pastikan tidak ada double slash di URL
- Clear cookies di browser

### Old Domain Still Loading?
- DNS propagation bisa 5 menit - 48 jam
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)
- Use different network (mobile data) untuk test

## 🎯 Post-Migration Tasks

- [ ] Inform users via email/notification (opsional)
- [ ] Update social media profiles
- [ ] Update Google Search Console (add new property)
- [ ] Update Google Analytics
- [ ] Monitor error rates for 24-48 jam

## ⏱️ Estimated Timeline

- **Code changes**: 30 menit
- **DNS configuration**: 10 menit
- **DNS propagation**: 5 menit - 48 jam (biasanya < 1 jam)
- **Testing**: 1 jam
- **Total**: 2-4 jam

## 💡 Tips

1. **Lakukan di waktu low traffic** (malam hari)
2. **Jangan delete eksporyuk.com** - set sebagai redirect
3. **Monitor logs** setelah migrasi
4. **Prepare rollback plan** (jika ada masalah besar)

---

**Ready to execute?** Start dari step 1!
