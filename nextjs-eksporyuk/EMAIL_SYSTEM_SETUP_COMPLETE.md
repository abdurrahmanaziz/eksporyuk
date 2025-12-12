# Email System Setup - READY FOR CONFIGURATION ✅

## 🎯 Status: All Code Fixed, Need API Key Configuration

**Update**: 12 Desember 2025

### ✅ Yang Sudah Selesai

1. **Code Fixed** - Mailketing API integration sudah menggunakan format yang benar
2. **Templates Created** - 2 email templates branded sudah dibuat
3. **Database Ready** - IntegrationConfig table sudah siap
4. **Admin Panel Ready** - Halaman `/admin/integrations` sudah ada dan berfungsi

### ⚠️ Yang Masih Perlu Dilakukan

**HANYA 1 LANGKAH**: Masukkan **MAILKETING_API_KEY** via Admin Panel

## 📋 Cara Setup (2 Menit)

### Opsi 1: Via Admin Panel (Recommended) 👍

```bash
# 1. Jalankan dev server
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
npm run dev

# 2. Buka browser
http://localhost:3000/admin/integrations

# 3. Klik card "Mailketing"
# 4. Masukkan API Key dari Mailketing.co.id
# 5. Klik "Save Configuration"
# 6. Test forgot password
```

### Opsi 2: Via Database Script

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Run script interaktif
node setup-mailketing-integration-with-key.js
# Script akan tanya API key, paste dan enter

# Atau direct insert (ganti YOUR_KEY)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.integrationConfig.upsert({
    where: { service: 'mailketing' },
    create: {
      service: 'mailketing',
      config: {
        MAILKETING_API_KEY: 'YOUR_KEY_HERE',
        MAILKETING_SENDER_EMAIL: 'noreply@eksporyuk.com',
        MAILKETING_SENDER_NAME: 'EksporYuk'
      },
      isActive: true
    },
    update: {
      config: {
        MAILKETING_API_KEY: 'YOUR_KEY_HERE',
        MAILKETING_SENDER_EMAIL: 'noreply@eksporyuk.com',
        MAILKETING_SENDER_NAME: 'EksporYuk'
      }
    }
  });
  console.log('✅ Done');
  await prisma.\$disconnect();
})();
"
```

## 🧪 Testing Setelah Setup

```bash
# 1. Check konfigurasi
node populate-mailketing-integration.js
# Output akan show apakah API key sudah diset

# 2. Test forgot password system
node test-forgot-password.js

# 3. Manual test via browser
# - Buka: http://localhost:3000/forgot-password
# - Masukkan email admin
# - Cek inbox email
```

## 📊 System Architecture

### Flow Forgot Password

```
User submits email
  ↓
/api/auth/forgot-password-v2
  ↓
Generate token → Save to PasswordResetToken table
  ↓
mailketingService.sendPasswordResetEmail()
  ↓
sendEmailWithFallback() helper
  ↓
integrations/mailketing.ts → loadConfig()
  ↓
IntegrationConfig table (service='mailketing')
  ↓
Mailketing API: POST /send (form-urlencoded)
  ↓
Email sent ✅
```

### Configuration Priority

1. **IntegrationConfig table** (Primary) ← Admin panel saves here
2. **Environment variables** (Fallback) ← `.env` file
3. **Dev mode** (If no config) ← Simulation only

### Tables Used

- `IntegrationConfig` - Stores API keys per service
- `PasswordResetToken` - Stores reset tokens (1hr expiry)
- `BrandedTemplate` - Email template HTML
- `Setting` - General app settings (logo, footer, etc)

## 📁 Files Modified/Created

### Modified (Bug Fixes)
- `/src/lib/services/mailketingService.ts` (3 functions fixed)
  - `sendPasswordResetEmail()`
  - `sendEmail()`
  - `sendPasswordResetConfirmationEmail()`

### Created (New Features)
- `EMAIL_SYSTEM_SETUP_COMPLETE.md` (This file)
- `MAILKETING_EMAIL_FIX_COMPLETE.md` (Technical docs)
- `populate-mailketing-integration.js` (Setup script)
- `test-forgot-password.js` (Testing script)
- `check-mailketing-setup.js` (Diagnostic script)
- `add-reset-password-template.js` (Template seeder)
- `add-reset-confirmation-template.js` (Template seeder)

### Existing (Already Working)
- `/src/lib/integrations/mailketing.ts` ✅
- `/src/lib/email-template-helper.ts` ✅
- `/src/lib/integration-config.ts` ✅
- `/src/app/(dashboard)/admin/integrations/page.tsx` ✅
- `/src/app/api/admin/integrations/route.ts` ✅

## 🔑 API Key Requirements

**Mailketing API** (Required for email):
- Sign up: https://mailketing.co.id
- Get API key from dashboard
- Format: Usually starts with `mk_` or long alphanumeric

**Optional Integrations** (Can configure later):
- Xendit (Payment gateway)
- StarSender (WhatsApp)
- OneSignal (Push notifications)
- Pusher (Real-time)
- Google OAuth (Social login)
- Giphy (GIF search)

## 💡 Troubleshooting

### Email Tidak Terkirim?

```bash
# 1. Check konfigurasi
node populate-mailketing-integration.js

# 2. Check output:
#    ✅ MAILKETING_API_KEY is configured → Good!
#    ⚠️  MAILKETING_API_KEY is empty! → Need to add API key

# 3. If empty, visit admin panel to add key
```

### Admin Panel Tidak Bisa Save?

```bash
# Check console logs saat save
# Biasanya validation error atau network issue

# Manual check database:
npx prisma studio
# Buka table IntegrationConfig
# Cek record dengan service='mailketing'
```

### Template Tidak Muncul?

```bash
# Re-run template seeders
node add-reset-password-template.js
node add-reset-confirmation-template.js

# Check database:
npx prisma studio
# Table: BrandedTemplate
# Slug: reset-password, password-reset-confirmation
```

## 🚀 Production Deployment

### Before Deploy:

```bash
# 1. Add API key to production IntegrationConfig
# 2. Set correct email addresses:
#    - MAILKETING_SENDER_EMAIL
#    - MAILKETING_REPLY_TO_EMAIL
# 3. Test forgot password on staging first
# 4. Monitor logs for email delivery status
```

### Environment Variables (Optional Fallback):

```env
# .env (production)
MAILKETING_API_KEY="your-production-key"
MAILKETING_SENDER_EMAIL="noreply@eksporyuk.com"
MAILKETING_SENDER_NAME="EksporYuk"
```

**Note**: Admin panel config takes priority over env vars.

## 📞 Support

**If forgot password still not working after API key setup:**

1. Check server console logs for errors
2. Run: `node check-mailketing-setup.js` (comprehensive diagnosis)
3. Test API directly: Visit `/api/admin/integrations/test` with Mailketing selected
4. Check Mailketing dashboard for delivery logs

## ✨ Summary

**Status**: ✅ System READY  
**Blocker**: ⚠️ MAILKETING_API_KEY not configured  
**Action**: 🎯 Add API key via Admin Panel  
**Time**: ⏱️ 2 minutes  
**Priority**: 🔴 HIGH (Forgot password is security feature)

---

**Next Steps**:
1. Get Mailketing API key from https://mailketing.co.id
2. Visit http://localhost:3000/admin/integrations
3. Configure Mailketing with API key
4. Test forgot password feature
5. Deploy to production

🎉 Setelah API key diset, forgot password akan langsung berfungsi!
