# Sistem Upgrade Membership - Dokumentasi Lengkap

**Tanggal:** 3 Januari 2026  
**Status:** ✅ Production Ready  
**Commit:** `55a7d48f8`

---

## 📋 Ringkasan Fitur

Sistem upgrade membership yang memungkinkan user upgrade dari paket aktif ke paket lebih tinggi dengan kalkulasi prorata otomatis (kecuali upgrade ke Lifetime).

### Fitur Utama:
- ✅ Kalkulasi prorata untuk upgrade non-Lifetime
- ✅ Upgrade ke Lifetime selalu harga penuh (no discount)
- ✅ Visual highlight paket aktif di pricing page
- ✅ Flow konfirmasi ala WatZap (stepper UI)
- ✅ Side-by-side comparison paket lama vs baru
- ✅ Integrasi penuh dengan sistem pembayaran existing

---

## 🎯 Business Logic

### Kalkulasi Upgrade (Non-Lifetime)

```typescript
// Hitung sisa hari aktif
const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

// Hitung total hari paket lama
const totalDays = durationType === 'YEAR' 
  ? duration * 365
  : durationType === 'MONTH'
    ? duration * 30
    : duration

// Hitung nilai sisa (prorata)
const remainingValue = (currentPrice / totalDays) * remainingDays

// Harga upgrade = harga paket baru - nilai sisa
const upgradePrice = targetPrice - remainingValue
```

### Upgrade ke Lifetime

```typescript
// Lifetime SELALU harga penuh
const upgradePrice = lifetimePrice // No discount
const message = "Upgrade ke Lifetime selalu harga penuh, sisa masa aktif tidak dihitung"
```

### Contoh Kalkulasi

**Skenario 1: Upgrade 6 bulan → 12 bulan**
- Paket lama: 6 bulan (180 hari), harga Rp 1.000.000
- Sudah jalan: 2 bulan (60 hari)
- Sisa: 4 bulan (120 hari)
- Paket baru: 12 bulan, harga Rp 1.800.000

```
Nilai sisa = (1.000.000 / 180) × 120 = Rp 666.667
Harga upgrade = 1.800.000 - 666.667 = Rp 1.133.333
Hemat = Rp 666.667
```

**Skenario 2: Upgrade 6/12 bulan → Lifetime**
- Paket lama: Apapun
- Sisa: Berapa hari pun
- Paket Lifetime: Rp 2.500.000

```
Harga upgrade = Rp 2.500.000 (full price)
Diskon prorata = Rp 0
Info: "Upgrade ke Lifetime selalu harga penuh"
```

---

## 🛠️ Komponen & File

### 1. API Endpoints

#### `/api/membership/calculate-upgrade` (POST)
**Fungsi:** Menghitung harga upgrade dengan prorata

**Request Body:**
```json
{
  "targetPackageId": "mem_12bulan_ekspor"
}
```

**Response:**
```json
{
  "canUpgrade": true,
  "isNewPurchase": false,
  "isLifetimeUpgrade": false,
  "currentPackage": {
    "id": "...",
    "name": "Paket 6 Bulan",
    "price": 1000000,
    "durationType": "MONTH",
    "duration": 6,
    "endDate": "2026-07-03",
    "remainingDays": 120
  },
  "targetPackage": {
    "id": "...",
    "name": "Paket 12 Bulan",
    "price": 1800000,
    "durationType": "MONTH",
    "duration": 12
  },
  "upgradePrice": 1133333,
  "discount": 666667,
  "remainingValue": 666667,
  "remainingDays": 120,
  "message": "Hemat Rp 666.667 dari sisa 120 hari paket aktif"
}
```

**Error Cases:**
- User belum punya membership → `isNewPurchase: true`
- Paket sudah sama → `canUpgrade: false, error: "Anda sudah memiliki paket ini"`
- Paket aktif Lifetime → `canUpgrade: false, error: "Paket Lifetime tidak dapat diupgrade"`

---

#### `/api/membership/upgrade` (POST)
**Fungsi:** Proses upgrade dan create transaction

**Request Body:**
```json
{
  "targetPackageId": "mem_12bulan_ekspor",
  "affiliateCode": "optional",
  "couponCode": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "UPG-1735912345-ABC123",
    "amount": 1133333,
    "status": "PENDING"
  },
  "checkoutUrl": "/checkout/membership/paket-12-bulan?transaction=UPG-...&upgrade=true"
}
```

**Transaction Metadata:**
```json
{
  "isUpgrade": true,
  "previousMembershipId": "mem_6bulan_ekspor",
  "discountFromProrata": 666667,
  "isLifetimeUpgrade": false
}
```

---

### 2. Pages

#### `/dashboard/upgrade/confirm` (New)
**File:** `src/app/(dashboard)/dashboard/upgrade/confirm/page.tsx`

**Features:**
- Progress stepper (4 langkah)
- Side-by-side comparison paket lama vs baru
- Tampilkan sisa masa aktif
- Kalkulasi prorata real-time
- Warning khusus upgrade Lifetime
- Ringkasan pembayaran
- Tombol konfirmasi ke pembayaran

**Query Params:**
- `package`: ID paket target (required)

**Flow:**
1. Load dengan package ID dari URL
2. Call `/api/membership/calculate-upgrade`
3. Tampilkan comparison & kalkulasi
4. User klik "Lanjut ke Pembayaran"
5. Call `/api/membership/upgrade`
6. Redirect ke checkout URL

---

#### `/dashboard/pricing` (Updated)
**File:** `src/app/(dashboard)/pricing/page.tsx`

**Changes:**
- Fetch current membership di `useEffect`
- Highlight paket aktif (green border + badge)
- Tombol "Paket Aktif" (disabled) untuk current package
- Tombol "Upgrade Sekarang" (blue gradient) untuk paket lain
- Redirect ke `/dashboard/upgrade/confirm` jika ada current membership

**New Functions:**
```typescript
isCurrentPackage(pkgId: string): boolean
canUpgrade(pkg: MembershipPackage): boolean
getCheckoutUrl(pkg: MembershipPackage): string // Smart routing
```

---

### 3. Database Schema

**Tidak ada perubahan schema** - menggunakan existing:

```prisma
model UserMembership {
  id            String
  userId        String
  membershipId  String
  startDate     DateTime
  endDate       DateTime
  isActive      Boolean
  price         Decimal?
  transactionId String?
  // ... existing fields
}

model Transaction {
  id       String
  userId   String
  type     String // "MEMBERSHIP"
  membershipId String?
  amount   Decimal
  status   String
  metadata Json? // Contains upgrade info
  // ... existing fields
}
```

---

## 🎨 UI/UX Flow

### Pricing Page

```
┌─────────────────────────────────────────────────┐
│  [Badge: Special Pricing]                       │
│  Upgrade Membership Anda                        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 6 Bulan  │  │ 12 Bulan │  │ Lifetime │      │
│  │          │  │ [CURRENT]│  │          │      │
│  │ Rp 1.0jt │  │ Rp 1.8jt │  │ Rp 2.5jt │      │
│  │          │  │          │  │          │      │
│  │ [Upgrade]│  │[✓ Aktif] │  │ [Upgrade]│      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

### Upgrade Confirm Page

```
┌─────────────────────────────────────────────────┐
│  [Progress: Pilih Paket → ● Konfirmasi → ... ] │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Paket Saat Ini │  │  Paket Baru     │      │
│  ├─────────────────┤  ├─────────────────┤      │
│  │ 12 Bulan        │  │ Lifetime        │      │
│  │ Rp 1.800.000    │  │ Rp 2.500.000    │      │
│  │ Berakhir:       │  │ Selamanya       │      │
│  │ 3 Jul 2026      │  │                 │      │
│  │ Sisa: 120 hari  │  │                 │      │
│  │ Nilai: 666k     │  │                 │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                  │
│  [Warning: Upgrade ke Lifetime selalu harga     │
│   penuh, sisa masa aktif tidak dihitung]        │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Ringkasan Pembayaran                    │   │
│  │ Harga Lifetime:         Rp 2.500.000    │   │
│  │ Diskon Prorata:         -               │   │
│  │ ────────────────────────────────────    │   │
│  │ Total Bayar:           Rp 2.500.000    │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [Kembali]  [Lanjut ke Pembayaran →]           │
└─────────────────────────────────────────────────┘
```

---

## 🔒 Validasi & Error Handling

### Backend Validation

```typescript
// Cannot upgrade if already Lifetime
if (currentMembership?.membership.durationType === 'LIFETIME') {
  return { error: 'Paket Lifetime tidak dapat diupgrade' }
}

// Cannot upgrade to same package
if (currentPackage.id === targetPackage.id) {
  return { error: 'Anda sudah memiliki paket ini' }
}

// Ensure upgrade price >= 0
upgradePrice = Math.max(0, targetPrice - remainingValue)
```

### Frontend Validation

```typescript
// Disable current package button
{isCurrent && (
  <Button disabled>Paket Aktif</Button>
)}

// Show upgrade button only if eligible
{canUpgrade(pkg) && (
  <Button>Upgrade Sekarang</Button>
)}
```

---

## 📊 Testing Scenarios

### Test Case 1: Normal Upgrade (6 → 12 bulan)
**Setup:**
- User punya paket 6 bulan
- Sudah jalan 2 bulan (sisa 4 bulan)

**Expected:**
- `canUpgrade: true`
- `upgradePrice: ~1.133.333`
- `discount: ~666.667`
- Message: "Hemat Rp 666.667..."

---

### Test Case 2: Upgrade to Lifetime
**Setup:**
- User punya paket 12 bulan
- Sisa 10 bulan

**Expected:**
- `canUpgrade: true`
- `isLifetimeUpgrade: true`
- `upgradePrice: [full lifetime price]`
- `discount: 0`
- Message: "Upgrade ke Lifetime selalu harga penuh..."

---

### Test Case 3: Already Lifetime
**Setup:**
- User punya paket Lifetime

**Expected:**
- `canUpgrade: false`
- Error: "Paket Lifetime tidak dapat diupgrade"
- Semua tombol upgrade disabled

---

### Test Case 4: No Current Membership
**Setup:**
- User belum punya membership

**Expected:**
- `isNewPurchase: true`
- `upgradePrice: [full price]`
- Redirect ke checkout biasa, bukan upgrade confirm

---

## 🚀 Deployment Checklist

- [x] API endpoints tested locally
- [x] UI/UX tested di browser
- [x] Database queries optimized
- [x] Error handling comprehensive
- [x] TypeScript types complete
- [x] Responsive mobile design
- [x] Git committed & pushed
- [ ] Vercel auto-deploy (in progress)
- [ ] Test di production URL
- [ ] Monitor transaction logs

---

## 🔗 Integration Points

### Existing Systems
- **Transaction System:** Upgrade creates transaction dengan metadata khusus
- **Payment Gateway:** Menggunakan checkout flow existing
- **Commission System:** Transaction upgrade tetap eligible untuk komisi affiliate
- **Email Notifications:** Auto-send setelah upgrade berhasil

### Future Enhancements
- [ ] Upgrade history page
- [ ] Downgrade option (dengan refund policy)
- [ ] Auto-renewal dengan auto-upgrade
- [ ] Promo khusus upgrade (flash sale)
- [ ] Analytics dashboard upgrade conversion

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: User tidak lihat tombol upgrade?**
A: Pastikan user sudah login dan punya membership aktif.

**Q: Kalkulasi prorata salah?**
A: Cek `endDate` di database, pastikan tidak expired.

**Q: Upgrade ke Lifetime dapat diskon?**
A: Tidak, by design. Lifetime selalu full price.

**Q: Transaction tidak terbuat?**
A: Check console log `/api/membership/upgrade`, pastikan tidak ada error DB.

---

## 📝 Developer Notes

### Code Quality
- ✅ Full TypeScript typing
- ✅ Error handling di semua API
- ✅ Prisma transactions untuk data consistency
- ✅ Reusable components
- ✅ Clean code & comments

### Performance
- Kalkulasi di server-side (accurate & secure)
- Real-time fetch current membership
- Optimized Prisma queries
- Minimal re-renders

### Security
- Session-based authentication
- Server-side validation
- No hardcoded prices in frontend
- Transaction metadata encrypted

---

**Status:** ✅ PRODUCTION READY  
**Author:** GitHub Copilot AI  
**Review:** Pending user testing
