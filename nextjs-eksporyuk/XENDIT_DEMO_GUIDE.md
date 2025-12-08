# Panduan Demo Xendit Payment & Kursus GRATIS

## 🚀 Perubahan yang Sudah Diterapkan

### 1. Xendit Sandbox Mode (Test Environment)
✅ **File:** `.env.local`
- `XENDIT_API_KEY`: Menggunakan test key `xnd_development_...`
- `XENDIT_SECRET_KEY`: Test secret key
- `XENDIT_MODE`: `test` (sandbox mode)
- `APP_URL`: `http://localhost:3000`

### 2. Kursus GRATIS - Flow Langsung Belajar
✅ **File:** `src/app/courses/[id]/page.tsx`

**Perubahan UI:**
- Tombol untuk kursus GRATIS: **"Belajar Sekarang"** (bukan "Daftar Sekarang")
- Tombol "Preview Gratis" hanya muncul untuk kursus BERBAYAR
- Badge GRATIS tetap ditampilkan dengan warna hijau

**Logika:**
```typescript
// Kursus GRATIS (price = 0 atau null)
if (course.price === 0 || course.price == null) {
  // Langsung enroll tanpa payment
  const enrollment = await prisma.courseEnrollment.create({...})
  // Redirect ke /courses/{id}/learn
}

// Kursus BERBAYAR (price > 0)
if (course.price > 0) {
  // Create transaction dengan Xendit
  // Redirect ke payment page Xendit
}
```

### 3. Xendit Payment Integration
✅ **File:** `src/app/api/courses/[id]/purchase/route.ts`

**Flow Pembayaran:**
1. User klik "Beli Sekarang - Rp XXX"
2. System create transaction (status: PENDING)
3. Xendit Invoice/VA dibuat dengan:
   - Expiry: 24 jam (86400 detik)
   - Success URL: `/courses/{id}/learn?payment=success`
   - Failure URL: `/courses/{id}?payment=failed`
4. User redirect ke Xendit payment page
5. Setelah bayar, webhook update status transaction
6. User auto-enrolled ke kursus

## 🧪 Cara Testing

### Test 1: Kursus GRATIS
1. Buka: `http://localhost:3000/courses`
2. Cari kursus dengan badge "GRATIS"
3. Klik kursus tersebut
4. **Verifikasi:**
   - Badge "GRATIS" muncul (bukan harga)
   - Tombol: **"Belajar Sekarang"** (bukan "Daftar Sekarang")
   - Tombol "Preview Gratis" TIDAK muncul
5. Klik "Belajar Sekarang"
6. **Expected:** Langsung masuk ke halaman pembelajaran

### Test 2: Kursus BERBAYAR (Xendit Sandbox)
1. Buka: `http://localhost:3000/courses`
2. Cari kursus dengan harga (misal: Rp 1.500.000)
3. Klik kursus tersebut
4. **Verifikasi:**
   - Harga ditampilkan dengan format currency
   - Tombol: **"Beli Sekarang - Rp 1.500.000"**
   - Tombol "Preview Gratis" muncul
5. Klik "Beli Sekarang"
6. **Expected:** Redirect ke Xendit payment page (sandbox mode)
7. Di Xendit page, pilih metode pembayaran (VA/E-Wallet/QRIS)
8. **Untuk Testing Sandbox:**
   - VA: Copy nomor VA, lalu simulate payment di Xendit dashboard
   - E-Wallet: Akan ada callback URL untuk simulasi success
   - QRIS: Scan QR dengan app e-wallet test

### Test 3: Payment Success Flow
1. Setelah simulate payment success di Xendit dashboard
2. Xendit webhook hit: `/api/webhooks/xendit`
3. Transaction status berubah: PENDING → PAID
4. User auto-enrolled ke kursus
5. Redirect ke: `/courses/{id}/learn?payment=success`
6. **Verifikasi:** User bisa akses semua materi

## 📝 Xendit Test Credentials

### Sandbox Dashboard
- URL: https://dashboard.xendit.co/
- Login dengan akun Xendit sandbox Anda

### Test Credit Cards
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVV: 123
```

### Test VA Numbers
- BCA: Akan generate nomor test otomatis
- BNI: Akan generate nomor test otomatis
- Mandiri: Akan generate nomor test otomatis

### Simulate Payment
1. Login ke Xendit Dashboard (sandbox)
2. Go to: **Transactions** → **Test Payments**
3. Find your invoice/VA
4. Click **Simulate Payment**
5. Choose success or failed

## 🔧 Troubleshooting

### Xendit Invoice Gagal Dibuat
**Error:** `Failed to create Xendit invoice`

**Solusi:**
1. Cek `.env.local`:
   ```bash
   XENDIT_API_KEY=xnd_development_...
   XENDIT_SECRET_KEY=xnd_development_...
   ```
2. Pastikan key bukan production key (`xnd_production_`)
3. Restart server: `npm run dev`

### Kursus GRATIS Masih Minta Bayar
**Masalah:** Tombol masih "Daftar Sekarang" bukan "Belajar Sekarang"

**Solusi:**
1. Clear browser cache
2. Hard reload: `Ctrl + Shift + R`
3. Cek database: Pastikan course.price = 0

### Webhook Tidak Berfungsi
**Masalah:** Payment success tapi status masih PENDING

**Solusi:**
1. Untuk local testing, webhook tidak bisa langsung hit localhost
2. Gunakan ngrok atau expose local:
   ```bash
   ngrok http 3000
   ```
3. Update Xendit webhook URL ke ngrok URL
4. Atau simulate manual di code:
   ```typescript
   // Untuk testing, langsung update transaction
   await prisma.transaction.update({
     where: { id: transactionId },
     data: { status: 'PAID' }
   })
   ```

## 🎯 Next Steps

1. **Production Setup:**
   - Ganti ke production keys di `.env.production`
   - Update `XENDIT_MODE` dari `test` ke `live`
   - Setup webhook URL yang accessible dari internet

2. **Additional Features:**
   - Email notification setelah payment success
   - Invoice/Receipt generation
   - Refund handling
   - Payment reminder untuk pending transactions

## 📞 Support

- Xendit Docs: https://docs.xendit.co/
- Xendit Support: support@xendit.co
- Xendit Slack Community

---

**Last Updated:** 2025-01-21
**Version:** 1.0.0
