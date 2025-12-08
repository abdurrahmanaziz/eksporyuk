# 🔍 MAILKETING API - STATUS & DIAGNOSIS

## ❌ MASALAH DITEMUKAN

**API Key tidak valid atau expired**

```
Status: FAILED
Error: "Access Denied, Invalid Token"
```

---

## ✅ ENDPOINT YANG BENAR

Setelah testing, endpoint yang benar adalah:

```
URL: https://api.mailketing.co.id/api/v1/send
Method: POST
Auth Header: x-api-key
Content-Type: application/json
```

### Request Format:
```json
{
  "from": {
    "email": "noreply@eksporyuk.com",
    "name": "EksporYuk"
  },
  "to": "user@example.com",
  "subject": "Subject here",
  "html": "<html>...</html>"
}
```

---

## 🔑 SOLUSI - PERBARUI API KEY

### Langkah 1: Dapatkan API Key Baru

1. Login ke **Mailketing Dashboard**: https://mailketing.co.id/login
2. Buka menu **Settings** atau **API Keys**
3. Generate **New API Key** atau copy yang aktif
4. Copy API key yang valid

### Langkah 2: Update .env.local

Edit file `.env.local` dan update:

```env
MAILKETING_API_KEY=YOUR_NEW_VALID_API_KEY_HERE
```

**Current (INVALID):**
```
MAILKETING_API_KEY=4e6b07c547b3de9981dfe432569995ab
```

**Replace with new key from Mailketing dashboard**

### Langkah 3: Restart Server

```bash
# Stop current server
pkill -f "next dev"

# Clear cache
rm -rf .next

# Start fresh
npm run dev
```

### Langkah 4: Test Email

1. Buka: http://localhost:3000/admin/branded-templates
2. Klik tombol **Test Email** pada template
3. Masukkan email penerima
4. Klik **Send**

Email akan **benar-benar terkirim** ke penerima!

---

## 🔄 FALLBACK SYSTEM

Sistem saat ini menggunakan **simulation mode** ketika:
- API key tidak ada
- API key invalid
- API endpoint tidak tersedia

### Status Saat Ini:
```
✅ Template system: WORKING
✅ Database recording: WORKING  
✅ API endpoint: CONFIRMED (https://api.mailketing.co.id/api/v1/send)
❌ API authentication: FAILED (invalid key)
✅ Simulation mode: ACTIVE
```

### Mode Simulation:
- Email tidak benar-benar terkirim
- Success response dikembalikan
- Data disimpan ke database
- Mode = "development"

---

## 📧 ALTERNATIF: SMTP FALLBACK

Jika API Mailketing bermasalah, gunakan SMTP Gmail:

### Setup SMTP Gmail:

1. **Enable 2FA di Gmail**
2. **Generate App Password**: https://myaccount.google.com/apppasswords
3. **Update .env.local**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

4. **Aktifkan SMTP fallback** di test-email route

---

## 🧪 TEST HASIL

### Test Script:
```bash
node test-mailketing-endpoints.js
```

### Hasil Test:
```
✅ Endpoint found: /api/v1/send
✅ JSON response: YES
❌ Authentication: FAILED
   Error: "Access Denied, Invalid Token"
```

---

## ✅ CHECKLIST

Untuk mengaktifkan email **BETULAN**:

- [x] ✅ Template system berfungsi
- [x] ✅ Database recording berfungsi
- [x] ✅ Endpoint correct ditemukan
- [ ] ❌ **API Key perlu diperbarui** ← **ACTION REQUIRED**
- [x] ✅ Fallback simulation aktif
- [ ] ⏳ SMTP Gmail sebagai backup (optional)

---

## 📞 KONTAK SUPPORT

Jika masalah berlanjut:

1. **Mailketing Support**: support@mailketing.co.id
2. **Check Account Status**: Pastikan akun aktif dan tidak expired
3. **Verify Credits**: Pastikan masih ada kredit email
4. **IP Whitelist**: Tambahkan IP server jika diperlukan

---

## 🎯 QUICK FIX

**TL;DR untuk perbaikan cepat:**

```bash
# 1. Dapatkan API key baru dari Mailketing dashboard
# 2. Edit .env.local:
MAILKETING_API_KEY=new_valid_key_here

# 3. Restart
pkill -f "next dev" && npm run dev

# 4. Test email → akan terkirim betulan!
```

---

**Last Updated**: 4 Desember 2025
**Status**: API Key Invalid - Menunggu update key baru
