# 🔗 Sistem Link Generator & Redirect Salespage

## Overview
Sistem ini memungkinkan admin untuk membuat link pendek yang otomatis redirect ke URL salespage (internal atau eksternal) dengan tracking affiliate.

## Fitur Utama

### 1. **URL Salespage (Internal/Eksternal)**
Admin bisa input URL salespage di field `salesPageUrl`:
- **Internal**: `/salespage/paket-premium`
- **Eksternal**: `https://kelaseksporyuk.com/paket-premium`

### 2. **Link Generator**
Setelah admin save salesPageUrl, sistem otomatis generate link pendek:
```
Format: /go/[slug]
Contoh: https://eksporyuk.com/go/paket-1bulan
```

### 3. **Auto Redirect**
Ketika user klik link `/go/[slug]`:
- Sistem akan redirect ke `salesPageUrl` yang disimpan admin
- Otomatis tambahkan parameter `?ref=AFFILIATE_CODE` untuk tracking
- Track klik dan konversi affiliate

## Cara Kerja

### Flow Redirect:
```
1. Customer klik: https://eksporyuk.com/go/paket-1bulan?ref=RINA123
2. Sistem baca database → cek slug "paket-1bulan"
3. Ambil salesPageUrl: https://kelaseksporyuk.com/paket-1-bulan
4. Redirect ke: https://kelaseksporyuk.com/paket-1-bulan?ref=RINA123
5. Track klik untuk affiliate RINA123
```

### Database Schema:
```prisma
model Membership {
  id              String   @id @default(cuid())
  name            String
  slug            String?  @unique
  salesPageUrl    String?  // URL salespage (internal/external)
  // ... fields lainnya
}
```

## Penggunaan

### A. Untuk Admin

#### 1. Input Salespage URL
Di halaman `/admin/membership`, saat edit/create paket:
- Isi field **"URL Salespage (Internal/Eksternal)"**
- Contoh: `https://kelaseksporyuk.com/paket-premium`
- Save

#### 2. Copy Generated Link
Setelah save, akan muncul box hijau dengan:
- **Link Generator**: `/go/paket-1bulan`
- Button "Copy" untuk copy link
- Penjelasan cara kerja redirect

#### 3. Share Link
Admin bisa share link ke:
- Affiliate untuk promosi
- Customer langsung
- Campaign marketing
- Social media

### B. Untuk Affiliate

Affiliate bisa generate link mereka sendiri di `/affiliate/links`:
1. Pilih paket membership
2. Generate affiliate link
3. Link otomatis include referral code
4. Setiap klik & konversi akan tracked

### C. Format Link

#### 1. Direct Checkout (Internal)
```
URL: /membership/paket-1bulan
Target: Langsung ke halaman checkout
Tracking: Ya (via ?ref parameter)
```

#### 2. Link Generator (Redirect)
```
URL: /go/paket-1bulan
Target: Redirect ke salesPageUrl
Tracking: Ya (auto append ?ref)
```

#### 3. Affiliate Link
```
URL: /go/paket-1bulan?ref=RINA123
Target: Redirect dengan tracking affiliate
Komisi: Otomatis hitung untuk RINA123
```

## API Endpoint

### GET `/api/go/[shortcode]`

**Request:**
```
GET /go/paket-1bulan?ref=RINA123
```

**Process:**
1. Cari membership dengan slug = "paket-1bulan"
2. Ambil `salesPageUrl`
3. Track klik (ip, user agent, affiliate)
4. Redirect dengan parameter

**Response:**
```
302 Redirect → https://kelaseksporyuk.com/paket-1-bulan?ref=RINA123
```

**Tracking:**
- Save to `AffiliateClick` table
- Update click count
- Link to affiliate for commission

## Contoh Implementasi

### Admin Panel Display:
```tsx
{pkg.salesPageUrl && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <p className="text-sm font-semibold mb-2">
      URL Salespage (Redirect Link)
    </p>
    <p className="text-xs text-gray-600 mb-3">
      🔗 Link ini akan redirect ke: {pkg.salesPageUrl}
    </p>
    <div className="flex items-center gap-2">
      <code className="flex-1">
        /go/{pkg.slug}
      </code>
      <Button onClick={() => copyLink(`/go/${pkg.slug}`)}>
        Copy
      </Button>
    </div>
  </div>
)}
```

### Route Handler:
```typescript
// src/app/api/go/[shortcode]/route.ts
export async function GET(request, { params }) {
  const { shortcode } = params
  
  // Find membership by slug
  const membership = await prisma.membership.findFirst({
    where: { slug: shortcode, isActive: true }
  })
  
  if (membership?.salesPageUrl) {
    // Track click
    await trackClick(membership.id, ref)
    
    // Redirect to salespage
    return redirect(`${membership.salesPageUrl}?ref=${ref}`)
  }
  
  // Fallback to internal checkout
  return redirect(`/membership/${shortcode}`)
}
```

## Keuntungan

### 1. **Fleksibilitas**
- Bisa redirect ke salespage eksternal (kelaseksporyuk.com)
- Atau tetap di internal (eksporyuk.com)
- Admin tinggal ganti URL

### 2. **Tracking Affiliate**
- Setiap klik tercatat
- Komisi otomatis dihitung
- Report lengkap per affiliate

### 3. **Link Pendek**
- Format clean: `/go/paket-1bulan`
- Mudah diingat dan dibagikan
- Professional untuk marketing

### 4. **Unified System**
- Semua link lewat satu endpoint
- Konsisten tracking
- Mudah maintenance

## Tips Penggunaan

1. **Untuk salespage eksternal**, pastikan URL lengkap:
   ```
   ✅ https://kelaseksporyuk.com/paket-premium
   ❌ kelaseksporyuk.com/paket-premium (kurang https://)
   ```

2. **Untuk internal salespage**, gunakan path relatif:
   ```
   ✅ /salespage/paket-premium
   ✅ /membership/paket-1bulan
   ```

3. **Testing redirect**:
   - Copy link dari admin panel
   - Paste di browser dengan `?ref=TEST`
   - Pastikan redirect benar dan parameter terbawa

4. **Monitoring**:
   - Cek di `/admin/analytics` untuk click statistics
   - Monitor conversion rate per link
   - Track affiliate performance

## Troubleshooting

### Q: Link tidak redirect?
**A:** Cek:
- Slug sudah diisi di membership?
- salesPageUrl sudah valid?
- Server sudah restart?

### Q: Parameter ?ref tidak terbawa?
**A:** Pastikan:
- URL salespage tidak ada # fragment
- Tidak ada redirect tambahan di salespage
- Check browser console untuk errors

### Q: Affiliate tidak dapat komisi?
**A:** Verify:
- Affiliate code valid dan active
- Click tercatat di database
- Transaction linked ke affiliate

## Update Log

**v1.0 (Current)**
- ✅ Basic redirect functionality
- ✅ Affiliate tracking
- ✅ Admin panel integration
- ✅ Click statistics

**Roadmap:**
- 🔜 Analytics dashboard
- 🔜 Custom short URLs
- 🔜 QR code generation
- 🔜 A/B testing links
