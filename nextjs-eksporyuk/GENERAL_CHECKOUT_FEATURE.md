# Fitur Tampil di Checkout Umum

## 📋 Overview

Fitur ini memungkinkan admin untuk mengatur apakah sebuah membership plan akan ditampilkan di halaman checkout umum (`/checkout/pro`) atau tidak.

## ✅ Yang Sudah Diimplementasikan

### 1. **Database Schema** ✓
- Field `showInGeneralCheckout` sudah ada di model `Membership` di Prisma schema
- Default value: `true` (membership akan tampil di checkout umum secara default)

### 2. **Admin UI - Membership Edit** ✓
**File**: `/src/app/(dashboard)/admin/membership-plans/[id]/edit/page.tsx`

Ditambahkan toggle switch di tab "Harga & Durasi":
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg">
  <div className="space-y-0.5">
    <Label>Tampil di Checkout Umum</Label>
    <p className="text-sm text-muted-foreground">
      Tampilkan membership ini di halaman /checkout/pro
    </p>
  </div>
  <Switch
    checked={formData.showInGeneralCheckout}
    onCheckedChange={(checked) =>
      setFormData({ ...formData, showInGeneralCheckout: checked })
    }
  />
</div>
```

**Lokasi**: Setelah toggle "Auto Renewal", sebelum "Pengaturan Komisi Affiliate"

### 3. **Admin UI - Membership Create** ✓
**File**: `/src/app/(dashboard)/admin/membership-plans/create/page.tsx`

Ditambahkan toggle yang sama dengan default value `true`:
```tsx
const [formData, setFormData] = useState({
  // ... fields lain
  showInGeneralCheckout: true,
});
```

### 4. **API Backend - GET Packages** ✓
**File**: `/src/app/api/memberships/packages/route.ts`

Filter ditambahkan pada query:
```typescript
const memberships = await prisma.membership.findMany({
  where: includeInactive ? {} : { 
    isActive: true,
    status: 'PUBLISHED',
    showInGeneralCheckout: true, // ← Filter baru
    NOT: {
      slug: 'pro'
    }
  },
  // ... include & order
})
```

**Behavior**:
- Hanya membership dengan `showInGeneralCheckout = true` yang muncul di `/checkout/pro`
- Tetap harus `isActive = true` dan `status = 'PUBLISHED'`
- Masih exclude membership dengan slug `'pro'`

### 5. **API Backend - POST Create** ✓
**File**: `/src/app/api/admin/membership-plans/route.ts`

Menangani field `showInGeneralCheckout` saat create:
```typescript
const {
  // ... fields lain
  showInGeneralCheckout = true,
  // ...
} = body

const newPlan = await prisma.membership.create({
  data: {
    // ... fields lain
    showInGeneralCheckout,
    // ...
  },
})
```

### 6. **API Backend - PATCH Update** ✓
**File**: `/src/app/api/admin/membership-plans/[id]/route.ts`

Menangani update field:
```typescript
if (showInGeneralCheckout !== undefined) {
  updateData.showInGeneralCheckout = showInGeneralCheckout
  if (showInGeneralCheckout !== existingPlan.showInGeneralCheckout) 
    changedFields.push('showInGeneralCheckout')
}
```

## 🎯 Cara Kerja

### Flow untuk Admin:
1. Buka **Admin > Membership Plans**
2. Create/Edit membership plan
3. Di tab **"Harga & Durasi"**, scroll ke bawah
4. Toggle **"Tampil di Checkout Umum"**:
   - ✅ **ON** (hijau) = Membership tampil di `/checkout/pro`
   - ❌ **OFF** (abu-abu) = Membership TIDAK tampil di `/checkout/pro`
5. Klik **Simpan Perubahan**

### Flow untuk User/Customer:
1. User mengakses `/checkout/pro`
2. Halaman checkout hanya menampilkan membership dengan:
   - `showInGeneralCheckout = true` ✓
   - `isActive = true` ✓
   - `status = 'PUBLISHED'` ✓
3. Membership yang di-toggle OFF tidak akan muncul di daftar

## 📊 Use Cases

### ✅ Kapan Disable `showInGeneralCheckout`?
1. **Membership Eksklusif**: Hanya dijual via link khusus/affiliate
2. **Limited Offer**: Tidak untuk umum, hanya untuk event tertentu
3. **Beta Testing**: Membership baru yang masih testing
4. **Custom Sales Page**: Punya halaman penjualan sendiri di luar `/checkout/pro`
5. **Corporate Package**: Hanya untuk B2B, bukan retail

### ✅ Kapan Enable `showInGeneralCheckout`?
1. **Public Package**: Paket untuk umum
2. **Main Products**: Produk utama yang selalu tersedia
3. **Seasonal Offer**: Promo reguler yang boleh semua orang beli

## 🔧 Testing Checklist

- [ ] **Test Create**: Buat membership baru dengan toggle ON → cek muncul di `/checkout/pro`
- [ ] **Test Create**: Buat membership baru dengan toggle OFF → cek TIDAK muncul di `/checkout/pro`
- [ ] **Test Update**: Edit membership, toggle ON → OFF → cek hilang dari `/checkout/pro`
- [ ] **Test Update**: Edit membership, toggle OFF → ON → cek muncul di `/checkout/pro`
- [ ] **Test Filter Kombinasi**: 
  - `showInGeneralCheckout = true` + `isActive = false` → TIDAK muncul ✓
  - `showInGeneralCheckout = true` + `status = 'DRAFT'` → TIDAK muncul ✓
  - `showInGeneralCheckout = false` + `isActive = true` → TIDAK muncul ✓
- [ ] **Test API Response**: Verify field `showInGeneralCheckout` ada di response GET

## 📁 Files Modified

1. `/src/app/api/memberships/packages/route.ts` - Filter logic
2. `/src/app/(dashboard)/admin/membership-plans/[id]/edit/page.tsx` - Edit UI
3. `/src/app/(dashboard)/admin/membership-plans/create/page.tsx` - Create UI
4. `/src/app/api/admin/membership-plans/route.ts` - POST handler
5. `/src/app/api/admin/membership-plans/[id]/route.ts` - PATCH handler

## 🚀 Status Implementasi

**Status**: ✅ **COMPLETE & READY FOR TESTING**

- [x] Database schema support
- [x] Admin UI - Create form
- [x] Admin UI - Edit form
- [x] API - Create endpoint
- [x] API - Update endpoint
- [x] API - Filter logic for /checkout/pro
- [x] No TypeScript errors
- [x] Documentation

## 🔗 Related Pages

- **Checkout Page**: `/checkout/pro`
- **Admin Membership List**: `/admin/membership-plans`
- **Admin Membership Create**: `/admin/membership-plans/create`
- **Admin Membership Edit**: `/admin/membership-plans/[id]/edit`

## 💡 Notes

1. **Default Behavior**: Semua membership baru default `showInGeneralCheckout = true`
2. **Backward Compatibility**: Membership lama yang belum punya field ini akan dianggap `true` (karena default di schema)
3. **Triple Filter**: Halaman `/checkout/pro` filter berdasarkan 3 kondisi:
   - `showInGeneralCheckout = true`
   - `isActive = true`
   - `status = 'PUBLISHED'`
4. **No Migration Needed**: Field sudah ada di schema, tidak perlu migration baru

---

**Dibuat**: 20 Desember 2025  
**Oleh**: GitHub Copilot  
**Versi**: 1.0
