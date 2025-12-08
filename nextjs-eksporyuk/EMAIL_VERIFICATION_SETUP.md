# Email Verification Setup Guide

## ✅ Perbaikan yang Telah Dilakukan

### 1. **Database Schema Fix**
- Memperbaiki mapping field di `EmailVerificationToken`:
  - `userId` → `identifier` (sesuai schema Prisma)
  - `expiresAt` → `expires` (sesuai schema Prisma)
  - Menghapus relasi langsung ke `user` (fetch manual)
  - Menambahkan `type: 'EMAIL_VERIFY'` dan `metadata` untuk email

### 2. **Mailketing Integration**
- Menggunakan API Mailketing untuk kirim email verifikasi
- Format email HTML yang menarik dengan tombol CTA
- Fallback ke console log jika Mailketing tidak dikonfigurasi
- Error handling yang robust

### 3. **Better Logging**
- Logging detail di setiap step verifikasi
- Stack trace untuk debugging error
- Informasi konfigurasi (API key status, URL, etc)

---

## 🔧 Environment Variables Required

Pastikan file `.env.local` memiliki variabel berikut:

```bash
# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Base URL
APP_URL="http://localhost:3000"

# Mailketing (Email Service)
MAILKETING_API_KEY="your-mailketing-api-key"
MAILKETING_FROM_EMAIL="noreply@eksporyuk.com"
MAILKETING_FROM_NAME="EksporYuk"
```

---

## 🧪 Testing Email Verification

### 1. **Test Endpoint**
Buka browser dan akses:
```
http://localhost:3000/api/test/email-verification?email=test@gmail.com&name=Test User
```

Response akan menunjukkan:
- ✅ Apakah Mailketing dikonfigurasi
- ✅ Status pengiriman email
- ✅ Environment variables yang terdeteksi
- ✅ Dev mode atau production mode

### 2. **Manual Testing Flow**

**A. Register User Baru:**
```bash
# Via API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@gmail.com",
    "password": "Password123!",
    "whatsapp": "628123456789"
  }'
```

**B. Cek Console Log:**
```
📧 Preparing verification email...
   Email: test@gmail.com
   Name: Test User
   URL: http://localhost:3000/auth/verify-email?token=abc123...
   Mailketing configured: true/false

✅ Verification email sent via Mailketing
```

**C. Cek Email di Gmail** (jika Mailketing configured):
- Buka inbox Gmail
- Cari email dari "EksporYuk"
- Klik tombol "Verifikasi Email"

**D. Atau Copy URL dari Console** (dev mode):
```
=== EMAIL VERIFIKASI (FALLBACK) ===
To: test@gmail.com
Name: Test User
Verification URL: http://localhost:3000/auth/verify-email?token=abc123...
===================================
```
Copy URL tersebut dan paste di browser.

**E. Halaman Verifikasi:**
- Akan muncul loading spinner
- Jika berhasil: ✅ "Email Terverifikasi!"
- Jika gagal: ❌ Error message
- Auto redirect ke dashboard dalam 3 detik

---

## 🔍 Debugging

### Cek Token di Database:
```sql
SELECT * FROM EmailVerificationToken 
WHERE identifier = 'user-id-here' 
ORDER BY createdAt DESC;
```

### Cek User Email Verification:
```sql
SELECT id, email, emailVerified, createdAt 
FROM User 
WHERE email = 'test@gmail.com';
```

### Log File Locations:
- **Registration:** `/api/auth/register/route.ts`
- **Verification:** `/api/auth/verify-email/route.ts`
- **Resend:** `/api/auth/resend-verification/route.ts`
- **Email Service:** `/lib/email-verification.ts`
- **Mailketing:** `/lib/integrations/mailketing.ts`

---

## 🚀 Production Checklist

- [ ] Set valid `MAILKETING_API_KEY` dari dashboard Mailketing
- [ ] Set `NEXTAUTH_URL` ke production URL (e.g., https://eksporyuk.com)
- [ ] Set `APP_URL` ke production URL
- [ ] Set `MAILKETING_FROM_EMAIL` ke email domain yang valid
- [ ] Test email delivery di production
- [ ] Cek spam folder jika email tidak masuk inbox
- [ ] Setup SPF/DKIM records untuk domain email

---

## ⚠️ Known Issues & Solutions

### Issue 1: "Token tidak valid"
**Penyebab:** Token sudah expired (> 24 jam) atau sudah digunakan
**Solusi:** Klik "Kirim Ulang Email Verifikasi" di dashboard

### Issue 2: "Email tidak diterima"
**Penyebab:** 
- Mailketing API key tidak valid
- Email masuk spam folder
- SMTP timeout

**Solusi:**
1. Cek console log apakah email terkirim
2. Cek spam/promotions folder di Gmail
3. Test dengan `/api/test/email-verification`
4. Verify Mailketing API key di dashboard mereka

### Issue 3: "Prisma Error - field not found"
**Penyebab:** Schema mismatch antara code dan database
**Solusi:** 
```bash
npx prisma generate
npx prisma db push
```

---

## 📞 Support

Jika ada masalah:
1. Cek console log browser (F12)
2. Cek terminal log server
3. Test dengan endpoint `/api/test/email-verification`
4. Verifikasi environment variables
5. Cek database untuk token yang dibuat

---

## 🎯 Next Steps

- [ ] Implement email templates yang lebih menarik
- [ ] Add retry mechanism jika email gagal terkirim
- [ ] Track email open rate via Mailketing
- [ ] Add email verification reminder (after 24h)
- [ ] Implement "verified badge" di profile
