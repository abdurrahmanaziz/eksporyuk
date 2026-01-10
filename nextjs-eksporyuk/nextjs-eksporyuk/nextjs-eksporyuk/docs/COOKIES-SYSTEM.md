# Sistem Cookies Link Generator

## Overview
Sistem cookies otomatis menanamkan tracking data saat user klik link `/go/[shortcode]`, bahkan untuk redirect eksternal. Data tersimpan di browser dan digunakan saat checkout internal.

## Cookies yang Ditanamkan

### 1. **affiliate_ref**
- **Value**: Kode affiliate (ref parameter atau affiliate code)
- **Expires**: 30 hari
- **Purpose**: Track affiliate untuk komisi

### 2. **membership_id** / **product_id**
- **Value**: ID membership atau product yang dipilih
- **Expires**: 30 hari
- **Purpose**: Ingat produk yang dipilih untuk proses checkout

### 3. **coupon_code**
- **Value**: Kode kupon otomatis
- **Expires**: 30 hari
- **Purpose**: Otomatis apply kupon saat checkout

## Flow Diagram

```
User klik: /go/paket-1bulan?ref=AFFILIATE123
         ↓
1. Set Cookies di Browser:
   - affiliate_ref = AFFILIATE123
   - membership_id = [ID]
   - coupon_code = [jika ada]
         ↓
2. Redirect ke: https://kelaseksporyuk.com (eksternal)
         ↓
3. User lihat salespage eksternal
         ↓
4. User klik tombol "Beli Sekarang" → redirect ke checkout internal
         ↓
5. Checkout internal baca cookies:
   - Affiliate: AFFILIATE123 ✓
   - Product: [ID] ✓
   - Kupon: Auto apply ✓
```

## Implementasi pada Checkout

Checkout page harus membaca cookies:

```typescript
import { cookies } from 'next/headers'

export default async function CheckoutPage() {
  const cookieStore = cookies()
  
  const affiliateRef = cookieStore.get('affiliate_ref')?.value
  const membershipId = cookieStore.get('membership_id')?.value
  const couponCode = cookieStore.get('coupon_code')?.value
  
  // Auto-apply affiliate & coupon
  // ...
}
```

## Keuntungan

✅ **Tracking tetap jalan** walaupun redirect ke domain eksternal
✅ **Kupon otomatis apply** tanpa user input manual
✅ **Affiliate komisi terjamin** karena data tersimpan di browser
✅ **User experience lebih baik** - seamless dari eksternal ke checkout

## Contoh Penggunaan

### Skenario 1: Link dengan Affiliate
```
https://yourdomain.com/go/paket-1bulan?ref=JOHN
→ Set cookie: affiliate_ref=JOHN
→ Redirect: https://kelaseksporyuk.com
→ User checkout di yourdomain.com/checkout
→ Komisi masuk ke JOHN ✓
```

### Skenario 2: Link dengan Kupon Otomatis
```
https://yourdomain.com/go/paket-6bulan?coupon=DISKON50
→ Set cookie: coupon_code=DISKON50
→ Redirect: https://kelaseksporyuk.com
→ User checkout di yourdomain.com/checkout
→ Kupon DISKON50 auto-applied ✓
```

### Skenario 3: Kombinasi Affiliate + Kupon
```
https://yourdomain.com/go/paket-12bulan?ref=SARAH&coupon=HEMAT30
→ Set cookies:
   - affiliate_ref=SARAH
   - coupon_code=HEMAT30
→ Redirect: https://kelaseksporyuk.com
→ User checkout di yourdomain.com/checkout
→ Komisi ke SARAH + Diskon HEMAT30 ✓
```

## Cookie Expiration
Semua cookies valid selama **30 hari**. Jadi walaupun user tidak langsung checkout, tracking tetap aktif.

## Security
- Cookies menggunakan `sameSite: 'lax'` untuk keamanan
- Hanya data tracking (bukan data sensitif)
- Tidak menyimpan informasi pembayaran
