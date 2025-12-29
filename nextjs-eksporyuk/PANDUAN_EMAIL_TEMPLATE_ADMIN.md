# 📧 PANDUAN LENGKAP EMAIL TEMPLATE SYSTEM - ADMIN

## 🎯 Overview

Sistem Email Template di EksporYuk memungkinkan admin untuk mengelola semua email yang dikirim platform dengan mudah, **tanpa perlu coding HTML**. Admin cukup menulis konten dalam plain text, dan sistem akan otomatis menambahkan header (logo) dan footer dari pengaturan.

## ✨ Fitur Utama

### 1. **Plain Text Content** (Mudah Edit)
- ✅ Admin menulis konten email dalam **teks biasa**
- ✅ Tidak perlu tahu HTML
- ✅ Gunakan variabel dinamis seperti `{{name}}`, `{{email}}`, dll
- ✅ Header dan footer otomatis ditambahkan dari Settings

### 2. **Centralized Settings** (Pengaturan Terpusat)
- ✅ Logo perusahaan (muncul di semua email)
- ✅ Email footer (alamat, kontak, social media)
- ✅ Copyright text
- ✅ Warna brand

### 3. **Template Categories** (Kategori Lengkap)
- 📧 **SYSTEM** - Email verifikasi, reset password
- 👑 **MEMBERSHIP** - Welcome member, renewal reminder
- 🤝 **AFFILIATE** - Welcome affiliate, commission notification
- 💳 **PAYMENT** - Payment success, invoice
- 📢 **MARKETING** - Promo, newsletter
- 🔔 **NOTIFICATION** - Update, reminder

## 🚀 Cara Menggunakan

### A. PENGATURAN AWAL (Settings Tab)

1. **Buka Admin Panel**
   ```
   http://localhost:3000/admin/branded-templates
   ```

2. **Klik Tab "Settings"**

3. **Upload Logo** (Opsional tapi Recommended)
   - Klik "Choose File" di bagian Logo
   - Upload logo PNG/JPG (maks 2MB)
   - Logo akan muncul di header semua email

4. **Isi Email Footer Settings**
   
   **Company Information:**
   - Email Footer Company: `PT EksporYuk Indonesia`
   - Email Footer Text: `Platform Edukasi & Mentoring Ekspor Terpercaya`
   - Email Footer Address: `Jl. Sudirman No. 123, Jakarta Selatan`
   
   **Contact Information:**
   - Email Support: `support@eksporyuk.com`
   - Website URL: `https://eksporyuk.com`
   
   **Social Media Links** (Opsional):
   - Instagram: `https://instagram.com/eksporyuk`
   - Facebook: `https://facebook.com/eksporyuk`
   - LinkedIn: `https://linkedin.com/company/eksporyuk`
   
   **Legal:**
   - Copyright Text: `EksporYuk. All rights reserved.`

5. **Klik "Simpan Pengaturan"**

### B. MEMBUAT TEMPLATE BARU

1. **Klik Tab "Create"**

2. **Isi Form Template**

   **Basic Information:**
   - Name: `Welcome Email - New Member Premium`
   - Description: `Email selamat datang untuk member premium baru`
   - Slug: `welcome-email-premium` (otomatis dari name)
   
   **Category & Type:**
   - Category: `MEMBERSHIP`
   - Type: `EMAIL`
   
   **Email Content:**
   - Subject: `Selamat Datang di EksporYuk Premium, {{name}}!`
   - Content (Plain Text):
     ```
     Halo {{name}},
     
     Selamat bergabung dengan EksporYuk Premium! 🎉
     
     Kami sangat senang Anda menjadi bagian dari komunitas eksportir terbaik di Indonesia.
     
     Dengan membership Premium Anda, sekarang Anda bisa:
     - Akses semua materi pembelajaran ekspor
     - Konsultasi langsung dengan mentor expert
     - Download template dokumen ekspor
     - Bergabung di grup WhatsApp eksklusif
     
     Membership Anda aktif hingga: {{expiryDate}}
     
     Jangan ragu untuk menghubungi kami jika ada pertanyaan!
     
     Salam sukses,
     Tim EksporYuk
     ```
   
   **Call to Action (Opsional):**
   - CTA Text: `Mulai Belajar Sekarang`
   - CTA Link: `https://eksporyuk.com/dashboard`
   
   **Status:**
   - Active: ✅ (Aktifkan template)
   - Default: ❌ (Kecuali ini template utama untuk kategori)

3. **Klik "Create Template"**

### C. EDIT TEMPLATE EXISTING

1. **Klik Tab "List"**
2. **Cari template yang ingin diedit**
3. **Klik tombol "Edit" (icon pensil)**
4. **Update konten**
5. **Klik "Update Template"**

### D. TEST EMAIL

⚠️ **Penting: Lakukan test sebelum production!**

1. **Scroll ke bagian "Test Email dengan Mailketing API"** di Settings tab

2. **Pilih Template** yang ingin ditest

3. **Masukkan Email Tujuan**
   ```
   Contoh: youremail@gmail.com
   ```

4. **Klik "Kirim Test"**

5. **Cek Email Inbox**
   - Periksa inbox (dan folder spam)
   - Pastikan logo muncul
   - Pastikan footer lengkap
   - Pastikan konten sesuai

## 📝 Variabel Dinamis (Shortcodes)

Gunakan variabel ini di Subject atau Content untuk data dinamis:

### User Data
- `{{name}}` atau `{{userName}}` - Nama user
- `{{email}}` atau `{{userEmail}}` - Email user
- `{{phone}}` - Nomor telepon
- `{{role}}` - Role user (MEMBER_PREMIUM, AFFILIATE, dll)

### Membership Data
- `{{membershipPlan}}` - Nama paket membership
- `{{expiryDate}}` - Tanggal kadaluarsa
- `{{daysLeft}}` - Sisa hari aktif

### Transaction Data
- `{{invoiceNumber}}` - Nomor invoice
- `{{amount}}` atau `{{amountFormatted}}` - Total bayar
- `{{paymentMethod}}` - Metode pembayaran
- `{{transactionDate}}` - Tanggal transaksi

### Affiliate Data
- `{{affiliateCode}}` - Kode affiliate
- `{{commission}}` atau `{{commissionFormatted}}` - Komisi
- `{{referralCount}}` - Jumlah referral

### System Data
- `{{siteName}}` - Nama platform (EksporYuk)
- `{{siteUrl}}` - URL platform
- `{{supportEmail}}` - Email support
- `{{currentDate}}` - Tanggal hari ini

### Contoh Penggunaan:
```
Subject: Komisi Rp {{commission}} Telah Masuk, {{name}}!

Content:
Halo {{name}},

Selamat! Anda mendapatkan komisi sebesar {{commission}} dari referral.

Detail:
- Kode Affiliate: {{affiliateCode}}
- Total Referral: {{referralCount}} orang
- Invoice: {{invoiceNumber}}

Komisi sudah masuk ke wallet Anda dan bisa dicairkan kapan saja.

Terima kasih sudah menjadi affiliate EksporYuk!
```

## 🎨 Background Design Options

Pilih desain background email di bagian **Custom Branding**:

1. **Simple** (Default) - Background putih bersih
2. **Blue** - Gradient biru lembut
3. **Green** - Gradient hijau fresh
4. **Elegant** - Gradient abu-abu elegan
5. **Warm** - Gradient orange hangat
6. **Modern** - Dark mode dengan slate

## ⚙️ Integration dengan Sistem

### Automatic Email Sending

Email otomatis terkirim saat event terjadi:

1. **User Registration** → `email-verification`
2. **Password Reset** → `password-reset-request`
3. **Payment Success** → `payment-success-notification`
4. **Membership Welcome** → `welcome-email-new-member`
5. **Membership Expiring** → `membership-expiring-soon`
6. **Commission Earned** → `commission-earned-notification`

### Manual Email via API

Developer bisa kirim email dengan code:

```typescript
import { sendBrandedEmail } from '@/lib/branded-template-helpers'

await sendBrandedEmail({
  templateSlug: 'welcome-email-new-member',
  recipientEmail: user.email,
  recipientName: user.name,
  data: {
    membershipPlan: 'Premium',
    expiryDate: '31 Desember 2025'
  }
})
```

## 📊 Analytics & Tracking

Setiap template memiliki analytics:

- **Usage Count** - Berapa kali template digunakan
- **Last Used** - Kapan terakhir digunakan
- **Success Rate** - Persentase email terkirim
- **Error Logs** - Jika ada error

Lihat di kolom template atau klik template untuk detail.

## 🔧 Troubleshooting

### Email Tidak Terkirim?

1. **Cek Mailketing API Key**
   - Pastikan `MAILKETING_API_KEY` sudah di .env.local
   - Test dengan "Kirim Test" di Settings tab

2. **Cek Template Status**
   - Pastikan template `isActive = true`
   - Pastikan template type = `EMAIL`

3. **Cek Logs**
   - Buka browser console (F12)
   - Lihat error message di terminal server

### Logo Tidak Muncul di Email?

1. **Upload Logo**
   - Logo harus di-upload via Settings tab
   - Format: PNG/JPG, maks 2MB

2. **Logo URL Accessible**
   - Logo harus accessible via public URL
   - Tidak bisa localhost untuk email client

3. **Alternative**
   - Gunakan URL CDN: `https://via.placeholder.com/150x60`
   - Upload ke hosting/CDN public

### Footer Tidak Lengkap?

1. **Isi Semua Field di Settings**
   - Company, Address, Email, Phone
   - Social media (optional)
   - Copyright text

2. **Klik "Simpan Pengaturan"**

3. **Test ulang email**

## 🎯 Best Practices

### 1. **Gunakan Nama Jelas**
❌ Bad: `template1`, `email-test`  
✅ Good: `welcome-email-new-member`, `commission-earned-notification`

### 2. **Subject yang Menarik**
❌ Bad: `Notifikasi`  
✅ Good: `Selamat Datang di EksporYuk, {{name}}! 🎉`

### 3. **Content Singkat & Jelas**
- Maksimal 3-4 paragraf
- Gunakan bullet points
- Tambahkan emoji untuk friendly tone
- Sertakan CTA button jika perlu action

### 4. **Test Sebelum Production**
- Selalu test email ke email pribadi
- Cek di berbagai email client (Gmail, Outlook)
- Pastikan responsive di mobile

### 5. **Update Regular**
- Review template setiap bulan
- Update data yang expired
- Tambahkan promo/info terbaru

## 📚 Template Examples

### Welcome Email
```
Subject: Selamat Datang di EksporYuk, {{name}}! 🎉

Content:
Halo {{name}},

Terima kasih sudah bergabung dengan EksporYuk!

Kami adalah platform pembelajaran ekspor terlengkap di Indonesia dengan lebih dari 10,000 member aktif.

Dengan membership {{membershipPlan}}, Anda bisa:
✅ Akses semua materi pembelajaran
✅ Konsultasi dengan mentor expert
✅ Download template dokumen ekspor
✅ Bergabung di komunitas eksportir

Membership aktif hingga: {{expiryDate}}

Mari mulai perjalanan ekspor Anda!

Salam,
Tim EksporYuk
```

### Payment Success
```
Subject: Pembayaran Berhasil - Invoice {{invoiceNumber}}

Content:
Halo {{name}},

Pembayaran Anda telah berhasil diproses! 🎉

Detail Pembayaran:
- Invoice: {{invoiceNumber}}
- Jumlah: {{amount}}
- Metode: {{paymentMethod}}
- Tanggal: {{transactionDate}}

Membership Anda sudah aktif dan bisa langsung digunakan.

Terima kasih atas kepercayaan Anda!
```

### Commission Notification
```
Subject: 💰 Komisi {{commission}} Telah Masuk!

Content:
Selamat {{name}}!

Anda mendapatkan komisi baru! 🎊

Detail Komisi:
- Jumlah: {{commission}}
- Dari: {{invoiceNumber}}
- Kode Affiliate: {{affiliateCode}}
- Total Referral: {{referralCount}} orang

Komisi sudah masuk ke wallet dan bisa dicairkan kapan saja.

Keep sharing dan dapatkan komisi lebih banyak!
```

## 🔐 Security & Performance

### Security
- ✅ Email konten di-sanitize otomatis
- ✅ Variabel di-escape untuk prevent XSS
- ✅ API endpoint protected (ADMIN only)
- ✅ Rate limiting untuk prevent spam

### Performance
- ✅ Email queue system (background job)
- ✅ Template caching
- ✅ Lazy loading untuk preview
- ✅ Optimized HTML output

## 📞 Support

Jika ada masalah atau pertanyaan:

1. **Check Documentation** - Baca panduan ini dulu
2. **Test Scripts** - Run `node test-complete-email-system.js`
3. **Developer Support** - Hubungi tim developer
4. **Emergency** - Email: developer@eksporyuk.com

---

**Last Updated:** 29 Desember 2025  
**Version:** 2.0  
**Author:** EksporYuk Development Team
