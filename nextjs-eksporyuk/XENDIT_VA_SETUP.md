# Xendit Virtual Account Setup Guide

## Overview
Panduan lengkap untuk setup Virtual Account (VA) payment menggunakan Xendit Payment Gateway.

## Prerequisites
1. Akun Xendit (https://dashboard.xendit.co)
2. API Keys dari Xendit Dashboard
3. Company Code untuk Virtual Account

---

## 1. Mendapatkan API Keys

### Login ke Xendit Dashboard
1. Buka https://dashboard.xendit.co
2. Login dengan akun Anda
3. Pilih mode **Test** atau **Live**

### Generate API Keys
1. Navigate ke **Settings** → **Developers** → **API Keys**
2. Copy keys berikut:
   - **Secret Key** (starts with `xnd_development_` atau `xnd_production_`)
   - **Public Key** (optional, untuk client-side)
   - **Webhook Token** (untuk webhook verification)

---

## 2. Mendapatkan Company Code untuk VA

### Untuk Test/Sandbox Mode:
Default company code: **88088**

### Untuk Production Mode:
1. Navigate ke **Settings** → **Virtual Account**
2. Pilih bank yang ingin diaktifkan (BCA, BNI, BRI, Mandiri, dll)
3. Request activation untuk setiap bank
4. Setelah approved, Xendit akan berikan **Company Code** untuk tiap bank
5. Company code biasanya 5 digit, contoh:
   - BCA: `88088`
   - BNI: `8808`
   - Mandiri: `88077`

### Format Virtual Account Number:
```
{COMPANY_CODE}{UNIQUE_NUMBER}
Contoh: 880881234567 (88088 = company code, 1234567 = unique)
```

---

## 3. Setup Environment Variables

Edit file `.env.local`:

```bash
# Xendit Configuration
XENDIT_API_KEY=xnd_development_XXXXXX           # Public Key (optional)
XENDIT_SECRET_KEY=xnd_development_XXXXXX        # Required untuk API calls
XENDIT_WEBHOOK_TOKEN=your_webhook_token         # Required untuk webhook
XENDIT_MODE=test                                 # test atau production
XENDIT_ENVIRONMENT="development"                 # development atau production
XENDIT_VA_COMPANY_CODE="88088"                  # Company code dari Xendit
```

### Test Mode (Sandbox):
```bash
XENDIT_SECRET_KEY=xnd_development_O46JfOtygef9kMNsK+ZPGT+ZZ9b3ooF4w3Dn+R1ye4=
XENDIT_MODE=test
XENDIT_VA_COMPANY_CODE="88088"
```

### Production Mode:
```bash
XENDIT_SECRET_KEY=xnd_production_XXXXXXXXXX
XENDIT_MODE=production
XENDIT_VA_COMPANY_CODE="88088"  # Real company code dari Xendit
```

---

## 4. Bank Codes yang Didukung

```typescript
const SUPPORTED_BANKS = {
  BCA: 'BCA',
  BNI: 'BNI',
  BRI: 'BRI',
  MANDIRI: 'MANDIRI',
  PERMATA: 'PERMATA',
  BSI: 'BSI',      // Bank Syariah Indonesia
  CIMB: 'CIMB',
  BJB: 'BJB',      // Bank Jabar Banten
  SAHABAT_SAMPOERNA: 'SAHABAT_SAMPOERNA'
}
```

---

## 5. Testing Virtual Account

### Test Mode (Sandbox):
Xendit menyediakan simulator untuk testing:

1. **Generate VA**: System akan auto-generate VA number
2. **Simulate Payment**: 
   - Buka https://dashboard.xendit.co/simulation
   - Pilih "Virtual Account"
   - Input VA number yang di-generate
   - Klik "Simulate Payment"
3. **Webhook**: Xendit akan kirim webhook ke callback URL

### Test VA Numbers (Sandbox):
- Format: `88088XXXXXXX` (88088 + 7 digit unique)
- Contoh: `880881234567`

---

## 6. Webhook Setup

### Configure Webhook URL:
1. Navigate ke **Settings** → **Developers** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/xendit`
3. Enable events:
   - ✅ Virtual Account Payment
   - ✅ Invoice Paid
   - ✅ Invoice Expired
4. Copy **Webhook Token** dan masukkan ke `.env.local`

### Webhook Handler (sudah ada di kode):
```typescript
// File: src/app/api/webhooks/xendit/route.ts
POST /api/webhooks/xendit
```

---

## 7. VA Number Format Details

### Auto-Generated VA:
System akan auto-generate VA number dengan format:
```
{COMPANY_CODE}{TIMESTAMP}
Contoh: 880887654321 (88088 + timestamp 7 digit terakhir)
```

### Custom VA Number:
Bisa specify custom VA number:
```typescript
await xenditService.createVirtualAccount({
  externalId: transactionId,
  bankCode: 'BCA',
  name: 'Customer Name',
  amount: 100000,
  virtualAccountNumber: '880881234567' // Optional custom VA
})
```

---

## 8. Troubleshooting

### Error: "Xendit client not initialized"
**Penyebab**: `XENDIT_SECRET_KEY` tidak tersedia di environment
**Solusi**: 
1. Check file `.env.local`
2. Pastikan key sudah benar
3. Restart dev server: `npm run dev`

### Error: "Invalid bank code"
**Penyebab**: Bank code tidak didukung atau salah format
**Solusi**: 
1. Gunakan bank code yang benar (BCA, BNI, BRI, dll)
2. Check typo di bank code

### Error: "VA creation failed"
**Penyebab**: API key salah atau bank belum diaktifkan
**Solusi**:
1. Verify API key di Xendit Dashboard
2. Pastikan bank sudah activated di Xendit
3. Check mode (test vs production)
4. Check company code sudah benar

### Mock/Fallback VA Number Muncul
**Penyebab**: Xendit API tidak tersedia atau error
**Solusi**:
1. System akan auto-generate fallback VA number
2. VA tetap valid untuk demo/testing
3. Set proper `XENDIT_SECRET_KEY` untuk production

---

## 9. Production Checklist

Sebelum go live, pastikan:

- [ ] **API Keys Production** sudah disetup
- [ ] **Webhook URL** sudah configured dan accessible
- [ ] **Company Code** sudah didapat dari Xendit
- [ ] **Bank Virtual Account** sudah activated
- [ ] **SSL Certificate** installed (required untuk webhook)
- [ ] **Test Payment** berhasil di sandbox mode
- [ ] **Webhook Handler** tested dan working
- [ ] **Error Handling** tested
- [ ] **Logging** enabled untuk monitoring

---

## 10. API Reference

### Create Virtual Account
```typescript
const result = await xenditService.createVirtualAccount({
  externalId: 'TRANSACTION_ID',     // Unique transaction ID
  bankCode: 'BCA',                   // Bank code
  name: 'Customer Name',             // Customer name (max 255 chars)
  amount: 100000,                    // Amount in IDR (optional)
  isSingleUse: true,                 // true = VA closed after payment
  expirationDate: new Date(),        // Optional expiration
  virtualAccountNumber: '880881234567' // Optional custom VA
})

// Response:
{
  success: true,
  data: {
    id: 'va_xxxxxxxx',
    owner_id: 'xxxxxxxx',
    external_id: 'TRANSACTION_ID',
    bank_code: 'BCA',
    merchant_code: '88088',
    account_number: '880881234567',
    name: 'Customer Name',
    expected_amount: 100000,
    is_single_use: true,
    status: 'ACTIVE',
    expiration_date: '2025-11-23T12:00:00Z'
  }
}
```

---

## Support & Resources

- **Xendit Documentation**: https://docs.xendit.co
- **Xendit Dashboard**: https://dashboard.xendit.co
- **Support Email**: support@xendit.co
- **Status Page**: https://status.xendit.co

---

## Notes

- VA number format akan berbeda per bank
- Beberapa bank require minimum/maximum amount
- Expiration date maksimal 31 hari dari creation
- Webhook adalah critical untuk update payment status
- Always test di sandbox sebelum production
