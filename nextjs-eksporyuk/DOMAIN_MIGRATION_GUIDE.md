# 🌐 Panduan Migrasi Domain: eksporyuk.com → eksporyuk.com

**Tanggal**: 22 Desember 2025  
**Domain Lama**: `eksporyuk.com`  
**Domain Baru**: `eksporyuk.com`

---

## 📋 Checklist Perubahan

### 1️⃣ **Environment Variables**

#### File yang Perlu Diubah:

**A. `.env.local` (Development)**
```bash
# Ubah dari:
NEXTAUTH_URL=https://eksporyuk.com

# Menjadi:
NEXTAUTH_URL=https://eksporyuk.com
```

**B. Vercel Environment Variables (Production)**

Akses: https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/environment-variables

Variables yang perlu diubah:
- ✅ `NEXTAUTH_URL` → `https://eksporyuk.com`
- ✅ `NEXT_PUBLIC_APP_URL` → `https://eksporyuk.com` (jika ada)

---

### 2️⃣ **Vercel Domain Settings**

#### Langkah-langkah:

1. **Buka Vercel Dashboard**
   - https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/domains

2. **Tambah Domain Baru**
   - Klik "Add Domain"
   - Input: `eksporyuk.com`
   - Klik "Add"

3. **Konfigurasi DNS**
   
   Anda akan mendapat instruksi untuk update DNS records:
   
   **Option A - Nameservers (Recommended)**:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
   
   **Option B - A Record**:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   **Option C - CNAME Record**:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

4. **Set sebagai Primary Domain**
   - Setelah domain verified
   - Klik menu (⋮) di samping `eksporyuk.com`
   - Pilih "Set as Primary Domain"

5. **Optional: Redirect dari subdomain lama**
   - Tambahkan `eksporyuk.com` sebagai redirect domain
   - Akan otomatis redirect ke `eksporyuk.com`

---

### 3️⃣ **Code Changes**

#### File-file yang Perlu Dicek/Update:

**A. NextAuth Configuration**
```typescript
// File: src/lib/auth-options.ts
// Pastikan baseUrl sudah menggunakan env variable

const baseUrl = process.env.NEXTAUTH_URL || 'https://eksporyuk.com';
```

**B. Middleware (jika ada hardcoded URL)**
```typescript
// File: src/middleware.ts
// Cek tidak ada hardcoded domain
```

**C. API Routes**
```typescript
// Cari semua file yang mungkin punya hardcoded URL:
// - Callback URLs
// - Redirect URLs
// - Email links
```

**D. Email Templates**
```typescript
// File: prisma/seed-email-templates.js atau similar
// Update semua link di email template dari eksporyuk.com → eksporyuk.com
```

---

### 4️⃣ **Database Updates**

#### Update Email Templates di Database

```javascript
// Script: update-domain-in-templates.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDomainInTemplates() {
  // Update Email Templates
  const emailTemplates = await prisma.emailTemplate.updateMany({
    where: {
      content: { contains: 'eksporyuk.com' }
    },
    data: {
      content: { 
        // Will need custom update per template
      }
    }
  });

  // Update Notification Templates
  const notifTemplates = await prisma.notificationTemplate.updateMany({
    where: {
      content: { contains: 'eksporyuk.com' }
    },
    data: {
      content: {
        // Will need custom update per template
      }
    }
  });

  console.log('Updated templates:', emailTemplates.count + notifTemplates.count);
}
```

---

### 5️⃣ **Third-Party Integrations**

#### Services yang Perlu Update:

**A. Google OAuth (jika digunakan)**
- Google Cloud Console: https://console.cloud.google.com
- Authorized JavaScript origins: `https://eksporyuk.com`
- Authorized redirect URIs: `https://eksporyuk.com/api/auth/callback/google`

**B. Xendit Payment Gateway**
- Update webhook URL: `https://eksporyuk.com/api/webhooks/xendit`
- Update callback URL

**C. Mailketing / Email Service**
- Update semua link di email templates

**D. WhatsApp Integration (Starsender)**
- Update callback URLs jika ada

**E. Pusher (Real-time)**
- Update authorized domains

**F. OneSignal (Push Notifications)**
- Update site settings dengan domain baru

---

### 6️⃣ **SEO & Analytics**

**A. Google Search Console**
- Tambah property baru: `eksporyuk.com`
- Submit sitemap: `https://eksporyuk.com/sitemap.xml`

**B. Google Analytics**
- Update property settings dengan domain baru

**C. Meta Tags**
```typescript
// Update di layout.tsx atau metadata config
export const metadata = {
  metadataBase: new URL('https://eksporyuk.com'),
  // ...
}
```

---

### 7️⃣ **Testing Checklist**

Setelah migrasi, test:

- [ ] Homepage loads: `https://eksporyuk.com`
- [ ] Login works: `https://eksporyuk.com/auth/login`
- [ ] Register works: `https://eksporyuk.com/auth/register`
- [ ] Dashboard loads: `https://eksporyuk.com/dashboard`
- [ ] Admin panel: `https://eksporyuk.com/admin`
- [ ] Payment checkout flow
- [ ] Email links (forgot password, verification, etc)
- [ ] Affiliate short links
- [ ] API endpoints
- [ ] Webhook callbacks (Xendit)
- [ ] OAuth login (Google)
- [ ] Real-time features (Pusher)
- [ ] Push notifications (OneSignal)

---

## 🚀 Deployment Steps

### Step-by-Step Execution:

```bash
# 1. Update environment variables di local
# Edit .env.local:
NEXTAUTH_URL=https://eksporyuk.com

# 2. Update di codebase (jika ada hardcoded)
# Cari dan replace semua hardcoded domain

# 3. Commit changes
git add .
git commit -m "chore: update domain to eksporyuk.com"
git push origin main

# 4. Update Vercel Environment Variables
# Via Vercel Dashboard atau CLI:
vercel env add NEXTAUTH_URL production
# Enter: https://eksporyuk.com

# 5. Tambah domain di Vercel
# Via Vercel Dashboard: Settings → Domains → Add eksporyuk.com

# 6. Update DNS di registrar domain
# Arahkan ke Vercel nameservers atau A record

# 7. Deploy
vercel --prod

# 8. Verify domain
# Tunggu DNS propagation (bisa 5 menit - 48 jam)

# 9. Set sebagai primary domain di Vercel

# 10. Test semua functionality
```

---

## ⚠️ Important Notes

### DNS Propagation
- Perubahan DNS bisa memakan waktu 5 menit hingga 48 jam
- Gunakan tools untuk cek: https://dnschecker.org
- Selama propagasi, beberapa user mungkin masih akses domain lama

### SSL Certificate
- Vercel akan otomatis provision SSL certificate
- Biasanya selesai dalam 5-10 menit setelah domain verified

### Backward Compatibility
- **PENTING**: Jangan hapus `eksporyuk.com` dari Vercel
- Set sebagai redirect ke `eksporyuk.com`
- Ini memastikan link lama tetap bekerja

### Session Management
- User yang sedang login mungkin perlu login ulang
- Cookie domain berubah dari `.eksporyuk.com` ke `.eksporyuk.com`

---

## 🔧 Quick Commands

### Update Domain di Semua Template Files

```bash
# Di folder nextjs-eksporyuk
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Search semua file dengan domain lama
grep -r "eksporyuk.com" .

# Replace di semua file (MacOS)
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | \
  xargs sed -i '' 's/app\.eksporyuk\.com/eksporyuk.com/g'

# Atau manual per file untuk lebih aman
```

### Update Database Templates

```bash
# Buat script update-domain-templates.js
node update-domain-templates.js
```

---

## 📞 Support Contacts

Jika ada masalah:

**DNS Issues**
- Provider domain Anda (GoDaddy, Namecheap, Cloudflare, etc)

**Vercel Issues**
- Vercel Support: https://vercel.com/support

**SSL Certificate Issues**
- Tunggu 10-15 menit setelah domain verified
- Clear browser cache dan coba incognito mode

---

## ✅ Post-Migration Checklist

Setelah migrasi selesai:

- [ ] Update documentation (README.md)
- [ ] Inform users via email/notification
- [ ] Monitor error logs untuk 24-48 jam
- [ ] Update marketing materials dengan domain baru
- [ ] Update social media links
- [ ] Update business cards / printed materials

---

**Status**: Ready to Execute  
**Estimated Time**: 2-4 hours (termasuk DNS propagation)  
**Risk Level**: Medium (perlu testing menyeluruh)
