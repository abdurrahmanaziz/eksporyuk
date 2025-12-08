# 🛒 Sistem Checkout Membership - Style Dibales.ai

## 📋 Overview

Sistem checkout membership telah diubah dari **multiple pricing selection** menjadi **single selection dengan benefit per paket** - mengikuti referensi dari dibales.ai.

**Perubahan Utama:**
- ✅ User pilih 1 durasi saja (radio button style)
- ✅ Setiap paket punya benefits sendiri
- ✅ Badge "Paling Laris" per paket (bukan global)
- ✅ Badge custom per paket (contoh: "Hemat 10%", "Hemat 25%")
- ✅ Harga per bulan otomatis dihitung
- ✅ Single checkout page dengan clean UI

---

## 🎨 Fitur Baru

### 1. **Admin: Pricing Configuration**

Field per pricing option:
```typescript
{
  duration: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME'
  label: string              // "1 Bulan", "3 Bulan", dst
  price: number              // Harga paket
  discount?: number          // Diskon persen (optional)
  pricePerMonth?: number     // Auto-calculated
  benefits: string[]         // List benefit
  badge?: string             // "Hemat 10%", dst
  isPopular?: boolean        // Badge "Paling Laris"
}
```

**Contoh Konfigurasi:**

**Paket 1 Bulan:**
- Label: "1 Bulan"
- Price: Rp 179.000
- Benefits:
  - Akses grup VIP
  - Akses 5 kelas
  - Email support

**Paket 6 Bulan:**
- Label: "6 Bulan"
- Price: Rp 688.333
- Badge: "Hemat 35%"
- isPopular: true ✓
- Benefits:
  - Akses semua grup
  - Akses semua kelas
  - WhatsApp support
  - Bonus ebook

### 2. **Checkout Page (`/checkout/[slug]`)**

**URL Format:**
```
https://eksporyuk.com/checkout/pro
https://eksporyuk.com/checkout/gold-membership
```

**Layout:**
- **Kiri:** Form data diri + kupon
- **Kanan:** Pilihan paket + ringkasan

**Flow untuk User Belum Login:**
1. User isi form registrasi:
   - Nama lengkap
   - Email
   - Nomor WhatsApp
   - Password
2. Pilih durasi paket
3. Apply kupon (optional)
4. Klik "Beli - Rp XXX"
5. Auto register → auto login → redirect ke payment

**Flow untuk User Sudah Login:**
1. Data user sudah terisi otomatis
2. Pilih durasi paket
3. Apply kupon (optional)
4. Klik "Beli - Rp XXX"
5. Redirect ke payment

### 3. **Kupon System**

**Auto-apply dari Cookie:**
- Jika user datang dari link affiliate
- Cookie `affiliate_code=XXX` otomatis detect
- Kupon langsung diterapkan saat page load

**Manual Apply:**
- User input kode kupon
- Klik "Terapkan"
- Validasi via API
- Tampilkan diskon jika valid

**Validasi Kupon:**
- Check expired
- Check usage limit
- Check applicable to membership
- Calculate discount (percentage/fixed)

---

## 🔄 API Endpoints

### 1. **GET `/api/membership-plans/[slug]`**

Fetch membership plan detail untuk checkout.

**Response:**
```json
{
  "plan": {
    "id": "cm123",
    "name": "Gold Membership",
    "slug": "gold-membership",
    "description": "Paket lengkap untuk eksportir",
    "formLogo": "https://...",
    "formBanner": "https://...",
    "prices": [
      {
        "duration": "ONE_MONTH",
        "label": "1 Bulan",
        "price": 179000,
        "pricePerMonth": 179000,
        "benefits": ["Akses grup VIP", "5 kelas"],
        "badge": "",
        "isPopular": false
      },
      {
        "duration": "SIX_MONTHS",
        "label": "6 Bulan",
        "price": 688333,
        "pricePerMonth": 114722,
        "benefits": ["Semua grup", "Semua kelas", "Bonus ebook"],
        "badge": "Hemat 35%",
        "isPopular": true
      }
    ],
    "salespage": "https://...",
    "affiliateCommission": 0.30
  }
}
```

### 2. **POST `/api/coupons/validate`**

Validate kupon untuk checkout.

**Request:**
```json
{
  "code": "DINDA20",
  "planId": "cm123"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "coupon": {
    "code": "DINDA20",
    "discountType": "PERCENTAGE",
    "discountValue": 20
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Kupon tidak berlaku untuk paket ini"
}
```

### 3. **POST `/api/checkout/membership`**

Process checkout membership.

**Request:**
```json
{
  "planId": "cm123",
  "priceOption": {
    "duration": "SIX_MONTHS",
    "label": "6 Bulan",
    "price": 688333,
    "benefits": [...]
  },
  "couponCode": "DINDA20",
  "finalPrice": 550666
}
```

**Response:**
```json
{
  "success": true,
  "saleId": "sale_123",
  "paymentUrl": "https://checkout.xendit.co/...",
  "amount": 550666
}
```

**Logic:**
1. Check user already has active membership
2. Validate coupon (if provided)
3. Create sale record (status: PENDING)
4. Generate Xendit invoice
5. Return payment URL
6. Create activity log

---

## 💾 Database Structure

**Field yang Digunakan:**

**Table: `memberships`**
```
features (JSON) → Stores prices array
reminders (JSON) → Stores followUpMessages
formLogo → Logo paket
formBanner → Banner paket
salesPageUrl → External salespage
affiliateCommissionRate → Komisi affiliate
isActive → Status paket
```

**Table: `sales`**
```
userId → Pembeli
productType → 'MEMBERSHIP'
productId → membershipId
amount → Final price setelah diskon
status → 'PENDING', 'SUCCESS', 'FAILED'
couponCode → Kupon yang digunakan
affiliateId → Affiliate yang refer (from coupon)
metadata (JSON) → {priceOption, originalPrice, discount}
```

**Table: `user_memberships`**
```
userId → User yang beli
membershipId → Paket yang dibeli
startDate → Tanggal aktif
endDate → Tanggal expired
status → 'ACTIVE', 'EXPIRED', 'CANCELLED'
```

---

## 🎨 UI Components

### **Checkout Page Layout**

```
┌─────────────────────────────────────────────────┐
│            [Logo]  Checkout Pro                 │
└─────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────┐
│  ISI DATA DIRI       │  PILIH DURASI            │
│                      │                          │
│  [Nama]              │  ○ 1 Bulan               │
│  [Email]             │    Rp 179.000            │
│  [WhatsApp]          │    • Akses grup VIP      │
│  [Password]          │    • 5 kelas             │
│                      │                          │
│  ─────────────────   │  ● 6 Bulan [PALING LARIS]│
│                      │    Rp 688.333 Hemat 35%  │
│  PUNYA KUPON?        │    Rp 114.722 / bln      │
│                      │    • Semua grup          │
│  [DINDA20]  [Terapkan]│   • Semua kelas         │
│                      │    • Bonus ebook         │
│  ✓ Kupon diterapkan  │                          │
│    Diskon 20%        │  ─────────────────────   │
│                      │                          │
│                      │  RINGKASAN               │
│                      │  Paket: 6 Bulan          │
│                      │  Harga: Rp 688.333       │
│                      │  Diskon: -35%            │
│                      │  Kupon: -20%             │
│                      │  ─────────────────────   │
│                      │  Total: Rp 550.666       │
│                      │                          │
│                      │  [Beli - Rp 550.666]     │
└──────────────────────┴──────────────────────────┘
```

---

## 🧪 Testing Checklist

**Admin Panel:**
- [ ] Buat membership plan baru
- [ ] Tambah 3 pricing options dengan benefits berbeda
- [ ] Set "Paling Laris" pada paket 6 bulan
- [ ] Set badge "Hemat 25%" pada paket 12 bulan
- [ ] Save dan check pricePerMonth auto-calculated

**Checkout Page (Not Logged In):**
- [ ] Akses `/checkout/[slug]`
- [ ] Form registrasi muncul
- [ ] Pilih paket 6 bulan
- [ ] Benefits paket 6 bulan muncul
- [ ] Apply kupon → diskon terapkan
- [ ] Total harga benar
- [ ] Klik "Beli" → auto register → redirect payment

**Checkout Page (Logged In):**
- [ ] Data user terisi otomatis
- [ ] Button "Ganti Akun" berfungsi
- [ ] Apply kupon dari affiliate cookie
- [ ] Checkout langsung tanpa register

**Coupon System:**
- [ ] Affiliate cookie auto-detect
- [ ] Manual input kupon valid
- [ ] Kupon expired/invalid ditolak
- [ ] Diskon percentage calculated correctly
- [ ] Diskon fixed calculated correctly

**Payment Flow:**
- [ ] Sale record created (status: PENDING)
- [ ] Activity log tercatat
- [ ] Redirect ke payment URL
- [ ] Webhook activate membership (TODO)

---

## 🚀 Next Steps

**Yang Sudah Selesai:**
- ✅ Admin pricing configuration dengan benefits
- ✅ Checkout page dengan single selection
- ✅ Kupon validation & auto-apply
- ✅ Registration flow
- ✅ Sale record creation
- ✅ Activity logging

**Yang Perlu Dilakukan:**
- [ ] Xendit integration (generate real invoice)
- [ ] Webhook handler untuk payment success
- [ ] Auto-activate membership setelah payment
- [ ] Auto-join groups/courses/products
- [ ] Follow-up WhatsApp trigger
- [ ] Email notification (invoice, aktivasi)
- [ ] Admin sales dashboard
- [ ] Affiliate commission split
- [ ] Founder/Co-Founder revenue split

---

## 📝 Catatan Penting

**Perbedaan dengan Sistem Lama:**

| Fitur | Sistem Lama | Sistem Baru (Dibales.ai Style) |
|-------|-------------|-------------------------------|
| Selection | Multiple checkbox | Single radio button |
| Benefits | Global untuk semua paket | Per paket |
| Badge "Paling Laris" | Global toggle | Per paket |
| Harga per bulan | Manual input | Auto-calculated |
| Checkout UI | Table comparison | Card selection |
| Badge custom | Tidak ada | Ada (per paket) |

**Field Migration:**

Sistem lama menggunakan `isPopular` boolean di membership table.
Sistem baru menyimpan `isPopular` per pricing option dalam JSON `features`.

Data existing tetap aman karena kita hanya:
- **Menambah** field baru di JSON
- **Tidak menghapus** field lama
- **Update mode**, bukan replace

---

## 🔗 Links

- Admin Membership Plans: `/admin/membership-plans`
- Checkout Page: `/checkout/[slug]`
- API Docs: `/api/membership-plans/[slug]`
- Coupon Validation: `/api/coupons/validate`
- Checkout API: `/api/checkout/membership`

---

**Last Updated:** 23 November 2025
**Version:** v5.3.1 (Checkout System - Dibales.ai Style)
**Status:** ✅ Ready for Testing
