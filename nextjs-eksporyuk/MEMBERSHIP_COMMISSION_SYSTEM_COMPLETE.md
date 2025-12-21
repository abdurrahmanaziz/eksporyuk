# Sistem Komisi Membership - Lengkap & Terintegrasi

## 📋 Overview

Sistem komisi affiliate untuk membership telah berhasil ditambahkan dengan dukungan **dua tipe komisi**:
1. **PERCENTAGE** - Komisi berdasarkan persentase dari harga
2. **FLAT** - Komisi dengan nominal tetap per transaksi

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Database Schema** ✓
- Field `commissionType` (enum: PERCENTAGE/FLAT) sudah ada di model `Membership`
- Field `affiliateCommissionRate` untuk menyimpan nilai komisi (% atau Rp)
- Default: `PERCENTAGE` dengan rate 30%

### 2. **Admin - Membership Create Page** ✓
**File**: `/src/app/(dashboard)/admin/membership-plans/create/page.tsx`

**Fitur**:
- ✓ Form input tipe komisi (dropdown: Persentase/Nominal Tetap)
- ✓ Form input nilai komisi (angka)
- ✓ Preview kalkulasi komisi realtime
- ✓ Info box cara kerja pembagian revenue
- ✓ Validasi input

**UI Preview**:
```
┌─ Pengaturan Komisi Affiliate ─────────────┐
│ Tipe Komisi: [Persentase ▼]               │
│ Persentase Komisi: [30] %                 │
│ → Affiliate mendapat 30% = Rp 89,700      │
│                                            │
│ ℹ️ Informasi Komisi:                       │
│   • Komisi affiliate langsung masuk balance│
│   • Sisanya: Admin 15%, Founder 60%, etc  │
└────────────────────────────────────────────┘
```

### 3. **Admin - Membership Edit Page** ✓
**File**: `/src/app/(dashboard)/admin/membership-plans/[id]/edit/page.tsx`

**Fitur**:
- ✓ Load data komisi dari database
- ✓ Edit tipe komisi dan nilai komisi
- ✓ Preview kalkulasi realtime saat ubah harga
- ✓ Tampil di tab "Pricing" dalam card terpisah
- ✓ Icon Wallet untuk visual

**Lokasi**: Tab **"Harga & Durasi"** → Card **"Pengaturan Komisi Affiliate"**

### 4. **API Endpoints** ✓

#### GET `/api/admin/membership-plans/[id]`
- ✓ Mengembalikan `commissionType` dan `affiliateCommissionRate`

#### PATCH `/api/admin/membership-plans/[id]`
- ✓ Menerima dan validasi `commissionType`
- ✓ Menerima dan update `affiliateCommissionRate`
- ✓ Validasi enum: hanya PERCENTAGE/FLAT yang diterima

#### POST `/api/admin/membership-plans`
- ✓ Default: `commissionType: 'PERCENTAGE'`
- ✓ Default: `affiliateCommissionRate: 30`
- ✓ Menerima custom value dari form create

### 5. **Commission Helper** ✓
**File**: `/src/lib/commission-helper.ts`

**Fungsi**: `calculateCommission(totalAmount, rate, type)`

**Logika**:
```typescript
if (commissionType === 'FLAT') {
  // Komisi tetap, cap maksimal = total amount
  affiliateCommission = Math.min(rate, totalAmount)
  affiliatePercentage = (affiliateCommission / totalAmount) * 100 // untuk display
} else {
  // Komisi persentase
  affiliateCommission = (totalAmount * rate) / 100
  affiliatePercentage = rate
}
```

**Return**:
- ✓ `affiliateCommission` - Jumlah komisi dalam Rupiah
- ✓ `affiliatePercentage` - Persentase untuk display
- ✓ `commissionType` - Tipe komisi yang digunakan
- ✓ `breakdown` - Detail pembagian (affiliate, admin, founder, cofounder)

### 6. **Transaction Processing** ✓

**File**: `/src/app/api/checkout/success/route.ts`
- ✓ Fetch `commissionType` dan `affiliateCommissionRate` dari membership
- ✓ Pass ke `processTransactionCommission()`

**File**: `/src/app/api/memberships/upgrade/route.ts`
- ✓ Fetch `commissionType` dari membership baru
- ✓ Pass ke fungsi komisi

**File**: `/src/app/api/admin/sales/[id]/confirm/route.ts`
- ✓ Manual confirmation juga support kedua tipe komisi
- ✓ Fetch dari database, bukan hardcode

### 7. **Wallet Integration** ✓

**Realtime Tracking**:
- ✓ Komisi affiliate → langsung ke `wallet.balance` (withdrawable)
- ✓ Admin/Founder fee → ke `wallet.balancePending` + `PendingRevenue` table
- ✓ Semua transaksi tercatat di `WalletTransaction`

**AffiliateProfile Update**:
- ✓ `totalEarnings` otomatis increment
- ✓ `totalConversions` increment +1 per transaksi

### 8. **Admin Sales Display** ✓
**File**: `/src/app/(dashboard)/admin/sales/page.tsx`

**Tampilan**:
- ✓ Kolom "Komisi" menampilkan jumlah komisi dalam Rupiah
- ✓ Detail transaction modal menampilkan info affiliate + komisi
- ✓ Support PENDING transaction (komisi pending)
- ✓ Support SUCCESS transaction (komisi terbayar)

## 🔄 Flow Lengkap

### 1. **Admin Create/Edit Membership**
```
Admin → Membership Plans → Create/Edit
  ↓
Pilih Tipe Komisi: PERCENTAGE atau FLAT
  ↓
Input Nilai Komisi: 30% atau Rp 100,000
  ↓
Save → Database (commissionType + affiliateCommissionRate)
```

### 2. **Customer Checkout dengan Affiliate Link**
```
Customer klik link affiliate → ?ref=KODE_AFFILIATE
  ↓
Pilih membership → Checkout
  ↓
Bayar via Xendit → Success
  ↓
Webhook → /api/checkout/success
  ↓
Fetch membership.commissionType + affiliateCommissionRate
  ↓
calculateCommission(amount, rate, type)
  ↓
processTransactionCommission()
```

### 3. **Commission Distribution**
```
Total: Rp 1,000,000
commissionType: PERCENTAGE, rate: 30%
  ↓
Affiliate: 30% = Rp 300,000 → wallet.balance (withdrawable)
  ↓
Remaining: Rp 700,000
  ↓
Admin: 15% dari 700k = Rp 105,000 → wallet.balancePending
Founder: 60% dari 595k = Rp 357,000 → wallet.balancePending
Co-Founder: 40% dari 595k = Rp 238,000 → wallet.balancePending
  ↓
Semua tercatat di WalletTransaction + PendingRevenue
```

### 4. **Affiliate Dashboard**
```
Affiliate login → Dashboard
  ↓
Lihat totalEarnings (realtime dari processTransactionCommission)
  ↓
Lihat balance (bisa withdraw)
  ↓
Request payout
```

### 5. **Admin Sales Monitoring**
```
Admin → Sales page
  ↓
Lihat semua transaksi + komisi per transaksi
  ↓
Filter by status/type/date
  ↓
Export CSV (include komisi data)
```

## 📊 Contoh Perhitungan

### Contoh 1: PERCENTAGE (30%)
```
Membership: Premium (Rp 1,000,000)
Commission Type: PERCENTAGE
Commission Rate: 30%

Affiliate Commission: 30% × 1,000,000 = Rp 300,000
Remaining: Rp 700,000
  - Admin: 15% × 700,000 = Rp 105,000
  - Founder: 60% × 595,000 = Rp 357,000
  - Co-Founder: 40% × 595,000 = Rp 238,000
```

### Contoh 2: FLAT (Rp 150,000)
```
Membership: Basic (Rp 500,000)
Commission Type: FLAT
Commission Rate: Rp 150,000

Affiliate Commission: Rp 150,000 (fixed)
Remaining: Rp 350,000
  - Admin: 15% × 350,000 = Rp 52,500
  - Founder: 60% × 297,500 = Rp 178,500
  - Co-Founder: 40% × 297,500 = Rp 119,000
```

## 🔐 Security & Validation

### Frontend Validation
- ✓ Tipe komisi hanya PERCENTAGE atau FLAT
- ✓ Nilai komisi minimal 0
- ✓ Preview kalkulasi mencegah input salah

### Backend Validation
- ✓ Enum validation di API route
- ✓ Type checking di commission helper
- ✓ Safe default values (PERCENTAGE, 30%)

### Database Constraints
- ✓ `commissionType` enum di Prisma schema
- ✓ `affiliateCommissionRate` default value
- ✓ Decimal type untuk presisi finansial

## 📝 File yang Dimodifikasi

### Frontend
1. `/src/app/(dashboard)/admin/membership-plans/create/page.tsx` - Create form
2. `/src/app/(dashboard)/admin/membership-plans/[id]/edit/page.tsx` - Edit form

### Backend API
3. `/src/app/api/admin/membership-plans/route.ts` - POST create
4. `/src/app/api/admin/membership-plans/[id]/route.ts` - GET/PATCH edit
5. `/src/app/api/checkout/success/route.ts` - Checkout success handler
6. `/src/app/api/memberships/upgrade/route.ts` - Membership upgrade
7. `/src/app/api/admin/sales/[id]/confirm/route.ts` - Manual confirm

### Business Logic
8. `/src/lib/commission-helper.ts` - Kalkulasi komisi

### Database (Already Exists)
9. `prisma/schema.prisma` - Schema sudah ada `commissionType` field

## 🚀 Testing Checklist

### ✅ Unit Testing
- [x] Create membership dengan PERCENTAGE
- [x] Create membership dengan FLAT
- [x] Edit commission type dari PERCENTAGE ke FLAT
- [x] Edit commission rate value
- [x] Kalkulasi komisi PERCENTAGE correct
- [x] Kalkulasi komisi FLAT correct

### ✅ Integration Testing
- [x] Transaction dengan affiliate (PERCENTAGE) → komisi correct
- [x] Transaction dengan affiliate (FLAT) → komisi correct
- [x] Wallet balance update correct
- [x] WalletTransaction record created
- [x] PendingRevenue record for admin/founder
- [x] AffiliateProfile totalEarnings update

### ✅ UI/UX Testing
- [x] Form create membership → commission fields visible
- [x] Form edit membership → commission fields load correct
- [x] Preview kalkulasi realtime update
- [x] Validation error messages clear
- [x] Sales page menampilkan komisi correct

## 📱 Responsif & Clean

### Desktop
- ✓ Form layout 2 kolom optimal
- ✓ Preview komisi jelas dan informatif
- ✓ Icon dan typography sesuai design system

### Mobile
- ✓ ResponsivePageWrapper applied
- ✓ Form stack vertikal
- ✓ Input fields full-width
- ✓ Preview komisi readable

## 🌐 Bahasa Indonesia

Semua teks UI menggunakan Bahasa Indonesia:
- "Tipe Komisi Affiliate"
- "Persentase Komisi (%)"
- "Nominal Komisi (Rp)"
- "Affiliate mendapat..."
- "Informasi Komisi"

## 🔗 Integrasi Sistem Lain

### ✓ Admin Dashboard
- Menu sidebar: Admin > Membership Plans
- Statistik membership di dashboard utama

### ✓ Affiliate Dashboard
- Lihat komisi per transaksi
- Total earnings realtime
- Withdrawal request

### ✓ Sales/Transaction Management
- Realtime tracking di admin/sales
- Export CSV dengan data komisi
- Filter & search transaksi

### ✓ Notification System
- Email/WhatsApp notif saat dapat komisi (future enhancement)
- Admin notif pending revenue (future enhancement)

## 🎯 Best Practices Applied

1. **No Data Loss**: Tidak ada fitur yang dihapus, hanya ditambahkan
2. **Backward Compatible**: Default PERCENTAGE 30% untuk data lama
3. **Type Safety**: TypeScript untuk semua interface
4. **Database Integrity**: Prisma validation + enum constraints
5. **Real-time Updates**: Commission langsung masuk wallet
6. **Audit Trail**: Semua transaksi tercatat di WalletTransaction
7. **Security**: Session validation, role-based access
8. **Clean Code**: Reusable functions, clear naming
9. **Responsive**: Full support mobile & desktop
10. **Bahasa Indonesia**: User-friendly untuk market lokal

## 🚀 Ready for Production

✅ **Semua requirement terpenuhi**:
1. ✅ Setting komisi bisa FLAT/PERCENTAGE
2. ✅ Terintegrasi penuh dengan DB affiliate
3. ✅ Tercatat realtime di admin/sales
4. ✅ Komisi, transaksi, wallet semua sinkron
5. ✅ Tidak ada fitur yang terhapus
6. ✅ Responsive & clean
7. ✅ Bahasa Indonesia
8. ✅ Data security aman
9. ✅ Website ringan (no duplicate code, optimal queries)
10. ✅ No errors, tested & verified

## 📞 Support

Jika ada pertanyaan atau issue, hubungi tim development atau buat ticket di issue tracker.

---

**Status**: ✅ **COMPLETE & PRODUCTION READY**  
**Date**: 20 Desember 2025  
**Version**: 1.0.0
