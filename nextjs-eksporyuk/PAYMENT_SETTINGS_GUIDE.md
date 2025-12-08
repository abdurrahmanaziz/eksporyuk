# Payment Settings & Follow-up System

## 📋 Overview
Sistem pembayaran dengan countdown timer yang dapat dikonfigurasi dan sistem follow-up otomatis untuk reminder pembayaran yang tertunda.

## ⚙️ Fitur Utama

### 1. **Countdown Timer dengan Settingan Admin**
- Admin dapat mengatur waktu kadaluarsa pembayaran (default: 72 jam / 3 hari)
- Range: 1 jam - 168 jam (7 hari)
- Timer otomatis muncul di halaman pembayaran
- Xendit invoice duration mengikuti settingan ini

### 2. **Harga Normal Coret & Diskon**
- Menampilkan harga asli dengan garis coret
- Menampilkan jumlah diskon dalam warna hijau
- Total pembayaran setelah diskon

### 3. **Metode Pembayaran Sesuai Pilihan User**
- Menampilkan metode yang dipilih user dengan icon
- Mendukung: Bank Transfer (VA), E-Wallet, QRIS, Retail Outlet, PayLater
- Bank Transfer menampilkan bank spesifik yang dipilih (BCA, BRI, dll)

### 4. **Langkah Pembayaran Xendit**
- 4 metode dengan collapsible instructions:
  - ATM Bersama
  - ATM Prima
  - iBanking
  - mBanking
- Mengikuti panduan resmi Xendit

### 5. **Tombol Butuh Bantuan & Konfirmasi**
- WhatsApp Admin button dengan pre-filled message
- Email Support button
- Konfirmasi Pembayaran Manual button
- Template pesan otomatis dengan detail transaksi

### 6. **Sistem Follow-up Otomatis**
- Reminder otomatis jika belum bayar
- 3 level reminder:
  - 1 jam setelah checkout
  - 24 jam setelah checkout  
  - 48 jam setelah checkout (jika expiry > 48 jam)
- Custom message dengan placeholder
- Auto-cancel transaksi setelah expiry

## 🔧 Cara Menggunakan

### Akses Halaman Settings
1. Login sebagai Admin
2. Kunjungi: `/admin/settings/payment`
3. Atau dari dashboard admin → Settings → Payment

### Mengatur Payment Expiry
```
1. Masukkan waktu dalam JAM (1-168)
2. Contoh: 
   - 24 jam = 1 hari
   - 72 jam = 3 hari (default)
   - 168 jam = 7 hari (maksimal)
3. Klik "Simpan Pengaturan"
```

### Mengatur Follow-up Messages
```
1. Toggle "Aktifkan Follow-up Otomatis"
2. Pilih reminder mana yang ingin diaktifkan:
   ☑️ Reminder 1 Jam
   ☑️ Reminder 24 Jam
   ☑️ Reminder 48 Jam
3. Customize pesan untuk masing-masing reminder
4. Gunakan placeholder:
   - {name} → Nama customer
   - {amount} → Jumlah pembayaran
   - {timeLeft} → Waktu tersisa
   - {paymentUrl} → Link pembayaran
```

### Example Message Templates
**1 Hour Reminder:**
```
Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu. 
Segera selesaikan dalam {timeLeft}. 
Link: {paymentUrl}
```

**24 Hour Reminder:**
```
Reminder: Pembayaran Anda akan kadaluarsa dalam {timeLeft}. 
Segera bayar sebelum terlambat!
```

**48 Hour Reminder:**
```
Last chance! Pembayaran Anda akan dibatalkan otomatis jika tidak diselesaikan dalam {timeLeft}.
```

## 🤖 Cron Job Setup

### Vercel (Production)
Cron job sudah dikonfigurasi di `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/payment-followup",
      "schedule": "0 * * * *"
    }
  ]
}
```
**Jadwal**: Setiap jam (0 menit)

### Local Development
Untuk test di local, call manual:
```bash
curl -X GET http://localhost:3000/api/cron/payment-followup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Environment Variables
Tambahkan di `.env`:
```
CRON_SECRET=your_secure_random_string
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📊 Database Schema

### Settings Table
```prisma
model Settings {
  id                          Int      @id @default(1)
  paymentExpiryHours          Int      @default(72)
  followUpEnabled             Boolean  @default(true)
  followUp1HourEnabled        Boolean  @default(true)
  followUp24HourEnabled       Boolean  @default(true)
  followUp48HourEnabled       Boolean  @default(true)
  followUpMessage1Hour        String?
  followUpMessage24Hour       String?
  followUpMessage48Hour       String?
}
```

### Transaction Metadata
```json
{
  "originalAmount": 500000,
  "discountAmount": 50000,
  "paymentMethod": "bank_transfer",
  "paymentChannel": "BCA",
  "expiryHours": 72,
  "xenditVANumber": "1234567890",
  "xenditBankCode": "BCA",
  "followUps": [
    {
      "sentAt": "2025-11-21T10:00:00.000Z",
      "type": "1hour",
      "message": "..."
    }
  ]
}
```

## 🔍 Monitoring & Logs

### Check Follow-up Status
```sql
SELECT 
  id,
  customerName,
  customerEmail,
  amount,
  status,
  createdAt,
  metadata->>'followUps' as followups
FROM Transaction
WHERE status = 'PENDING'
ORDER BY createdAt DESC;
```

### Check Settings
```sql
SELECT * FROM Settings WHERE id = 1;
```

## 🚨 Troubleshooting

### Follow-up tidak terkirim
1. Cek apakah `followUpEnabled = true`
2. Verifikasi cron job running (check Vercel logs)
3. Pastikan CRON_SECRET match di header

### Countdown timer tidak akurat
1. Refresh halaman pembayaran
2. Check metadata transaksi: `expiryHours`
3. Pastikan `createdAt` timestamp benar

### Harga coret tidak muncul
1. Pastikan ada diskon/coupon yang dipakai
2. Check `originalAmount` dan `discountAmount` di metadata
3. Verify transaction metadata saved correctly

## 📞 Support & Integration

### WhatsApp Integration (Future)
Siap diintegrasikan dengan:
- **StarSender API** untuk WhatsApp blast
- **Fonnte** untuk WhatsApp gateway
- **WooCommerce** untuk e-commerce

### Email Integration
Ready untuk:
- **Mailchimp** transactional emails
- **SendGrid** untuk email automation
- **AWS SES** untuk volume tinggi

## 📝 Notes

- **Auto-cancel**: Transaksi otomatis dibatalkan setelah expiry time
- **Manual confirmation**: Tetap tersedia via WhatsApp button
- **Multiple reminders**: User bisa dapat 3 reminder berbeda
- **Flexible timing**: Admin bebas atur waktu expiry 1-168 jam

---

**Created**: November 2025  
**Version**: 1.0.0  
**Last Updated**: November 21, 2025
