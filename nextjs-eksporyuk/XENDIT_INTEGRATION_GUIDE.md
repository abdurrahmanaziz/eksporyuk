# Xendit Integration Guide - Ekspor Yuk

## 🎉 Status: READY TO TEST!

Xendit payment integration sudah aktif dan siap digunakan. Semua metode pembayaran sudah terintegrasi dengan Xendit API.

## 📋 Backup Files

Backup lengkap tersimpan di folder: **`backup-payment-fix-2025-11-24-182650/`**

Files yang di-backup:
- `checkout-simple-route.ts` - Main checkout API
- `checkout-route.ts` - General checkout & transaction API
- `payment-page.tsx` - Payment display page
- `invoice-generator.ts` - Invoice number generator
- `auth-options.ts` - NextAuth configuration
- `env.local.backup` - Environment variables

## 🚀 Metode Pembayaran yang Tersedia

### 1. Virtual Account (Bank Transfer)
**Supported Banks:**
- BCA (Bank Central Asia)
- Mandiri (Bank Mandiri)
- BNI (Bank Negara Indonesia)
- BRI (Bank Rakyat Indonesia)
- BSI (Bank Syariah Indonesia)
- CIMB Niaga
- Permata

**How it works:**
1. User pilih bank
2. System generate Virtual Account number via Xendit
3. User transfer ke VA number
4. Xendit webhook auto-konfirmasi payment
5. Transaction status update ke SUCCESS
6. Membership/course auto-activated

### 2. E-Wallet
**Supported E-Wallets:**
- OVO
- DANA
- GoPay
- LinkAja

**How it works:**
1. User pilih e-wallet & input phone number
2. System create Xendit e-wallet payment
3. User redirect ke Xendit checkout page
4. User login & confirm payment di app
5. Xendit webhook auto-konfirmasi
6. Transaction SUCCESS

### 3. QRIS
**How it works:**
1. User pilih QRIS
2. System generate QR code via Xendit
3. User scan QR dengan any payment app
4. User confirm payment
5. Xendit webhook auto-konfirmasi
6. Transaction SUCCESS

## 🔧 Technical Implementation

### API Endpoint
```
POST /api/checkout/simple
```

### Request Body
```json
{
  "planId": "cmicxql7i0002um78te3lq5be",
  "membershipSlug": "beli-paket-3bulan",
  "priceOption": {
    "duration": "THREE_MONTHS",
    "label": "Paket 3 Bulan",
    "price": 360000,
    "discount": 40
  },
  "finalPrice": 216000,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "whatsapp": "081234567890",
  "paymentMethod": "bank_transfer",
  "paymentChannel": "BCA"
}
```

### Response
```json
{
  "success": true,
  "transactionId": "cmid26dm40001umzwclixgdo8",
  "invoiceNumber": "INV02",
  "amount": 216000,
  "paymentUrl": "http://localhost:3000/checkout/payment/cmid26dm40001umzwclixgdo8",
  "xenditData": {
    "accountNumber": "880881763981234",
    "bankCode": "BCA",
    "checkoutUrl": null,
    "qrString": null
  }
}
```

## 🧪 Testing Guide

### Test Mode Credentials
Sudah di-configure di `.env.local`:
```env
XENDIT_SECRET_KEY=xnd_development_O46JfOtygef9kMNsK+ZPGT+ZZ9b3ooF4w3Dn+R1ye4=
XENDIT_WEBHOOK_TOKEN=xendit_webhook_token_development_demo
XENDIT_MODE=test
```

### Step 1: Test Virtual Account

1. **Create Transaction:**
   ```bash
   # Via Browser
   http://localhost:3000/checkout/pro
   - Login dengan akun test
   - Pilih paket membership
   - Pilih "Bank Transfer" → "BCA"
   - Klik "Beli Sekarang"
   ```

2. **Check VA Number:**
   - Payment page akan show VA number
   - Format: 880881763981234 (13 digit)
   - Save VA number untuk testing

3. **Simulate Payment:**
   - Go to Xendit Dashboard → Payments → Virtual Accounts
   - Find your VA transaction
   - Click "Simulate Payment"
   - OR use Xendit Test API:
   ```bash
   curl -X POST https://api.xendit.co/callback_virtual_accounts/external_id={TRANSACTION_ID}/simulate_payment \
   -u xnd_development_YOUR_KEY: \
   -d amount=216000
   ```

4. **Verify Webhook:**
   - Check server logs untuk webhook received
   - Transaction status should update to SUCCESS
   - User should get membership access

### Step 2: Test E-Wallet

1. **Create Transaction with OVO/DANA:**
   ```json
   {
     "paymentMethod": "ewallet",
     "paymentChannel": "OVO",
     "phone": "081234567890"
   }
   ```

2. **Redirect to Checkout:**
   - Response akan include `xenditData.checkoutUrl`
   - User auto-redirect ke Xendit checkout page
   - Login with test account di Xendit
   - Confirm payment

3. **Verify:**
   - Webhook should trigger
   - Transaction SUCCESS
   - Membership activated

### Step 3: Test QRIS

1. **Create Transaction:**
   ```json
   {
     "paymentMethod": "qris",
     "paymentChannel": "QRIS"
   }
   ```

2. **Get QR Code:**
   - Response include `xenditData.qrString`
   - Payment page display QR code
   - Scan with any payment app

3. **Simulate Payment:**
   - Use Xendit QR Code simulator
   - Or actual test payment app

4. **Verify:**
   - Webhook triggers
   - Transaction SUCCESS
   - Access granted

## 🔔 Webhook Configuration

### Webhook URL
```
https://yourdomain.com/api/webhooks/xendit
```

### Configure di Xendit Dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL
3. Subscribe to events:
   - `invoice.paid`
   - `invoice.expired`
   - `va.payment.complete`
   - `ewallet.capture.completed`

### Webhook Handler
File: `src/app/api/webhooks/xendit/route.ts`

**Handled Events:**
- ✅ `invoice.paid` - Update transaction SUCCESS, activate membership
- ✅ `invoice.expired` - Update transaction FAILED
- ✅ `va.payment.complete` - Update transaction SUCCESS (VA)
- ✅ `ewallet.capture.completed` - Update transaction SUCCESS (E-Wallet)

**Auto-Actions on Success:**
- Transaction status → SUCCESS
- Create/Update UserMembership
- Auto-enroll courses
- Auto-join groups
- Auto-grant products
- Add to Mailketing lists
- Revenue distribution

## 📊 Database Schema

### Transaction Fields (Updated)
```typescript
{
  id: string
  invoiceNumber: string // INV01, INV02
  externalId: string // For Xendit reference
  userId: string
  type: 'MEMBERSHIP' | 'COURSE' | 'PRODUCT'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  amount: Decimal
  originalAmount: Decimal
  discountAmount: Decimal
  customerName: string
  customerEmail: string
  customerPhone: string
  customerWhatsapp: string
  reference: string // Xendit payment ID
  paymentProvider: string // 'XENDIT'
  paymentMethod: string // 'VA_BCA', 'EWALLET_OVO', etc
  paymentUrl: string
  paidAt: DateTime
  expiredAt: DateTime
  metadata: JSON // Xendit details, VA number, etc
}
```

## 🎯 Next Steps

### For Local Testing:
1. ✅ Virtual Account simulation via Xendit Dashboard
2. ✅ E-Wallet test dengan test credentials
3. ✅ QRIS test dengan QR simulator

### For Production:
1. Update `.env.local` dengan LIVE credentials:
   ```env
   XENDIT_SECRET_KEY=xnd_production_YOUR_LIVE_KEY
   XENDIT_MODE=live
   ```

2. Update webhook URL di Xendit Dashboard:
   ```
   https://eksporyuk.com/api/webhooks/xendit
   ```

3. Test semua payment methods di production
4. Monitor transaction logs
5. Setup email/WhatsApp notifications

## 🔒 Security Notes

- ✅ Webhook signature verification implemented
- ✅ Transaction idempotency via externalId
- ✅ User auto-creation with validation
- ✅ Payment amount validation
- ✅ Database transaction handling
- ✅ Error logging & fallback

## 📞 Support

### Xendit Resources:
- Dashboard: https://dashboard.xendit.co
- API Docs: https://developers.xendit.co
- Test Cards: https://developers.xendit.co/api-reference/#test-scenarios
- Support: support@xendit.co

### Internal:
- Webhook logs: Check server console
- Transaction history: Prisma Studio or database
- Error tracking: Application logs

---

**Status:** ✅ READY FOR TESTING
**Last Updated:** 2025-11-24
**Version:** 1.0.0
