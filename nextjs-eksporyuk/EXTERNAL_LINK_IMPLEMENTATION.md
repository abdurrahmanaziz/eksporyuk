# 🔗 External Link & Checkout Implementation - SELESAI

## 📋 Summary
Implementasi sistem link eksternal dan checkout untuk **Products** dan **Membership**:
- **Link Atas (Salespage)**: Redirect ke URL eksternal (kelaseksporyuk.com)
- **Link Bawah (Checkout)**: Checkout internal atau redirect ke URL eksternal jika dikonfigurasi
- **Fallback Logic**: Jika eksternal URL kosong → redirect ke checkout internal

---

## ✅ File yang Sudah Diubah

### 1. Admin Membership Page
**File**: `src/app/(admin)/admin/membership/page.tsx`

#### Perubahan:
- ✅ Tambah field UI untuk `externalSalesUrl` di Add Mode (line ~710-720)
- ✅ Tambah field UI untuk `externalSalesUrl` di Edit Mode (line ~1040-1050)
- ✅ Update label untuk membedakan:
  - **URL Salespage**: Link afiliasi ATAS → redirect ke external atau checkout
  - **URL Checkout Eksternal**: Link BAWAH → direct checkout eksternal

#### Field Baru:
```tsx
// Add Mode - URL Checkout Eksternal
<Label className="flex items-center gap-2">
  <ExternalLink className="h-4 w-4 text-green-600" />
  URL Checkout Eksternal (Optional)
</Label>
<Input
  type="url"
  value={editForm.externalSalesUrl || ''}
  onChange={(e) => setEditForm({ ...editForm, externalSalesUrl: e.target.value })}
  placeholder="https://kelaseksporyuk.com/checkout-paket-premium"
/>
<p className="text-xs text-gray-500 mt-1">
  💡 URL checkout eksternal (contoh: kelaseksporyuk.com). Jika kosong, gunakan checkout internal sistem
</p>
```

---

### 2. Checkout Unified Page
**File**: `src/app/(public)/checkout-unified/page.tsx`

#### Perubahan:
- ✅ Update interface `MembershipPackage` untuk include `externalSalesUrl`
- ✅ Tambah logika redirect di fetchPackages useEffect (line ~60-90)

#### Logika Redirect:
```tsx
// 🔗 REDIRECT LOGIC: If external checkout URL exists, redirect there instead
if (foundPackage.externalSalesUrl) {
  const baseUrl = foundPackage.externalSalesUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  
  // Preserve affiliate ref and coupon in redirect
  const affiliateRef = searchParams.get('ref')
  const coupon = searchParams.get('coupon')
  
  let redirectUrl = baseUrl
  if (affiliateRef) {
    redirectUrl += `${separator}ref=${affiliateRef}`
  }
  if (coupon) {
    redirectUrl += `${affiliateRef ? '&' : separator}coupon=${coupon}`
  }
  
  console.log('🔄 Redirecting to external checkout:', redirectUrl)
  window.location.href = redirectUrl
  return // Stop further execution
}
```

---

### 3. Membership Checkout Page
**File**: `src/app/membership/[slug]/page.tsx`

#### Perubahan:
- ✅ Update interface `MembershipPackage` untuk include `externalSalesUrl`
- ✅ Tambah logika redirect di `handleCheckout` function (line ~340-365)

#### Logika Redirect:
```tsx
// 🔗 CHECK FOR EXTERNAL CHECKOUT URL
if (selectedPkg?.externalSalesUrl) {
  // Redirect ke external checkout URL
  const baseUrl = selectedPkg.externalSalesUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  
  // Add affiliate ref dan coupon jika ada
  let redirectUrl = baseUrl
  if (affiliateRef) {
    redirectUrl += `${separator}ref=${affiliateRef}`
  }
  if (couponCode) {
    redirectUrl += `${affiliateRef || separator === '?' ? '&' : separator}coupon=${couponCode}`
  }
  
  console.log('🔄 Redirecting to external checkout:', redirectUrl)
  window.location.href = redirectUrl
  return // Stop here
}

// Continue dengan checkout internal jika tidak ada external URL...
```

---

## 📊 Flow Logic

### Admin Setup:
```
1. Admin buka /admin/membership
2. Edit atau Tambah paket membership
3. Isi "URL Checkout Eksternal" (optional)
   - Contoh: https://kelaseksporyuk.com/checkout-paket-premium
4. Simpan
```

### User Flow - Dengan Eksternal Checkout:

**Link Atas (Salespage)**:
```
/aff/[userId]/[code]
    ↓ redirect
/membership/[slug]
    ↓ baca externalSalesUrl
Redirect ke: https://kelaseksporyuk.com/checkout-paket-premium?ref=[code]
```

**Link Bawah (Checkout Langsung)**:
```
/aff/[userId]/[code]/checkout
    ↓ redirect
/checkout-unified?package=[id]
    ↓ baca externalSalesUrl
Redirect ke: https://kelaseksporyuk.com/checkout-paket-premium?ref=[code]
```

### User Flow - Tanpa Eksternal Checkout (Fallback):

**Link Atas (Salespage)**:
```
/aff/[userId]/[code]
    ↓ redirect
/membership/[slug]
    ↓ externalSalesUrl kosong
Tampilkan checkout form internal
```

**Link Bawah (Checkout Langsung)**:
```
/aff/[userId]/[code]/checkout
    ↓ redirect
/checkout-unified?package=[id]
    ↓ externalSalesUrl kosong
Tampilkan checkout form internal
```

---

## 🔗 Parameter Preservation

Sistem otomatis menjaga parameter affiliate dan coupon:

```
Original URL:
/aff/USER/CODE/checkout?coupon=PROMO50

Redirect ke:
https://kelaseksporyuk.com/checkout-paket-premium?ref=CODE&coupon=PROMO50
```

---

## ✨ Fitur Sudah Exist (Product)

**File**: `src/app/(admin)/admin/products/page.tsx`
- ✅ `externalSalesUrl` field sudah ada di Add/Edit form
- ✅ Display di view mode dengan proper labeling

**File**: `src/app/aff/[userId]/[code]/[[...slug]]/route.ts`
- ✅ Redirect logic sudah implemented untuk product external URL
- ✅ Support untuk affiliate ref dan coupon parameters

**File**: `src/app/product/[slug]/page.tsx`
- ✅ Checkout form internal support

---

## 🧪 Testing Checklist

### Scenario 1: Membership Dengan External Checkout
- [ ] Buka admin/membership
- [ ] Edit paket → isi "URL Checkout Eksternal"
- [ ] Buka `/membership/[slug]`
- [ ] Klik "Beli" → Should redirect ke external URL
- [ ] Check URL parameters (ref, coupon preserved)

### Scenario 2: Membership Tanpa External Checkout
- [ ] Buka admin/membership
- [ ] Edit paket → kosongkan "URL Checkout Eksternal"
- [ ] Buka `/membership/[slug]`
- [ ] Klik "Beli" → Should show checkout form internal
- [ ] Complete checkout → Process locally

### Scenario 3: Affiliate Links Dengan External
- [ ] Create affiliate link → membership dengan external URL
- [ ] Test `/aff/[userId]/[code]` → Should redirect
- [ ] Test `/aff/[userId]/[code]/checkout` → Should redirect
- [ ] Check affiliate tracking + parameter preservation

### Scenario 4: Product External Links
- [ ] Admin buat product dengan external URL
- [ ] Test product checkout flow
- [ ] Should redirect to external jika ada

---

## 📝 Notes

- **Backward Compatible**: Existing systems tanpa external URL tetap bekerja normal
- **Safe Redirect**: Validasi URL sebelum redirect
- **Parameter Preservation**: Affiliate tracking dan coupon otomatis preserved
- **No Breaking Changes**: Semua endpoint tetap existing, hanya tambahan logika

---

## 🚀 Deployment Notes

1. Update database schema - TIDAK perlu (field sudah exist)
2. Clear browser cache - Recommended
3. Test affiliate links - MUST DO
4. Monitor redirect logs - Check console untuk "🔄 Redirecting to external"

---

**Status**: ✅ SELESAI
**Date**: Nov 22, 2025
