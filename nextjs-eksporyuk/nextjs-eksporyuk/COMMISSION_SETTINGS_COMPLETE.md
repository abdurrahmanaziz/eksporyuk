# Commission Settings System - Complete Guide

## 🎯 Overview

Sistem komisi Eksporyuk sekarang memiliki **interface admin yang powerful** untuk mengubah commission type dan rate secara **otomatis dan real-time** terintegrasi langsung dengan database.

**Status: ✅ FULLY IMPLEMENTED**

---

## 📊 Commission Types

### 1. **FLAT Commission** (Komisi Tetap)
Komisi dalam jumlah **Rupiah tetap** untuk setiap transaksi, terlepas dari harga jual.

**Contoh:**
```
Membership Lifetime: Rp 2,000,000
Commission: FLAT Rp 325,000
├─ Transaksi 1: Rp 2,000,000 → Komisi Rp 325,000
├─ Transaksi 2: Rp 2,000,000 → Komisi Rp 325,000
└─ Transaksi 3: Rp 2,000,000 → Komisi Rp 325,000
```

**Keuntungan:**
- Income yang predictable
- Mudah diatur
- Cocok untuk produk dengan harga tetap

---

### 2. **PERCENTAGE Commission** (Komisi Persen)
Komisi dalam **persentase** dari total harga jual.

**Contoh:**
```
Membership dengan harga bervariasi
Commission: PERCENTAGE 20%
├─ Transaksi 1: Rp 1,000,000 × 20% = Rp 200,000
├─ Transaksi 2: Rp 2,000,000 × 20% = Rp 400,000
└─ Transaksi 3: Rp 1,500,000 × 20% = Rp 300,000
```

**Keuntungan:**
- Scalable dengan harga produk
- Fair untuk berbagai price point
- Cocok untuk produk dengan promo/discount

---

## 🔄 Auto-Conversion System

Ketika Anda mengubah commission type, sistem **otomatis mengkonversi** rate ke equivalen value:

### FLAT → PERCENTAGE
```
Membership Price: Rp 2,000,000
Current: FLAT Rp 400,000
Auto-Convert to PERCENTAGE:
  Rp 400,000 ÷ Rp 2,000,000 × 100% = 20%
```

### PERCENTAGE → FLAT
```
Membership Price: Rp 2,000,000
Current: PERCENTAGE 20%
Auto-Convert to FLAT:
  Rp 2,000,000 × 20% ÷ 100 = Rp 400,000
```

---

## 🛠️ How to Use - Step by Step

### **Method 1: Admin Dashboard UI (Recommended)**

1. **Navigate to Commission Settings:**
   ```
   http://localhost:3000/admin/commission-settings
   ```

2. **View Current Settings:**
   - See all memberships and products
   - View current commission types and rates
   - See statistics (FLAT vs PERCENTAGE count)

3. **Edit Commission:**
   - Click **Edit** button pada item yang ingin diubah
   - Select commission type (FLAT or PERCENTAGE)
   - Enter rate value:
     - FLAT: masukkan nilai Rupiah (misal: 325000)
     - PERCENTAGE: masukkan nilai persen (misal: 20)
   - Lihat **suggested rates** untuk reference:
     - 10% (conservative)
     - 20% (moderate)
     - 30% (aggressive)
   - Click **Save**

4. **Validasi Otomatis:**
   - ✅ Sistem validasi mencegah error:
     - PERCENTAGE tidak bisa > 100%
     - FLAT tidak bisa > harga produk
   - ✅ Conversion rate ditampilkan
   - ✅ Changes langsung ke database

---

### **Method 2: API Endpoint**

#### Single Update

**Endpoint:**
```
POST /api/admin/commission/update
```

**Payload - Change Membership to PERCENTAGE:**
```json
{
  "membershipId": "membership-lifetime-id",
  "commissionType": "PERCENTAGE",
  "affiliateCommissionRate": 20
}
```

**Payload - Change Product to FLAT:**
```json
{
  "productId": "product-id",
  "commissionType": "FLAT",
  "affiliateCommissionRate": 325000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Commission updated successfully for Paket Lifetime",
  "data": {
    "type": "membership",
    "item": {
      "id": "...",
      "title": "Paket Lifetime",
      "price": 2000000,
      "commissionType": "PERCENTAGE",
      "affiliateCommissionRate": 20
    },
    "previousCommissionType": "FLAT",
    "previousCommissionRate": 325000
  }
}
```

---

#### Bulk Update

**Endpoint:**
```
PUT /api/admin/commission/update
```

**Payload - Update all memberships to PERCENTAGE 18%:**
```json
{
  "membershipIds": [
    "membership-lifetime",
    "membership-12-months",
    "membership-6-months"
  ],
  "commissionType": "PERCENTAGE",
  "affiliateCommissionRate": 18
}
```

**Payload - Update all products to FLAT Rp 200,000:**
```json
{
  "productIds": [
    "product-1",
    "product-2",
    "product-3"
  ],
  "commissionType": "FLAT",
  "affiliateCommissionRate": 200000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk commission update completed",
  "results": [
    {
      "type": "memberships",
      "count": 3
    }
  ],
  "settings": {
    "commissionType": "PERCENTAGE",
    "affiliateCommissionRate": 18
  }
}
```

---

#### Fetch Current Settings

**Endpoint:**
```
GET /api/admin/commission/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memberships": [
      {
        "id": "membership-lifetime",
        "title": "Paket Lifetime",
        "price": 2000000,
        "commissionType": "FLAT",
        "affiliateCommissionRate": 325000,
        "equivalentPercentage": "16.25",
        "isActive": true
      },
      // ... more memberships
    ],
    "products": [
      // ... all products
    ],
    "statistics": {
      "memberships": {
        "total": 4,
        "flatCommission": 4,
        "percentageCommission": 0,
        "active": 3,
        "totalValue": 7398000
      },
      "products": {
        "total": 12,
        "flatCommission": 0,
        "percentageCommission": 12,
        "active": 10,
        "totalValue": 15000000
      },
      "combined": {
        "total": 16,
        "flatCommission": 4,
        "percentageCommission": 12,
        "totalValue": 22398000
      }
    }
  }
}
```

---

## 💰 Revenue Distribution Example

Ketika affiliate membuat penjualan dengan commission system yang baru:

**Scenario: Paket Lifetime pembelian dengan PERCENTAGE 20%**

```
Transaction Amount: Rp 2,000,000

1️⃣  Affiliate Commission (langsung ke balance):
    Rp 2,000,000 × 20% = Rp 400,000
    Status: ✅ Langsung withdrawable

2️⃣  Sisa Revenue: Rp 1,600,000
    Dibagi:
    - Admin (15%): Rp 240,000 → balancePending
    - Founder (60%): Rp 960,000 → balancePending
    - Co-Founder (40%): Rp 640,000 → balancePending
    
    Status: ⏳ Butuh approval sebelum withdraw
```

---

## 🧪 Testing

### Run Test Script

```bash
node test-commission-api.js
```

Output akan menampilkan:
- Current commission settings
- API endpoint examples
- Suggested commission rates
- Commission distribution breakdown

---

## ✨ Key Features

### 1. **Real-time Auto-Conversion**
Ketika mengubah commission type, rate otomatis dikonversi ke equivalent value. Tidak perlu hitung manual!

### 2. **Smart Validation**
- ✅ PERCENTAGE tidak bisa > 100%
- ✅ FLAT tidak bisa > product price
- ✅ Display error messages yang jelas

### 3. **Suggested Rates**
UI menampilkan suggested rates berdasarkan product price:
- **Conservative:** 10%
- **Moderate:** 20%
- **Aggressive:** 30%

Klik saja untuk apply!

### 4. **Bulk Operations**
Update multiple items sekaligus dengan satu request API.

### 5. **Live Statistics**
Dashboard menampilkan:
- Total items
- Count by commission type
- Total value

### 6. **Database Integration**
Semua changes langsung disimpan ke database dengan:
- ✅ Atomic transactions
- ✅ Proper error handling
- ✅ Audit trail (updatedAt timestamp)

---

## 📋 Admin Requirements

Untuk mengakses Commission Settings:
1. **Must be logged in as ADMIN**
2. Route: `/admin/commission-settings`
3. Middleware protection di `/src/middleware.ts`

---

## 🔐 Security

Semua endpoint dilindungi dengan:
- ✅ Session validation
- ✅ Role checking (ADMIN only)
- ✅ Input validation
- ✅ Error handling

---

## 📁 Files Created

### New Endpoints
```
src/app/api/admin/commission/
├── update/route.ts          # Update single/bulk commissions
└── settings/route.ts        # Get all commission settings
```

### New Components
```
src/components/admin/
└── CommissionSettingsManager.tsx  # Main UI component
```

### New Pages
```
src/app/(dashboard)/admin/
└── commission-settings/page.tsx   # Commission settings page
```

### New Utilities
```
src/lib/
└── commission-converter.ts        # Conversion & validation functions
```

### Test & Documentation
```
root/
└── test-commission-api.js         # API testing script
```

---

## 💡 Tips & Best Practices

### 1. **Choose the Right Type:**
- Use **FLAT** jika harga produk konsisten
- Use **PERCENTAGE** jika ada variasi harga atau promo

### 2. **Monitor Conversions:**
Selalu cek **equivalent percentage** saat mengedit FLAT commissions.

### 3. **Bulk Updates:**
Gunakan PUT endpoint untuk update multiple items sekaligus, lebih efficient!

### 4. **Validation Messages:**
Baca validation error dengan teliti - sistem akan memandu Anda ke solusi.

---

## 🚀 Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| FLAT Commission | ✅ Active | Rp amount based |
| PERCENTAGE Commission | ✅ Active | % based |
| Auto-Conversion | ✅ Implemented | Real-time conversion |
| UI Dashboard | ✅ Implemented | At `/admin/commission-settings` |
| API Endpoints | ✅ Implemented | POST & PUT methods |
| Database Integration | ✅ Implemented | Automatic persistence |
| Validation | ✅ Implemented | Smart input validation |
| Bulk Operations | ✅ Implemented | Multiple items at once |
| Statistics | ✅ Implemented | Real-time tracking |

---

## ❓ FAQ

**Q: Apakah conversion akan mengubah komisi di transaksi yang sudah ada?**
A: Tidak! Conversion hanya untuk future transactions. Historical transactions tetap sesuai original commission mereka.

**Q: Berapa lama perubahan commission aktif?**
A: Instant! Perubahan langsung apply untuk transaksi berikutnya.

**Q: Bisakah saya set FLAT commission lebih tinggi dari harga produk?**
A: Tidak, sistem akan validasi dan mencegah. Karena tidak masuk akal komisi lebih besar dari produk.

**Q: Apakah ada history/audit trail?**
A: Ya! Setiap update disimpan dengan `updatedAt` timestamp di database.

---

## 📞 Support

Untuk pertanyaan atau issue dengan commission system:
1. Check commission settings di `/admin/commission-settings`
2. Run `test-commission-api.js` untuk verify API
3. Check API response untuk error messages
4. Review database dengan Prisma Studio: `npm run prisma:studio`

---

**Last Updated:** December 31, 2025
**Version:** 1.0 - Complete Implementation