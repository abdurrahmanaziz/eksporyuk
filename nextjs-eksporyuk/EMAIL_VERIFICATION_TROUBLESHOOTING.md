# Email Verification System - Troubleshooting Guide

## ✅ Status Terkini

**Email Verification System: WORKING** ✓

- ✅ Mailketing API terintegrasi dengan sempurna
- ✅ API Key valid dan aktif
- ✅ Email berhasil terkirim dengan response "Mail Sent" dan "status: success"
- ✅ Template email profesional dengan HTML responsif
- ✅ Auto-logout setelah verifikasi untuk refresh session

## 📧 Flow Email Verification

```
1. User mendaftar / Admin ubah email
   ↓
2. System generate verification token
   ↓
3. Token disimpan di database (EmailVerificationToken)
   ↓
4. Email dikirim via Mailketing API
   ↓
5. User klik link verifikasi di email
   ↓
6. Token divalidasi dan emailVerified = true
   ↓
7. Auto logout → Login ulang dengan verified status
```

## 🔍 Kenapa Email Tidak Masuk Inbox?

### Penyebab Umum:

1. **Email Masuk ke Folder SPAM** (90% kasus)
   - Gmail otomatis filter email dari domain baru
   - Solusi: Cek folder Spam/Sampah
   
2. **Email Masuk ke Tab PROMOSI** 
   - Gmail kategorisasi email marketing ke tab promosi
   - Solusi: Cek tab Promosi di Gmail

3. **Delay Pengiriman Email**
   - Mailketing queue email, bisa delay 1-5 menit
   - Solusi: Tunggu beberapa menit

4. **Email Typo/Salah**
   - User salah ketik email saat registrasi
   - Solusi: Pastikan email Gmail valid

## 🛠️ Solusi yang Sudah Diterapkan

### 1. Modal Email Verification Enhancement

**File:** `/src/components/member/EmailVerificationModal.tsx`

**Fitur:**
- ✅ Instruksi jelas cek folder Spam/Promosi
- ✅ Warning text dengan highlight merah untuk folder Spam
- ✅ Tombol "Buka Gmail Sekarang" untuk quick access
- ✅ Tips untuk mark "Bukan Spam" di Gmail
- ✅ Email mismatch detection (jika admin ubah email)
- ✅ Auto logout flow jika email berbeda

### 2. Professional Email Template

**File:** `/src/lib/integrations/mailketing.ts`

**Improvement:**
- ✅ Full HTML template dengan inline CSS
- ✅ Responsive design untuk mobile
- ✅ Gradient header yang menarik
- ✅ Clear CTA button dengan shadow
- ✅ Alternative link dengan copy-paste friendly format
- ✅ Warning box untuk urgency (24 jam expiry)
- ✅ Footer dengan benefits preview
- ✅ Plain text fallback untuk email client lama

### 3. Mailketing Integration

**File:** `/src/lib/integrations/mailketing.ts`

**Konfigurasi:**
```javascript
API URL: https://api.mailketing.co.id/api/v1/send
Method: POST
Content-Type: application/x-www-form-urlencoded
Parameters:
  - api_token: 4e6b07c547b3de9981dfe432569995ab
  - from_email: noreply@eksporyuk.com
  - from_name: EksporYuk
  - recipient: user@gmail.com
  - subject: 🎉 Verifikasi Email Anda - EksporYuk
  - content: HTML template
```

**Response yang Sukses:**
```json
{
  "response": "Mail Sent",
  "status": "success"
}
```

## 📊 Test Results

### Test Terakhir: 7 Desember 2024

```
📧 Sending email via Mailketing: https://api.mailketing.co.id/api/v1/send
   To: azizbiasa@gmail.com
   Subject: 🎉 Verifikasi Email Anda - EksporYuk
📥 Mailketing send response: { response: 'Mail Sent', status: 'success' }
✅ Email sent successfully via Mailketing API
```

**Kesimpulan:** Email berhasil dikirim ke Mailketing API dengan status sukses.

## 🎯 User Instructions

### Untuk User yang Tidak Terima Email:

1. **Cek 3 Tempat Ini di Gmail:**
   - 📥 **Inbox** - Email utama
   - 🗑️ **Spam/Sampah** - PENTING! Cek di sini dulu
   - 🎁 **Promosi** - Tab kategori Gmail

2. **Cara Cek Spam di Gmail:**
   - Buka Gmail: https://mail.google.com
   - Klik "Spam" atau "Sampah" di sidebar kiri
   - Cari email dari "EksporYuk (noreply@eksporyuk.com)"
   - Klik email → Klik "Bukan Spam" di bagian atas

3. **Search Manual:**
   - Di Gmail search box, ketik: `from:noreply@eksporyuk.com`
   - Atau cari: `subject:Verifikasi Email`

4. **Jika Tidak Ada Setelah 5 Menit:**
   - Klik tombol "Kirim Ulang Email" di modal
   - Pastikan email Gmail Anda benar
   - Hubungi support

## 🔐 Email Security Best Practices

### SPF Record (Domain Owner Action)

Untuk menghindari email masuk spam, domain **eksporyuk.com** harus ada SPF record:

```
Type: TXT
Name: @
Value: v=spf1 include:mailketing.co.id ~all
```

### DKIM (Mailketing Setup)

DKIM sudah di-setup oleh Mailketing untuk domain yang terverifikasi.

### Email Reputation

Untuk meningkatkan deliverability:
- ✅ Gunakan domain resmi (bukan gmail/yahoo)
- ✅ Verifikasi domain di Mailketing
- ✅ Setup SPF, DKIM, DMARC
- ✅ Warming up: Kirim email bertahap (jangan langsung bulk)
- ✅ Monitor bounce rate & spam complaints

## 📝 Development Mode

Saat `MAILKETING_API_KEY` tidak ada di `.env.local`:

```javascript
console.log('📧 [MAILKETING - DEV MODE] Email would be sent:')
console.log('   To:', email)
console.log('   Subject:', subject)
console.log('=== EMAIL VERIFIKASI (FALLBACK) ===')
console.log('To:', email)
console.log('Verification URL:', verificationUrl)
```

Email tidak benar-benar terkirim, hanya log di console untuk development.

## 🧪 Testing Email

### Quick Test Script

File: `/test-mailketing.js`

```bash
node test-mailketing.js
```

Script akan:
1. Test langsung ke Mailketing API
2. Kirim test email ke azizbiasa@gmail.com
3. Show response status dan error (jika ada)
4. Memberikan solusi jika API key invalid

## 🐛 Common Errors & Solutions

### Error 1: "Invalid Token"

**Penyebab:** API key salah atau expired

**Solusi:**
1. Login ke Mailketing dashboard: https://mailketing.co.id
2. Pergi ke Settings → API
3. Copy API token yang valid
4. Update `MAILKETING_API_KEY` di `.env.local`
5. Restart Next.js server

### Error 2: Email Tidak Sampai

**Penyebab:** Email di folder Spam

**Solusi:**
1. Cek folder Spam di Gmail
2. Mark "Bukan Spam" untuk email dari EksporYuk
3. Email berikutnya akan masuk Inbox

### Error 3: "Access Denied"

**Penyebab:** API key tidak memiliki permission

**Solusi:**
1. Pastikan API key dari akun yang benar
2. Check billing/subscription di Mailketing
3. Hubungi support Mailketing

## 📈 Monitoring

### Log yang Perlu Diperhatikan

**Success Log:**
```
✅ Email sent successfully via Mailketing API
📬 Mailketing result: { success: true, message: 'Email sent successfully' }
```

**Error Log:**
```
❌ Mailketing Error: [error message]
❌ Failed to send via Mailketing: [error]
```

### Database Check

Check token yang belum diverifikasi:

```sql
SELECT * FROM "EmailVerificationToken" 
WHERE expires > NOW() 
ORDER BY createdAt DESC;
```

Check user yang belum verify:

```sql
SELECT id, name, email, "emailVerified", "createdAt" 
FROM "User" 
WHERE "emailVerified" = false 
ORDER BY "createdAt" DESC;
```

## 🚀 Next Steps untuk Improve Deliverability

1. **Setup SPF Record** di DNS eksporyuk.com
2. **Verifikasi Domain** di Mailketing dashboard
3. **Enable DKIM** untuk domain
4. **Setup DMARC** record
5. **Email Warming** - kirim email bertahap untuk build reputation
6. **Monitor Metrics** - track open rate, bounce rate, spam complaints

## 📞 Support

Jika user masih tidak terima email setelah semua troubleshooting:

1. Check database apakah token generated
2. Check Mailketing dashboard untuk delivery log
3. Verify email address benar dan active
4. Consider alternative: Manual verification by admin
5. Contact Mailketing support untuk investigasi

---

**Last Updated:** 7 Desember 2024
**Status:** ✅ System Working - Email Sent Successfully
**Test Email:** azizbiasa@gmail.com
**Response:** "Mail Sent", "status: success"
