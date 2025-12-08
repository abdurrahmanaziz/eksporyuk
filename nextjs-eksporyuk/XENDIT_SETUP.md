# Xendit Integration Setup Guide

## Overview
Sistem payment gateway menggunakan Xendit untuk mendukung berbagai metode pembayaran:
- Invoice Payment (Multi-payment methods)
- Virtual Account (BCA, BNI, BRI, Mandiri, BSI, CIMB)
- E-Wallet (OVO, DANA, GoPay, LinkAja)
- QR Code Payment

## Environment Variables

Tambahkan ke `.env.local`:

```env
# Xendit Configuration
XENDIT_SECRET_KEY="xnd_development_your_secret_key_here"
XENDIT_WEBHOOK_TOKEN="your_webhook_verification_token_here"
XENDIT_ENVIRONMENT="development"
```

## Getting Started

### 1. Daftar ke Xendit
1. Buka https://dashboard.xendit.co/register
2. Daftar akun business
3. Lengkapi verifikasi dokumen
4. Dapatkan API keys dari dashboard

### 2. Setup API Keys
1. Login ke Xendit Dashboard
2. Pergi ke Settings > API Keys
3. Generate Secret Key untuk development/production
4. Generate Webhook Token untuk verification
5. Masukkan ke environment variables

### 3. Setup Webhook
1. Pergi ke Settings > Webhooks
2. Tambahkan webhook URL: `https://yourdomain.com/api/webhooks/xendit`
3. Pilih events:
   - invoice.paid
   - invoice.expired
   - virtual_account.payment
   - ewallet.capture.completed

## API Endpoints

### 1. Checkout API
```
POST /api/checkout
```
Membuat transaksi dan Xendit invoice otomatis.

### 2. Payment Methods

#### Virtual Account
```
POST /api/payments/virtual-account
{
  "transactionId": "TXN123",
  "bankCode": "BCA",
  "customerName": "John Doe"
}
```

#### E-Wallet
```
POST /api/payments/ewallet
{
  "transactionId": "TXN123",
  "ewalletType": "OVO",
  "phoneNumber": "081234567890"
}
```

### 3. Webhook Handler
```
POST /api/webhooks/xendit
```
Automatically handles payment confirmations.

## Payment Flow

### 1. Customer Journey
1. Customer mengisi form checkout di sales page
2. System membuat transaction record di database
3. System membuat Xendit invoice secara otomatis
4. Customer diredirect ke halaman payment
5. Customer memilih metode pembayaran
6. System redirect ke Xendit payment page atau generate VA/eWallet
7. Customer melakukan pembayaran
8. Xendit kirim webhook ke sistem
9. System update status transaksi dan aktivasi membership

### 2. Admin Dashboard
- Monitor semua transaksi real-time
- Update status manual jika diperlukan
- Export data untuk reconciliation

## Payment Methods Supported

### 1. Xendit Invoice (Recommended)
- **Keunggulan**: All-in-one payment page
- **Metode**: VA, E-Wallet, Credit Card, QRIS
- **User Experience**: Seamless, professional
- **Integration**: Automatic via checkout API

### 2. Virtual Account
- **Banks**: BCA, BNI, BRI, Mandiri, BSI, CIMB
- **Features**: Single use, 24-hour expiry
- **User Experience**: Generate VA number, pay via ATM/mobile banking

### 3. E-Wallet
- **Providers**: OVO, DANA, GoPay, LinkAja
- **Features**: Push notification, mobile redirect
- **User Experience**: Open app, confirm payment

### 4. QR Code (Coming Soon)
- **Features**: Universal QRIS
- **User Experience**: Scan and pay

## Testing

### Development Mode
1. Use Xendit test credentials
2. Use test payment methods
3. Webhook dapat di-test dengan ngrok atau similar

### Production Checklist
- [ ] API keys production tersedia
- [ ] Webhook URL production registered
- [ ] SSL certificate aktif
- [ ] Error monitoring setup
- [ ] Logging payment transactions
- [ ] Backup webhook handler

## Security Notes

1. **API Key Security**
   - Never expose secret key di frontend
   - Store di environment variables
   - Rotate keys secara berkala

2. **Webhook Verification**
   - Selalu verify webhook signature
   - Validate request headers
   - Log suspicious activities

3. **Transaction Verification**
   - Double-check amount di webhook
   - Verify external_id matches
   - Prevent duplicate processing

## Monitoring & Logs

### Key Metrics
- Payment success rate
- Average payment time
- Popular payment methods
- Failed payment reasons

### Log Events
- Payment attempts
- Webhook received
- Transaction status changes
- Error occurrences

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook URL accessibility
   - Verify SSL certificate
   - Check webhook token

2. **Payment Failed**
   - Check Xendit dashboard for details
   - Verify customer details
   - Check payment method availability

3. **Duplicate Transactions**
   - Implement idempotency checks
   - Use unique external_id
   - Add transaction locks

### Support
- Xendit Documentation: https://docs.xendit.co
- Xendit Support: support@xendit.co
- Emergency Contact: admin WhatsApp

## Cost Structure

### Xendit Fees (Indicative)
- Virtual Account: 4,000 IDR per transaction
- E-Wallet: 2.9% + 2,000 IDR
- Credit Card: 2.9% + 2,000 IDR
- QRIS: 0.7%

*Fees dapat berubah, check latest pricing di Xendit dashboard*