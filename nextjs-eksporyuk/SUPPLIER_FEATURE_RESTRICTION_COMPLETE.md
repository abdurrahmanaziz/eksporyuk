# Supplier Free vs Premium Feature Restriction System

## Tanggal Implementasi
4 Desember 2025

## Overview
Sistem pembatasan fitur untuk supplier berdasarkan paket (FREE, PREMIUM, ENTERPRISE). Admin dapat mengkonfigurasi semua batasan melalui panel admin tanpa perlu coding.

## Fitur yang Dikonfigurasi Admin

### 1. Batasan Kuota (Quotas)
| Fitur | Field | Deskripsi | Default FREE |
|-------|-------|-----------|--------------|
| Maks Produk | `maxProducts` | Jumlah produk maksimal (-1 = unlimited) | 1 |
| Maks Gambar/Produk | `maxImages` | Jumlah gambar per produk | 3 |
| Maks Dokumen/Produk | `maxDocuments` | Jumlah dokumen per produk | 1 |

### 2. Fitur Chat
| Fitur | Field | Deskripsi | Default FREE |
|-------|-------|-----------|--------------|
| Aktifkan Chat | `chatEnabled` | Apakah supplier bisa menerima chat | false |
| Maks Chat/Bulan | `maxChatsPerMonth` | Kuota chat bulanan (-1 = unlimited) | 0 |

### 3. Badge & Visibilitas
| Fitur | Field | Deskripsi | Default FREE |
|-------|-------|-----------|--------------|
| Verified Badge | `verifiedBadge` | Tampilkan badge terverifikasi | false |
| Featured Listing | `featuredListing` | Prioritas di pencarian | false |
| Priority Ranking | `priority` | Ranking lebih tinggi | false |
| Custom URL | `customURL` | URL kustom untuk profil | false |
| Custom Logo/Banner | `customLogo` | Upload logo/banner kustom | false |
| Tampil di Ranking | `ranking` | Muncul di halaman ranking | false |

### 4. Tools & Analytics
| Fitur | Field | Deskripsi | Default FREE |
|-------|-------|-----------|--------------|
| Statistik & Analytics | `statistics` | Akses dashboard analitik | false |
| Download Katalog PDF | `catalogDownload` | Generate katalog PDF | false |
| Multi Bahasa | `multiLanguage` | Support multi bahasa | false |
| Support Priority | `supportPriority` | Level dukungan (normal/high/vip) | normal |

## File yang Dimodifikasi

### Admin Panel
- `/src/app/(dashboard)/admin/supplier/packages/page.tsx`
  - Form dengan semua field fitur yang bisa dikonfigurasi
  - Organized dalam sections: Quotas, Chat, Badge & Visibility, Tools

### API Endpoints
- `/src/app/api/admin/supplier/packages/route.ts` - CRUD paket supplier
- `/src/app/api/supplier/products/route.ts` - Validasi kuota produk, gambar, dokumen
- `/src/app/api/chat/start/route.ts` - Validasi chat enabled & kuota bulanan
- `/src/app/api/supplier/quota/route.ts` (NEW) - Get penggunaan kuota & fitur

### Supplier Dashboard
- `/src/app/(dashboard)/supplier/dashboard/page.tsx`
  - Tampilan kuota & batasan paket
  - Progress bar penggunaan
  - Feature checklist (enabled/disabled)
  - Upgrade prompts otomatis

## Validasi API

### Produk (POST /api/supplier/products)
```javascript
// Check product quota
if (currentProductCount >= maxProducts) {
  return { error: 'Kuota produk habis', code: 'QUOTA_EXCEEDED' }
}

// Check images limit
if (images.length > maxImages) {
  return { error: 'Maks gambar exceeded', code: 'IMAGES_LIMIT_EXCEEDED' }
}

// Check documents limit
if (documents.length > maxDocuments) {
  return { error: 'Maks dokumen exceeded', code: 'DOCUMENTS_LIMIT_EXCEEDED' }
}
```

### Chat (POST /api/chat/start)
```javascript
// Check chat enabled
if (!chatEnabled) {
  return { error: 'Supplier tidak menerima chat', code: 'SUPPLIER_CHAT_DISABLED' }
}

// Check monthly quota
if (chatCountThisMonth >= maxChatsPerMonth) {
  return { error: 'Kuota chat habis', code: 'SUPPLIER_CHAT_QUOTA_EXCEEDED' }
}
```

## Quota API Response

### GET /api/supplier/quota
```json
{
  "success": true,
  "data": {
    "packageName": "Free Supplier",
    "packageType": "FREE",
    "quotas": {
      "products": { "used": 1, "max": 1, "unlimited": false, "remaining": 0 },
      "images": { "max": 3, "perProduct": true },
      "documents": { "max": 1, "perProduct": true },
      "chat": { "enabled": false, "usedThisMonth": 0, "maxPerMonth": 0, "unlimited": false }
    },
    "features": {
      "verifiedBadge": false,
      "customURL": false,
      "statistics": false,
      "...": "..."
    },
    "upgradePrompts": [
      { "feature": "products", "message": "Kuota produk habis. Upgrade untuk menambah produk." },
      { "feature": "chat", "message": "Aktifkan fitur chat dengan upgrade ke paket Premium." }
    ]
  }
}
```

## Cara Penggunaan (Admin)

### Membuat Paket Baru
1. Buka Admin > Supplier > Packages
2. Klik "Add Package"
3. Isi Basic Info (nama, slug, tipe, durasi, harga)
4. Konfigurasi Batasan Kuota
5. Atur Fitur Chat
6. Pilih Badge & Visibilitas
7. Aktifkan Tools & Analytics
8. Save

### Mengubah Batasan Paket
1. Edit paket yang sudah ada
2. Update field yang diinginkan
3. Perubahan berlaku langsung untuk semua supplier dengan paket tersebut

## Catatan Implementasi
- Semua batasan disimpan di field `features` (JSON) pada model `SupplierPackage`
- Validasi dilakukan di level API, bukan di frontend saja
- Pesan error dalam Bahasa Indonesia
- Upgrade prompts otomatis muncul jika ada fitur yang terbatas
- -1 berarti unlimited untuk kuota numerik
