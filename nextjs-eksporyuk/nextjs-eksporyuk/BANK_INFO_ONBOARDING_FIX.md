# Fix: Affiliate Bank Info Onboarding Repeating Form Issue

**Issue**: Setelah mengisi rekening bank di halaman affiliate onboarding, form bank info terus diminta lagi ketika halaman di-reload atau affiliate masuk ke halaman onboarding lagi.

**Root Cause**: Endpoint `POST /api/affiliate/onboarding` tidak menangani `step: 'bank'`. Ketika onboarding form disubmit:
1. Data profil dan bank berhasil disimpan ke database via `/api/affiliate/profile` ✓
2. Tetapi saat `POST /api/affiliate/onboarding` dengan `step: 'bank'` dipanggil, endpoint tidak mengenali step ini
3. Field `bankInfoCompleted` di `AffiliateProfile` tidak pernah di-update
4. GET endpoint selalu melihat `bankInfoCompleted = false` dan menampilkan form lagi

## Perubahan yang Dilakukan

### 1. Tambah Field ke Schema Database
**File**: `prisma/schema.prisma`

```prisma
model AffiliateProfile {
  // ... existing fields
  bankInfoCompleted     Boolean   @default(false)
  bankInfoCompletedAt   DateTime?
  // ... rest of fields
}
```

**Alasan**: Perlu field khusus untuk melacak apakah affiliate telah menyelesaikan input data bank. Ini memastikan form tidak diminta berulang kali.

### 2. Update POST Endpoint untuk Handle Step 'bank'
**File**: `src/app/api/affiliate/onboarding/route.ts`

```typescript
// Added case 'bank' ke switch statement
case 'bank':
  updateData.bankInfoCompleted = completed
  if (completed) updateData.bankInfoCompletedAt = new Date()
  break
```

**Alasan**: POST endpoint harus dapat menangani update untuk step `bank`, tidak hanya `profile`, `training`, `link`, dan `welcome`.

### 3. Update GET Logic untuk Prioritaskan bankInfoCompleted Flag
**File**: `src/app/api/affiliate/onboarding/route.ts`

Sebelum:
```typescript
const bankInfoCompleted = hasBankInfo || !!(
  affiliate.bankName && 
  affiliate.bankAccountName && 
  affiliate.bankAccountNumber
)
```

Sesudah:
```typescript
const bankInfoCompleted = affiliate.bankInfoCompleted || hasBankInfo || !!(
  affiliate.bankName && 
  affiliate.bankAccountName && 
  affiliate.bankAccountNumber
)
```

**Alasan**: Prioritaskan field database `bankInfoCompleted` karena ini adalah sumber kebenaran (source of truth) untuk status onboarding.

## Flow Setelah Fix

1. **Submit Form** → User klik submit di `/affiliate/onboarding`
   - POST `/api/affiliate/profile` → Simpan data user & bank ke payout table ✓
   - POST `/api/affiliate/onboarding?step=bank&completed=true` → Update `bankInfoCompleted=true` di affiliateProfile ✓

2. **Reload Page** → User kembali ke `/affiliate/onboarding`
   - GET `/api/affiliate/onboarding` → Cek `affiliate.bankInfoCompleted` (now true) ✓
   - Frontend evaluasi: `!profileCompleted || !bankInfoCompleted` = false ✓
   - Form tidak diminta lagi, redirect ke `/affiliate/dashboard` ✓

## Testing

**Test Script**: `test-bank-info-fix.js`

Hasil:
```
✅ SUCCESS: Bank info form will NOT be shown again!
   The bankInfoCompleted flag is now properly set in the database.
   Next onboarding page load will skip the bank form.
```

## Migrasi Database

```bash
# Sinkronkan schema changes
npx prisma db push --skip-generate

# Generate Prisma client
npx prisma generate
```

**Status**: ✅ Sudah dilakukan

## Safety Notes

- ✅ Tidak ada data yang dihapus
- ✅ Backward compatible (field default=false untuk existing records)
- ✅ Onboarding page sudah memanggil step='bank' dengan benar
- ✅ GET logic tetap handle fallback ke payout records jika field tidak set
- ✅ Test script memverifikasi keseluruhan flow

## Files Modified

1. `prisma/schema.prisma` - Tambah bankInfoCompleted & bankInfoCompletedAt fields
2. `src/app/api/affiliate/onboarding/route.ts` - Handle step='bank' + update GET logic
3. `test-bank-info-fix.js` - Test script untuk verifikasi (baru)

## Verifikasi Manual

Untuk test di production/staging:

```bash
# Lihat status affiliate yang ada
node test-bank-info-fix.js

# Atau query langsung via Prisma Studio
npx prisma studio
# Lihat AffiliateProfile > bankInfoCompleted field
```

---

**Date**: 29 Desember 2025
**Status**: ✅ COMPLETE
