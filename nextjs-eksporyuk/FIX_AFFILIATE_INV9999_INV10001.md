# FIX AFFILIATE CONVERSION - INV9999 & INV10001

## Masalah
2 transaksi **INV9999** dan **INV10001** tidak memiliki **AffiliateConversion** padahal di metadata tercatat affiliate **1637 (Rahmat Al Fianto)**.

## Detail Transaksi

### INV9999
- **Buyer**: DERRY RIVAL DOEAN KING
- **Amount**: Rp 999,000 (MEMBERSHIP - Paket Ekspor Yuk Lifetime)
- **Status**: SUCCESS
- **Affiliate**: Rahmat Al Fianto (ID 1637)
- **Komisi seharusnya**: Rp 325,000

### INV10001
- **Buyer**: Tejo aprilianto dwi aspodo putro
- **Amount**: Rp 899,000 (PRODUCT - Paket Ekspor Yuk 12 Bulan)
- **Status**: SUCCESS
- **Affiliate**: Rahmat Al Fianto (ID 1637)
- **Komisi seharusnya**: Rp 250,000

## Solusi

Menambahkan **AffiliateConversion** secara manual untuk kedua transaksi:

1. **INV9999**: Commission Rp 325,000
2. **INV10001**: Commission Rp 250,000

Total komisi yang ditambahkan ke wallet Rahmat: **Rp 575,000**

## Script yang Digunakan

```bash
node fix-missing-conversions.js
```

## Hasil

✅ **Conversion created** untuk INV9999 (Rp 325,000)
✅ **Conversion created** untuk INV10001 (Rp 250,000)
✅ **Wallet Rahmat updated**: Rp 6,750,000

## Verifikasi

Kedua transaksi sekarang memiliki affiliate conversion:
- INV9999 → Rahmat Al Fianto (Rp 325,000)
- INV10001 → Rahmat Al Fianto (Rp 250,000)

---

**Catatan**: Komisi langsung masuk ke `balance` (bukan `balancePending`) karena transaksi sudah SUCCESS. Rahmat bisa langsung withdraw komisi ini.
