# 📧 PANDUAN LENGKAP EMAIL TEMPLATES - ADMIN EKSPORYUK

## ✅ STATUS SISTEM

**SISTEM EMAIL TEMPLATES SIAP DIGUNAKAN 100%**

✅ Database schema lengkap dengan semua field email footer  
✅ API `/api/admin/settings` handle semua email footer fields  
✅ Template engine otomatis load logo & footer dari database  
✅ Mailketing API integration untuk pengiriman email  
✅ 6 template email siap pakai dengan plain text  
✅ Test email functionality berfungsi sempurna  

---

## 📋 CARA MENGGUNAKAN EMAIL TEMPLATES

### 1. SETUP AWAL (Hanya Sekali)

#### A. Upload Logo Perusahaan
1. Buka: `http://localhost:3000/admin/branded-templates`
2. Klik tab **"Settings"**
3. Di bagian "Logo Perusahaan", klik **"Upload Logo"**
4. Pilih file logo (format: PNG, JPG, max 2MB)
5. Logo akan tampil di header semua email

#### B. Isi Informasi Footer Email
Scroll ke bagian "Email Footer Settings" dan isi:

- **Nama Perusahaan**: PT EksporYuk Indonesia
- **Email Support**: support@eksporyuk.com
- **Alamat**: Jl. Sudirman No. 123, Jakarta Selatan
- **Nomor Telepon**: +62 21 1234 5678 (optional)
- **Website URL**: https://eksporyuk.com
- **Teks Footer**: Platform Edukasi & Mentoring Ekspor Terpercaya
- **Copyright Text**: EksporYuk. All rights reserved.

#### C. Isi Link Social Media (Optional)
- Instagram: https://instagram.com/eksporyuk
- Facebook: https://facebook.com/eksporyuk  
- LinkedIn: https://linkedin.com/company/eksporyuk

#### D. Simpan Pengaturan
- Klik tombol **"Simpan Pengaturan"**
- Lihat preview footer email di bawah form

---

### 2. MENGEDIT TEMPLATE EMAIL

#### A. Lihat Daftar Template
1. Buka tab **"List"**
2. Anda akan melihat 6 template email:
   - ✅ Welcome Email - New Member
   - ✅ Payment Success Notification
   - ✅ Membership Expiring Soon
   - ✅ Welcome Email - New Affiliate
   - ✅ Password Reset Request
   - ✅ Commission Earned Notification

#### B. Edit Template
1. Klik tombol **"Edit"** (ikon pensil) pada template yang ingin diedit
2. Anda akan masuk ke form edit dengan:
   - **Subject**: Judul email (bisa pakai shortcode)
   - **Content**: Isi email (PLAIN TEXT, mudah diedit)
   - **CTA Text**: Teks tombol (contoh: "Buka Dashboard")
   - **CTA Link**: Link tombol (contoh: https://eksporyuk.com/dashboard)

#### C. Gunakan Shortcodes
Shortcode akan otomatis diganti dengan data user:

**Data User:**
- `{{name}}` → Nama lengkap user
- `{{email}}` → Email user
- `{{phone}}` → Nomor telepon
- `{{role}}` → Role user (ADMIN, MEMBER, AFFILIATE, dll)

**Data Membership:**
- `{{membershipPlan}}` → Nama paket membership
- `{{expiryDate}}` → Tanggal berakhir
- `{{daysLeft}}` → Sisa hari aktif

**Data Transaksi:**
- `{{invoiceNumber}}` → Nomor invoice
- `{{amountFormatted}}` → Total pembayaran (Rp format)
- `{{productName}}` → Nama produk/membership
- `{{paymentMethod}}` → Metode pembayaran
- `{{transactionDate}}` → Tanggal transaksi

**Data Affiliate:**
- `{{affiliateCode}}` → Kode affiliate
- `{{commissionFormatted}}` → Komisi yang didapat (Rp format)
- `{{referralLink}}` → Link referral
- `{{totalEarnings}}` → Total earnings

#### D. Contoh Template yang Baik

```
Halo {{name}},

Selamat! Pembayaran Anda telah berhasil diproses! 🎉

Detail Pembayaran:
• Invoice: {{invoiceNumber}}
• Produk: {{productName}}
• Jumlah: {{amountFormatted}}
• Metode: {{paymentMethod}}
• Tanggal: {{transactionDate}}

Membership Anda sekarang AKTIF!

Apa selanjutnya?
✅ Login ke dashboard Anda
✅ Mulai akses materi pembelajaran
✅ Jadwalkan sesi konsultasi

Jika ada pertanyaan, silakan hubungi tim support kami.

Terima kasih!
Tim EksporYuk
```

**TIPS:**
- ✅ Gunakan plain text biasa (TIDAK PAKAI HTML)
- ✅ Pakai emoji untuk lebih menarik (📧 🎉 ✅ ❌ 💰)
- ✅ Gunakan bullet point (• atau ✅) untuk list
- ✅ Pisahkan paragraf dengan enter 2x
- ✅ Jangan terlalu panjang (max 300 kata)
- ✅ Selalu ada CTA button untuk action

#### E. Simpan Template
- Klik tombol **"Simpan Template"**
- Template siap digunakan oleh sistem

---

### 3. TEST EMAIL SEBELUM DIGUNAKAN

#### A. Kirim Test Email
1. Di tab **"Settings"**, scroll ke bagian **"Test Email dengan Mailketing API"**
2. Pilih template yang ingin di-test
3. Masukkan email Anda sendiri
4. Klik **"Kirim Test"**
5. Cek inbox email Anda (termasuk folder spam)

#### B. Cek Hasil Email
Email yang terkirim akan otomatis include:
- ✅ **Header** dengan logo perusahaan dari Settings
- ✅ **Konten** template yang Anda edit (plain text menjadi HTML otomatis)
- ✅ **CTA Button** dengan warna dari Settings
- ✅ **Footer** dengan info perusahaan dari Settings
- ✅ **Social Media Links** jika sudah diisi
- ✅ **Copyright** dan unsubscribe info

#### C. Jika Email Tidak Masuk
1. Cek folder **Spam/Junk**
2. Pastikan MAILKETING_API_KEY sudah di-configure di `.env.local`
3. Jika mode development, email tidak benar-benar terkirim (simulasi saja)
4. Untuk production, pastikan API key valid

---

### 4. MENGGUNAKAN TEMPLATE DI CODE

Template email akan otomatis dipakai oleh sistem pada event tertentu:

#### A. Auto-Send Events
- ✅ **Welcome Email** → User baru register
- ✅ **Payment Success** → Pembayaran berhasil
- ✅ **Membership Expiring** → 7 hari sebelum expired
- ✅ **Affiliate Welcome** → Affiliate approved
- ✅ **Password Reset** → User request reset password
- ✅ **Commission Earned** → Affiliate dapat komisi

#### B. Manual Send via Code
Jika developer perlu kirim email manual:

```typescript
import { sendBrandedEmail } from '@/lib/branded-template-helpers'

// Kirim welcome email
await sendBrandedEmail({
  templateSlug: 'welcome-email-new-member',
  recipientEmail: user.email,
  recipientName: user.name,
  data: {
    membershipPlan: 'Premium',
    registrationDate: new Date().toLocaleDateString('id-ID')
  },
  userId: user.id
})
```

---

## 📊 MONITORING & ANALYTICS

### Lihat Usage Template
1. Di tab **"List"**, setiap template menampilkan:
   - **Usage Count**: Berapa kali template digunakan
   - **Last Used**: Kapan terakhir digunakan

### Database Tracking
Sistem otomatis mencatat setiap pengiriman email di table:
- `BrandedTemplate` → Template dan usage count
- `BrandedTemplateUsage` → Log detail setiap pengiriman

---

## 🔧 TROUBLESHOOTING

### Email Tidak Terkirim
**Cek:**
1. MAILKETING_API_KEY di `.env.local` valid?
2. Email recipient valid?
3. Template aktif (isActive = true)?
4. Lihat console log untuk error message

### Template Tidak Muncul
**Solusi:**
1. Jalankan: `node seed-email-templates.js`
2. Refresh page browser
3. Cek database apakah template ada

### Shortcode Tidak Ter-replace
**Pastikan:**
1. Gunakan format `{{namaVariable}}` (bukan `{namaVariable}`)
2. Nama variable sesuai dengan data yang dikirim
3. Data variable tidak null/undefined

### Logo Tidak Muncul di Email
**Cek:**
1. Logo sudah di-upload via Settings?
2. Logo URL bukan localhost (email client tidak bisa akses localhost)
3. Gunakan URL public (https://...)

### Footer Tidak Sesuai
**Solusi:**
1. Buka tab Settings
2. Update "Email Footer Settings"
3. Klik "Simpan Pengaturan"
4. Test ulang email

---

## 🎯 BEST PRACTICES

### DO ✅
- Gunakan plain text yang mudah dibaca
- Pakai shortcode untuk personalisasi
- Include CTA yang jelas
- Test email sebelum go live
- Update info footer jika ada perubahan perusahaan
- Monitor usage count untuk optimize template

### DON'T ❌
- Jangan pakai HTML di content (sistem otomatis handle)
- Jangan terlalu panjang (max 300 kata)
- Jangan lupa shortcode `{{name}}` di greeting
- Jangan hardcode data (pakai shortcode)
- Jangan lupa test email dulu

---

## 📞 SUPPORT

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini
2. Lihat console log untuk error detail
3. Test ulang dengan email berbeda
4. Contact developer team

---

## 📝 CHANGELOG

### Version 1.0 (29 Desember 2025)
✅ Initial release dengan 6 template email  
✅ Plain text content (mudah edit admin)  
✅ Auto header/footer dari Settings  
✅ Mailketing API integration  
✅ Test email functionality  
✅ Usage tracking & analytics  

---

**SISTEM SIAP DIGUNAKAN! 🚀**

Mulai dari upload logo → edit template → test email → go live!
