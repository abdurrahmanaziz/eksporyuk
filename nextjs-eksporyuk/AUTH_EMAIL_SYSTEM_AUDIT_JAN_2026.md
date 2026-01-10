# 🔐 Audit Sistem Email Autentikasi - Januari 2026

**Tanggal Audit**: 3 Januari 2026  
**Sistem yang Diaudit**: Lupa Password, Reset Password, & Verifikasi Email  
**Platform**: Next.js 16 + Prisma + Mailketing API  

---

## 📋 RINGKASAN EKSEKUTIF

Platform menggunakan **3 sistem email autentikasi** yang berbeda:

1. **Verifikasi Email** - Untuk user baru (EmailVerificationToken)
2. **Forgot Password LEGACY** - API lama (EmailVerificationToken dengan type='PASSWORD_RESET')
3. **Forgot Password V2** - API baru (PasswordResetToken dedicated model)

### Status Kesehatan: 🟡 MODERATE RISK

**Temuan Kritis**:
- ✅ **2 API Reset Password Aktif** - Bisa menyebabkan kebingungan
- ⚠️ **Duplikasi Model** - EmailVerificationToken dipakai untuk 2 tujuan berbeda
- ✅ **Integrasi Mailketing** - Semua email menggunakan branded template system
- ⚠️ **Tidak Ada Rate Limiting** - Berpotensi spam email

---

## 🔍 DETAIL ANALISIS SISTEM

### 1. SISTEM VERIFIKASI EMAIL (Email Verification)

#### 📊 **Komponen Utama**

| Komponen | File | Status |
|----------|------|--------|
| **Service Logic** | `src/lib/email-verification.ts` | ✅ Production |
| **API Endpoint** | `src/app/api/auth/verify-email/route.ts` | ✅ Production |
| **UI Page** | `src/app/auth/verify-email/page.tsx` | ✅ Production |
| **Database Model** | `EmailVerificationToken` | ✅ Active |
| **Email Template** | Mailketing `email-verification` | ✅ Branded |

#### 🔄 **Alur Proses**

```mermaid
1. User Register → createVerificationToken()
2. Generate Token (24 jam expiry)
3. Save to EmailVerificationToken table
4. sendVerificationEmail() via Mailketing
5. User klik link → /auth/verify-email?token=XXX
6. verifyEmailToken() validasi & update user.emailVerified
7. Auto logout → redirect ke /login?verified=true
```

#### ✅ **Fitur & Keamanan**

- **Token Expiry**: 24 jam (cukup lama untuk user)
- **Auto-Verify Gmail**: Khusus email @gmail.com langsung verified tanpa email
- **Branded Template**: Menggunakan `email-verification` template dari Mailketing
- **Fallback System**: Jika template tidak ada, gunakan hardcoded HTML
- **Single-Use Token**: Token dihapus setelah berhasil diverifikasi
- **Session Refresh**: Auto logout setelah verify untuk refresh JWT session
- **Countdown UI**: 3 detik countdown sebelum redirect ke login

#### ⚠️ **Potensi Masalah**

1. **Tidak Ada Rate Limiting**
   - User bisa spam resend verification email berkali-kali
   - **Rekomendasi**: Tambahkan cooldown 2 menit antara resend

2. **Gmail Auto-Verify Bypass**
   - Fungsi `autoVerifyGmailEmail()` tidak dipakai di registration flow
   - **Rekomendasi**: Panggil di `/api/auth/register` setelah create user

3. **Error Handling Lemah**
   - Email gagal kirim hanya log console, user tidak diberi tahu
   - **Rekomendasi**: Tampilkan peringatan "Email mungkin masuk folder spam"

---

### 2. SISTEM FORGOT PASSWORD (2 VERSI AKTIF)

#### 🔴 **MASALAH UTAMA: DUPLIKASI API**

Platform memiliki **2 API berbeda** untuk forgot password yang keduanya masih aktif:

| Aspect | LEGACY (`/forgot-password`) | V2 (`/forgot-password-v2`) |
|--------|----------------------------|---------------------------|
| **API Route** | `/api/auth/forgot-password` | `/api/auth/forgot-password-v2` |
| **Database Model** | `EmailVerificationToken` (type='PASSWORD_RESET') | `PasswordResetToken` (dedicated) |
| **Token Expiry** | 1 jam | 1 jam |
| **Email Method** | Mailketing via `sendPasswordResetEmail()` | Mailketing via `sendPasswordResetEmail()` |
| **UI Usage** | Unknown (perlu cek) | `/app/(auth)/forgot-password/page.tsx` ✅ |
| **Status** | 🟡 Active (masih bisa dipakai) | ✅ Active (officially used) |

#### 📂 **Komponen V2 (Yang Dipakai Sekarang)**

| Komponen | File | Status |
|----------|------|--------|
| **Request API** | `src/app/api/auth/forgot-password-v2/route.ts` | ✅ Production (246 lines) |
| **Reset API** | `src/app/api/auth/reset-password-new/route.ts` | ✅ Production (120 lines) |
| **UI Request** | `src/app/(auth)/forgot-password/page.tsx` | ✅ Production |
| **UI Reset** | `src/app/(auth)/reset-password/page.tsx` | ✅ Production (274 lines) |
| **Database Model** | `PasswordResetToken` | ✅ Active (9 fields) |
| **Email Template** | `reset-password` (Mailketing) | ✅ Branded |

#### 🔄 **Alur Proses V2 (Forgot Password)**

**FASE 1: Request Reset**
```
1. User akses /forgot-password
2. Input email → POST /api/auth/forgot-password-v2
3. System:
   - Cek user exist (jika tidak, tetap return success untuk prevent email enumeration)
   - Delete token lama untuk email ini
   - Generate random token (32 chars)
   - Save ke PasswordResetToken (expires 1 jam)
   - Kirim email via Mailketing dengan resetLink
4. User dapat email → klik link
```

**FASE 2: Reset Password**
```
1. Link membawa ke /reset-password?token=XXX
2. User input password baru (min 8 chars)
3. POST /api/auth/reset-password-new
4. System:
   - Validasi token (exists, not used, not expired)
   - Hash password baru dengan bcrypt (10 rounds)
   - Update user.password
   - Mark token.used = true, token.usedAt = now
   - Delete token lama untuk email ini
   - Kirim email konfirmasi
5. Redirect ke /login
```

#### ✅ **Fitur & Keamanan V2**

**Security Features**:
- ✅ **Email Enumeration Protection**: Selalu return success meskipun email tidak terdaftar
- ✅ **Token Expiry**: 1 jam (ketat untuk keamanan)
- ✅ **Single-Use Token**: Field `used` dan `usedAt` mencegah reuse
- ✅ **Password Strength**: Minimum 8 karakter (bisa ditingkatkan)
- ✅ **Old Token Cleanup**: Hapus token lama saat generate baru
- ✅ **Bcrypt Hashing**: 10 rounds (standar industry)
- ✅ **Confirmation Email**: Email konfirmasi setelah password berhasil direset

**UX Features**:
- ✅ **Loading States**: Spinner animation saat processing
- ✅ **Error Messages**: User-friendly error messages
- ✅ **Success Screen**: Clear success state dengan countdown
- ✅ **Password Visibility Toggle**: Eye icon untuk show/hide password
- ✅ **Validation Feedback**: Real-time validation feedback
- ✅ **Auto Redirect**: Redirect ke login setelah success

#### 📧 **Email Templates**

**Reset Password Email** (`sendPasswordResetEmail`):
```
Subject: 🔐 Reset Password - EksporYuk
Template: reset-password (Mailketing branded)
Variables:
  - userName: Nama user
  - resetUrl: Link reset (valid 1 jam)
  - expiryTime: "1 jam"
  - appName: "EksporYuk"

Fallback: Hardcoded HTML dengan gradient orange design
```

**Reset Confirmation Email** (`sendPasswordResetConfirmationEmail`):
```
Subject: ✅ Password Berhasil Direset
Template: Hardcoded (tidak ada branded template)
Design: Green gradient untuk success state
Info: Tanggal reset, IP address (future enhancement)
CTA: Login button
Warning: Security reminder jika bukan user yang reset
```

#### ⚠️ **Potensi Masalah V2**

1. **🔴 CRITICAL: Duplikasi API**
   - Legacy `/forgot-password` masih aktif dan bisa diakses
   - Menggunakan model berbeda (EmailVerificationToken)
   - **Risk**: User atau developer bingung pakai yang mana
   - **Rekomendasi**: 
     ```typescript
     // Di /api/auth/forgot-password/route.ts
     export async function POST() {
       return NextResponse.redirect('/api/auth/forgot-password-v2')
     }
     ```

2. **🟡 MODERATE: Tidak Ada Rate Limiting**
   - User bisa spam request reset password berkali-kali
   - **Impact**: Email flooding, DoS attack potential
   - **Rekomendasi**: Implement rate limit 3 attempts per 15 menit per email

3. **🟡 MODERATE: Password Strength Lemah**
   - Hanya validasi minimum 8 karakter
   - Tidak ada validasi uppercase, number, special char
   - **Rekomendasi**:
     ```typescript
     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
     // Min 8 chars, 1 lowercase, 1 uppercase, 1 number
     ```

4. **🟢 LOW: Tidak Ada IP Logging**
   - System tidak track IP address saat reset password
   - **Enhancement**: Tambahkan field `ipAddress` di PasswordResetToken
   - **Benefit**: Security audit trail

5. **🟢 LOW: Konfirmasi Email Tidak Pakai Branded Template**
   - `sendPasswordResetConfirmationEmail` pakai hardcoded HTML
   - **Rekomendasi**: Buat template `reset-password-success` di Mailketing

6. **🟡 MODERATE: Tidak Ada Notification ke Email Lama**
   - Jika email berhasil direset, user tidak dapat notifikasi security
   - **Rekomendasi**: Kirim security alert email "Password anda telah dirubah"

---

### 3. DATABASE MODELS

#### 📊 **EmailVerificationToken** (Multi-Purpose Model)

```prisma
model EmailVerificationToken {
  id         String   @id @default(cuid())
  identifier String   // User ID
  email      String   
  token      String   @unique
  expires    DateTime
  type       String   @default("EMAIL_VERIFICATION") // 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
  @@index([email])
}
```

**Digunakan untuk**:
1. ✅ Email verification (new user registration)
2. ⚠️ Password reset (LEGACY API only)

**⚠️ Masalah**: Model ini dipakai untuk 2 tujuan berbeda
- **Type field** membedakan tapi tidak ideal
- **Rekomendasi**: Pisahkan menjadi 2 model terpisah

#### 📊 **PasswordResetToken** (Dedicated Model)

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  used      Boolean  @default(false)
  usedAt    DateTime?

  @@index([email])
  @@index([token])
  @@index([expiresAt])
}
```

**Digunakan untuk**: Password reset (V2 API only) ✅

**✅ Keunggulan**:
- Dedicated purpose (single responsibility)
- Field `used` & `usedAt` untuk tracking
- Better indexing untuk performance
- Cleaner separation of concerns

---

## 📊 RINGKASAN TEMUAN

### 🔴 HIGH PRIORITY ISSUES

| # | Issue | Impact | File(s) Affected | Recommendation |
|---|-------|--------|------------------|----------------|
| 1 | **2 API Forgot Password Aktif** | User/Dev Confusion | `/forgot-password`, `/forgot-password-v2` | Redirect legacy ke V2 atau hapus |
| 2 | **Tidak Ada Rate Limiting** | Email Spam, DoS | Semua API email | Implement rate limit library |
| 3 | **EmailVerificationToken Multi-Purpose** | Coupling, Maintenance | `schema.prisma` | Migrate fully to dedicated models |

### 🟡 MODERATE PRIORITY ISSUES

| # | Issue | Impact | File(s) Affected | Recommendation |
|---|-------|--------|------------------|----------------|
| 4 | **Password Strength Validation Lemah** | Security Risk | `/reset-password` API | Add regex validation |
| 5 | **Tidak Ada Security Notification** | User Security Awareness | Reset password flow | Send security alert email |
| 6 | **Gmail Auto-Verify Tidak Dipakai** | UX Tidak Optimal | `/register` API | Call autoVerifyGmailEmail() |
| 7 | **Tidak Ada IP Logging** | No Audit Trail | PasswordResetToken | Add ipAddress field |

### 🟢 LOW PRIORITY ENHANCEMENTS

| # | Issue | Impact | File(s) Affected | Recommendation |
|---|-------|--------|------------------|----------------|
| 8 | **Konfirmasi Email Not Branded** | Branding Consistency | `mailketingService.ts` | Create Mailketing template |
| 9 | **Resend Cooldown Missing** | UX & Performance | Email verification | Add 2-min cooldown |
| 10 | **Error Messaging to User** | UX Transparency | Email sending failures | Show "Check spam" notice |

---

## 📈 USAGE STATISTICS

### Files Using Email Authentication

```bash
# Email Verification Files
src/lib/email-verification.ts (285 lines)
src/app/api/auth/verify-email/route.ts
src/app/api/auth/register/route.ts (calls sendVerificationEmail)
src/app/auth/verify-email/page.tsx (161 lines)

# Password Reset Files (V2)
src/app/api/auth/forgot-password-v2/route.ts (246 lines)
src/app/api/auth/reset-password-new/route.ts (120 lines)
src/app/(auth)/forgot-password/page.tsx (171 lines)
src/app/(auth)/reset-password/page.tsx (274 lines)

# Password Reset Files (LEGACY - DEPRECATED?)
src/app/api/auth/forgot-password/route.ts (274 lines)
src/app/api/auth/reset-password/route.ts (104 lines)

# Shared Services
src/lib/services/mailketingService.ts (510 lines)
  - sendPasswordResetEmail() (line 303)
  - sendPasswordResetConfirmationEmail() (line 404)
```

**Total Files**: 14 files related to auth emails  
**Total Lines of Code**: ~2,500+ lines

---

## ✅ REKOMENDASI PRIORITAS

### 🔥 **IMMEDIATE ACTION (This Week)**

1. **Deprecated Legacy Forgot Password API**
   ```typescript
   // File: src/app/api/auth/forgot-password/route.ts
   export async function POST(request: NextRequest) {
     return NextResponse.json({
       error: 'This API is deprecated. Please use /api/auth/forgot-password-v2',
       redirectTo: '/api/auth/forgot-password-v2'
     }, { status: 410 }) // 410 Gone
   }
   ```

2. **Implement Rate Limiting**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```
   ```typescript
   // Add to all email APIs
   import { Ratelimit } from '@upstash/ratelimit'
   
   const ratelimit = new Ratelimit({
     redis: redis,
     limiter: Ratelimit.slidingWindow(3, '15 m') // 3 requests per 15 min
   })
   ```

3. **Enhanced Password Validation**
   ```typescript
   // File: src/app/api/auth/reset-password-new/route.ts
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
   
   if (!passwordRegex.test(newPassword)) {
     return NextResponse.json({
       error: 'Password harus minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol'
     }, { status: 400 })
   }
   ```

### 📅 **SHORT-TERM (This Month)**

4. **Security Notification Email**
   - Kirim email ke user saat password berhasil direset
   - Sertakan timestamp, IP address, device info
   - Tambahkan "Wasn't you? Secure your account" link

5. **IP Address Logging**
   ```prisma
   model PasswordResetToken {
     // ... existing fields
     ipAddress String?
     userAgent String?
   }
   ```

6. **Gmail Auto-Verification**
   ```typescript
   // File: src/app/api/auth/register/route.ts
   if (isValidGmailEmail(email)) {
     await autoVerifyGmailEmail(newUser.id)
   }
   ```

### 🎯 **LONG-TERM (Next Quarter)**

7. **Migrate EmailVerificationToken**
   - Buat model `EmailVerificationToken` hanya untuk email verification
   - Hapus field `type` yang membingungkan
   - Migration script untuk data existing

8. **Branded Email Templates**
   - Buat template `reset-password-success` di Mailketing
   - Buat template `email-verification` di Mailketing (jika belum)
   - Standardize semua email pakai branded template

9. **Email Delivery Monitoring**
   - Integrate dengan sistem monitoring yang sudah ada
   - Track delivery rate, bounce rate, open rate
   - Alert jika ada anomaly

---

## 🔒 SECURITY CHECKLIST

| Security Aspect | Email Verification | Password Reset V2 | Status |
|-----------------|-------------------|-------------------|--------|
| **Token Expiry** | ✅ 24 jam | ✅ 1 jam | GOOD |
| **Single-Use Token** | ✅ Yes | ✅ Yes (`used` field) | GOOD |
| **HTTPS Only** | ✅ Yes | ✅ Yes | GOOD |
| **Email Enumeration** | ⚠️ Exposed | ✅ Protected | MODERATE |
| **Rate Limiting** | ❌ No | ❌ No | **CRITICAL** |
| **Password Strength** | N/A | ⚠️ Basic (8 chars) | MODERATE |
| **IP Logging** | ❌ No | ❌ No | LOW |
| **Bcrypt Hashing** | N/A | ✅ 10 rounds | GOOD |
| **Token Length** | ✅ CUID (25 chars) | ✅ Random 32 chars | GOOD |
| **CSRF Protection** | ✅ Next.js built-in | ✅ Next.js built-in | GOOD |
| **Email Validation** | ✅ Regex | ✅ Regex | GOOD |

**Overall Security Score**: 7/11 (64%) - **NEEDS IMPROVEMENT**

---

## 📝 DOKUMENTASI TEKNIS

### Environment Variables Required

```env
# Mailketing API (REQUIRED)
MAILKETING_API_KEY="your-api-key"
MAILKETING_API_URL="https://api.mailketing.co.id"

# App Configuration
NEXTAUTH_URL="https://eksporyuk.com"
NEXT_PUBLIC_APP_NAME="EksporYuk"

# Optional: Rate Limiting (RECOMMENDED)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### API Endpoints Summary

```typescript
// Email Verification
GET  /api/auth/verify-email?token={token}
POST /api/auth/resend-verification (future)

// Password Reset V2 (ACTIVE)
POST /api/auth/forgot-password-v2
  Body: { email: string }
  
POST /api/auth/reset-password-new
  Body: { token: string, newPassword: string }

// Password Reset Legacy (DEPRECATED)
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Testing Commands

```bash
# Test email verification flow
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234","name":"Test User"}'

# Test forgot password V2
curl -X POST http://localhost:3000/api/auth/forgot-password-v2 \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'

# Check Mailketing credits
curl -X GET http://localhost:3000/api/admin/email-credits \
  -H "Authorization: Bearer {admin-token}"
```

---

## 🎓 KESIMPULAN

### ✅ **Yang Sudah Bagus**

1. ✅ Semua email menggunakan Mailketing API (centralized)
2. ✅ Branded template system dengan fallback mechanism
3. ✅ Dedicated PasswordResetToken model untuk V2
4. ✅ Security best practices (bcrypt, token expiry, single-use)
5. ✅ UX yang baik (loading states, error messages, success screens)
6. ✅ Email enumeration protection di forgot password V2

### ⚠️ **Yang Perlu Diperbaiki**

1. ❌ **2 API forgot password aktif** - segera deprecated yang lama
2. ❌ **Tidak ada rate limiting** - critical untuk prevent abuse
3. ⚠️ **Password strength validation lemah** - upgrade ke regex strong
4. ⚠️ **Tidak ada security notification** - user tidak tahu password berubah
5. ⚠️ **Gmail auto-verify tidak dipakai** - UX bisa lebih baik

### 🎯 **Next Steps**

**Minggu Ini (Priority 1)**:
1. Implement rate limiting untuk semua email API
2. Deprecated legacy forgot-password API
3. Enhanced password validation

**Bulan Ini (Priority 2)**:
4. Security notification email system
5. IP address logging
6. Gmail auto-verification integration

**Quarter Ini (Priority 3)**:
7. Migrate EmailVerificationToken model
8. Branded templates untuk semua email
9. Email delivery monitoring dashboard

---

**Laporan Dibuat Oleh**: GitHub Copilot  
**Tanggal**: 3 Januari 2026  
**File**: `AUTH_EMAIL_SYSTEM_AUDIT_JAN_2026.md`

---

## 📎 LAMPIRAN

### A. Database Schema Reference

```prisma
// Current Schema (prisma/schema.prisma)

model EmailVerificationToken {
  id         String   @id @default(cuid())
  identifier String
  email      String
  token      String   @unique
  expires    DateTime
  type       String   @default("EMAIL_VERIFICATION")
  createdAt  DateTime @default(now())
  
  @@unique([identifier, token])
  @@index([email])
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  used      Boolean   @default(false)
  usedAt    DateTime?
  
  @@index([email])
  @@index([token])
  @@index([expiresAt])
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  emailVerified Boolean   @default(false)
  name          String?
  // ... other fields
}
```

### B. Email Flow Diagrams

**Email Verification Flow**:
```
Register → Create Token (24h) → Send Email → User Clicks → Verify → Logout → Login
```

**Password Reset Flow V2**:
```
Forgot → Request Token (1h) → Send Email → User Clicks → Enter New Password → 
Update Password → Mark Token Used → Send Confirmation → Login
```

### C. Mailketing Integration Details

- **API Endpoint**: `https://api.mailketing.co.id/api/v1/send`
- **Current Credits**: 429,405 (healthy)
- **Templates Active**: 106 templates
- **Files Using Mailketing**: 78 files
- **Retry System**: ✅ Implemented (exponential backoff)
- **Credits Monitoring**: ✅ Daily cron job
- **Alert Thresholds**: 50k (warning), 10k (critical), 1k (emergency)

---

**END OF REPORT**
