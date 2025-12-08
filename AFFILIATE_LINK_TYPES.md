# Sistem Link Affiliate - 3 Tipe Link

## Overview
Sistem affiliate sekarang mendukung 3 tipe link berbeda:

### 1. **Link Checkout** (Default)
- **URL**: `eksporyuk.com/checkout-unified?ref=CODE&package=ID&coupon=CODE`
- **Fungsi**: Langsung ke halaman pembayaran
- **Tracking**: Cookie `affiliate_ref` di-set saat klik
- **Use Case**: Untuk audience yang sudah tau mau beli

### 2. **Link Salespage Internal**
- **URL**: 
  - Product: `eksporyuk.com/products/[id]?ref=CODE&coupon=CODE`
  - Membership: `eksporyuk.com/membership?ref=CODE&package=ID&coupon=CODE`
- **Fungsi**: Mengarah ke salespage di dalam domain eksporyuk.com
- **Tracking**: Cookie `affiliate_ref` di-set saat klik
- **Use Case**: Untuk audience yang perlu lihat detail produk dulu

### 3. **Link Salespage Eksternal**
- **URL**: `eksporyuk.com/api/redirect/CODE?to=EXTERNAL_URL&coupon=CODE`
- **Fungsi**: Redirect ke salespage eksternal (contoh: kelaseksporyuk.com) dengan tracking cookies
- **Tracking**: 
  - Cookie `affiliate_ref` di-set **sebelum redirect**
  - Cookie `affiliate_coupon` di-set untuk auto-apply
  - Ketika user dari kelaseksporyuk.com klik "Daftar", akan kembali ke eksporyuk.com dengan cookies sudah tersimpan
- **Use Case**: Untuk salespage khusus di domain terpisah tapi tetap track affiliate

---

## Cara Setup External Salespage URL

### Di Database (Manual via Prisma Studio)
1. Buka Prisma Studio: `npx prisma studio`
2. Pilih tabel **Product** atau **Membership**
3. Edit record yang ingin ditambah external salespage
4. Isi field **externalSalesUrl** dengan URL eksternal
   - Contoh: `https://kelaseksporyuk.com/landing-membership-premium`
   - Contoh: `https://kelaseksporyuk.com/produk-ebook-ekspor`

### Di Admin Panel (TODO: Belum diimplementasi)
Nanti di halaman Edit Product/Membership, tambahkan field:
```tsx
<input
  type="url"
  name="externalSalesUrl"
  placeholder="https://kelaseksporyuk.com/..."
  className="..."
/>
```

---

## Flow User Experience

### Scenario: Affiliate generate link eksternal untuk Membership Premium

1. **Affiliate** buka dashboard `/affiliate/links`
2. Klik **"Generate Link Baru"**
3. Pilih:
   - **Tipe Link**: Salespage Eksternal
   - **Tipe Target**: Membership
   - **Pilih Paket**: Membership Premium (ID: `mem_001`)
   - **Tambah Kupon**: RINA (opsional)
4. Klik **"Generate Link"**

**Link yang dibuat**:
```
https://eksporyuk.com/api/redirect/RIN4XYZ123?to=https://kelaseksporyuk.com/landing-premium&coupon=RINA
```

5. **User** klik link tersebut
6. **Server** `/api/redirect/RIN4XYZ123`:
   - ✅ Validasi affiliate link masih aktif
   - ✅ Record click ke database (AffiliateClick)
   - ✅ Update counter `clicks` di AffiliateLink
   - ✅ Set cookie `affiliate_ref = RIN4XYZ123` (30 hari)
   - ✅ Set cookie `affiliate_coupon = RINA` (30 hari)
   - ↪️ Redirect ke `kelaseksporyuk.com/landing-premium`

7. **User** di kelaseksporyuk.com membaca salespage
8. **User** klik tombol "Daftar Sekarang" di kelaseksporyuk.com
9. Tombol tersebut mengarah ke:
   ```
   https://eksporyuk.com/checkout-unified?package=mem_001
   ```

10. **Checkout page** `/checkout-unified`:
    - ✅ Baca cookie `affiliate_ref` → Dapat kode `RIN4XYZ123`
    - ✅ Baca cookie `affiliate_coupon` → Auto-apply kupon `RINA`
    - ✅ User lihat diskon langsung applied
    - ✅ User bayar → Transaction dibuat dengan `affiliateRef: RIN4XYZ123`

11. **Backend** setelah payment berhasil:
    - ✅ Create `AffiliateConversion` record
    - ✅ Link transaction ke affiliate
    - ✅ Hitung komisi (30% dari transaction.amount)

---

## Database Schema

### AffiliateLink
```prisma
model AffiliateLink {
  id         String            @id @default(cuid())
  userId     String?
  code       String            @unique
  fullUrl    String?
  linkType   AffiliateLinkType @default(CHECKOUT) // NEW FIELD
  
  membershipId String?
  membership   Membership? @relation(...)
  
  productId    String?
  product      Product?    @relation(...)
  
  clicks       Int         @default(0)
  conversions  Int         @default(0)
  isActive     Boolean     @default(true)
  isArchived   Boolean     @default(false)
}

enum AffiliateLinkType {
  CHECKOUT
  SALESPAGE_INTERNAL
  SALESPAGE_EXTERNAL
}
```

### Product & Membership
```prisma
model Product {
  // ... existing fields
  externalSalesUrl String? // NEW FIELD
}

model Membership {
  // ... existing fields
  externalSalesUrl String? // NEW FIELD
}
```

---

## API Endpoints

### POST /api/affiliate/links
**Generate new affiliate link**

Request:
```json
{
  "linkType": "SALESPAGE_EXTERNAL",
  "targetType": "membership",
  "targetId": "mem_001",
  "couponCode": "RINA"
}
```

Response:
```json
{
  "link": {
    "id": "link_123",
    "code": "RIN4XYZ123",
    "url": "https://eksporyuk.com/api/redirect/RIN4XYZ123?to=https://kelaseksporyuk.com/...",
    "linkType": "SALESPAGE_EXTERNAL",
    "clicks": 0,
    "conversions": 0,
    "revenue": 0,
    "createdAt": "2024-11-19T10:00:00Z"
  }
}
```

### GET /api/redirect/[code]
**Track click and redirect to external salespage**

Query params:
- `to` (required): Target external URL
- `coupon` (optional): Coupon code to auto-apply

Actions:
1. Find affiliate link by code
2. Validate link is active
3. Record click (AffiliateClick)
4. Increment clicks counter
5. Set cookies:
   - `affiliate_ref` (httpOnly, 30 days)
   - `affiliate_coupon` (30 days, JS accessible)
6. Redirect to external URL

---

## Conversion Tracking di Checkout

Di `/checkout-unified/page.tsx`, tambahkan logic:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'

export default function CheckoutPage() {
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null)
  const [affiliateCoupon, setAffiliateCoupon] = useState<string | null>(null)
  
  useEffect(() => {
    // Read affiliate cookies
    const ref = Cookies.get('affiliate_ref')
    const coupon = Cookies.get('affiliate_coupon')
    
    if (ref) {
      setAffiliateRef(ref)
      console.log('Affiliate ref:', ref)
    }
    
    if (coupon) {
      setAffiliateCoupon(coupon)
      // Auto-apply coupon
      applyCoupon(coupon)
    }
  }, [])
  
  const handlePayment = async (formData) => {
    const response = await fetch('/api/transactions/create', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        affiliateRef, // Pass affiliate ref
      })
    })
  }
}
```

Backend di `/api/transactions/create`:
```typescript
// After payment success
if (affiliateRef) {
  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code: affiliateRef },
    select: { userId: true }
  })
  
  if (affiliateLink?.userId) {
    // Create conversion record
    await prisma.affiliateConversion.create({
      data: {
        affiliateId: affiliateLink.userId,
        transactionId: transaction.id,
        commissionAmount: transaction.amount * 0.30, // 30%
        commissionRate: 0.30,
        paidOut: false
      }
    })
    
    // Update link stats
    await prisma.affiliateLink.update({
      where: { code: affiliateRef },
      data: {
        conversions: { increment: 1 }
      }
    })
  }
}
```

---

## Testing

### Test Link Checkout
```bash
# Generate link
POST /api/affiliate/links
{
  "linkType": "CHECKOUT",
  "targetType": "membership",
  "targetId": "mem_001",
  "couponCode": "RINA"
}

# Expected URL:
https://eksporyuk.com/checkout-unified?ref=RIN4XYZ&package=mem_001&coupon=RINA
```

### Test Link Salespage Internal
```bash
POST /api/affiliate/links
{
  "linkType": "SALESPAGE_INTERNAL",
  "targetType": "product",
  "targetId": "prod_001"
}

# Expected URL:
https://eksporyuk.com/products/prod_001?ref=RIN4XYZ
```

### Test Link Salespage Eksternal
```bash
# 1. Setup external URL di database
UPDATE Membership SET externalSalesUrl = 'https://kelaseksporyuk.com/premium' WHERE id = 'mem_001';

# 2. Generate link
POST /api/affiliate/links
{
  "linkType": "SALESPAGE_EXTERNAL",
  "targetType": "membership",
  "targetId": "mem_001",
  "couponCode": "RINA"
}

# Expected URL:
https://eksporyuk.com/api/redirect/RIN4XYZ?to=https://kelaseksporyuk.com/premium&coupon=RINA

# 3. Test redirect
curl -I "https://eksporyuk.com/api/redirect/RIN4XYZ?to=https://kelaseksporyuk.com/premium"

# Expected:
- Status: 302 Redirect
- Set-Cookie: affiliate_ref=RIN4XYZ; Max-Age=2592000
- Set-Cookie: affiliate_coupon=RINA; Max-Age=2592000
- Location: https://kelaseksporyuk.com/premium
```

---

## FAQ

**Q: Kenapa pakai redirect handler, kenapa gak langsung ke external URL?**
A: Karena kita perlu set cookies **sebelum** user pergi ke domain eksternal. Cookies yang di-set dari eksporyuk.com hanya bisa dibaca kembali oleh eksporyuk.com. Jadi flow:
1. User klik link → eksporyuk.com/api/redirect/CODE
2. Server set cookies → affiliate_ref, affiliate_coupon
3. Server redirect → kelaseksporyuk.com
4. User baca salespage di kelaseksporyuk.com
5. User klik "Daftar" → kembali ke eksporyuk.com/checkout
6. Checkout page baca cookies yang tadi sudah di-set

**Q: Kalau external salespage di domain lain, cookies bisa dibaca?**
A: Tidak. Cookies yang di-set dari eksporyuk.com hanya bisa dibaca oleh eksporyuk.com. Tapi itu yang kita mau! Karena tracking conversion terjadi di eksporyuk.com (saat checkout), bukan di kelaseksporyuk.com.

**Q: Kalau user gak kembali ke eksporyuk.com gimana?**
A: Ya gak akan di-track. External salespage **harus** punya CTA yang redirect kembali ke eksporyuk.com/checkout. Ini design by intent.

**Q: Cookie expire berapa lama?**
A: 30 hari. Jadi user bisa browsing-browsing dulu di kelaseksporyuk.com, baru seminggu kemudian balik ke eksporyuk.com dan checkout, tetap di-track ke affiliate yang sama.

**Q: Bisa gak link eksternal langsung ke kelaseksporyuk.com tanpa lewat redirect?**
A: Bisa, tapi gak akan ada tracking. Karena cookies tidak di-set. Jadi **wajib** lewat `/api/redirect/[code]` dulu.

---

## Next Steps (TODO)

1. **Add externalSalesUrl field di admin panel**
   - Form Edit Product
   - Form Edit Membership

2. **Update checkout page untuk read cookies**
   - `useEffect` baca `affiliate_ref` dan `affiliate_coupon`
   - Auto-apply coupon
   - Pass affiliateRef ke transaction API

3. **Implement conversion tracking**
   - Di `/api/transactions/create`
   - Create AffiliateConversion record
   - Update link conversions counter

4. **Add badge di affiliate dashboard**
   - Show link type: "Checkout", "Internal", "Eksternal"
   - Color-coded badges

5. **Analytics**
   - Track click rate per link type
   - Conversion rate per link type
   - A/B testing insights
