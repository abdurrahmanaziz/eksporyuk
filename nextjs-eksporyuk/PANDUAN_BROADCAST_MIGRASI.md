# PANDUAN BROADCAST EMAIL MIGRASI

## 📧 Email Template Siap Pakai

Email template sudah dibuat dan siap digunakan di:
```
/email-templates/migration-announcement.html
```

## 🚀 Cara Menggunakan di Admin Broadcast

### Step 1: Buka Admin Broadcast
1. Login sebagai Admin: https://eksporyuk.com/auth/login
2. Navigasi ke: **Admin → Broadcast → Buat Campaign**
3. Atau langsung ke: https://eksporyuk.com/admin/broadcast/create

### Step 2: Konfigurasi Campaign

**Informasi Campaign:**
- **Nama Campaign**: "Migrasi Platform Baru - Announcement"
- **Tipe Campaign**: Email

**Target Audience:**
- **Tipe Target**: Pilih **"Semua User"** (ALL)
- Klik **"Preview Audience"** untuk melihat jumlah penerima

### Step 3: Setup Email Content

**Email Subject:**
```
🚀 Platform Eksporyuk Baru Sudah Live - Login Sekarang!
```

**Email Body:**
Copy-paste seluruh isi file `migration-announcement.html` ke field Email Body.

File terletak di:
```
nextjs-eksporyuk/email-templates/migration-announcement.html
```

**Shortcodes yang Tersedia:**
Template sudah menggunakan shortcode berikut (akan otomatis diganti oleh sistem):
- `{name}` - Nama user
- `{email}` - Email user
- `{memberCode}` - Member ID user

**Call-to-Action:**
- **CTA Text**: "Login Sekarang"
- **CTA Link**: https://eksporyuk.com/auth/login

### Step 4: Jadwalkan atau Kirim

**Option 1: Kirim Sekarang**
- Pilih action: **"Send Now"**
- Klik tombol **"Kirim Campaign"**
- Email akan langsung dikirim ke semua user

**Option 2: Jadwalkan**
- Pilih action: **"Schedule"**
- Pilih tanggal dan waktu pengiriman
- Klik **"Jadwalkan Campaign"**

## 📊 Monitoring & Analytics

Setelah email terkirim, Anda bisa monitor:

1. **Email Statistics**: 
   - Navigate ke: Admin → Broadcast → Statistik
   - Lihat: Sent, Opened, Clicked rate

2. **Individual Logs**:
   - Klik campaign di list
   - Lihat detail penerima dan status delivery

## 🎯 Tips untuk Open Rate Tinggi

1. **Timing Pengiriman:**
   - Terbaik: Selasa-Kamis, jam 09:00-11:00 WIB
   - Hindari: Weekend dan hari libur

2. **Subject Line:**
   - Gunakan emoji 🚀 untuk attention
   - Keep it short: max 60 karakter
   - Highlight benefit: "Login Sekarang"

3. **Follow-up:**
   - Kirim reminder H+3 untuk yang belum open
   - Kirim reminder H+7 untuk yang belum login

## 📱 WhatsApp Blast (Alternative)

Jika ingin kirim via WhatsApp juga:

**WhatsApp Message Template:**
```
🚀 *Eksporyuk Platform Baru Sudah Live!*

Halo {name}! 

Platform Eksporyuk sudah UPGRADE! 🎉

✨ *Fitur Baru:*
• Dashboard lebih canggih
• Sistem komisi otomatis
• Tools affiliate lengkap

🔗 *Login Sekarang:*
https://eksporyuk.com

📧 Email: {email}
🔑 Password: gunakan password lama

⚠️ Akun Anda sudah otomatis ter-migrasi!

Panduan lengkap: https://eksporyuk.com/migrasi

Butuh bantuan? Reply chat ini.

Tim Eksporyuk
```

## 🔧 Troubleshooting

**Email tidak terkirim?**
- Cek koneksi ke email service (Mailketing/SMTP)
- Verify API key di Admin Settings
- Cek logs di Admin → Broadcast → Logs

**Shortcode tidak ter-replace?**
- Pastikan menggunakan format `{name}` bukan `{{name}}`
- Pastikan field user sudah terisi di database

**Open rate rendah?**
- Coba ganti subject line
- Kirim test email ke diri sendiri dulu
- Periksa spam folder

## 📋 Checklist Sebelum Kirim

- [ ] Preview email di berbagai devices (desktop, mobile)
- [ ] Test semua links di email
- [ ] Verify shortcodes bekerja dengan benar
- [ ] Cek jumlah audience target
- [ ] Setup follow-up campaign untuk reminder
- [ ] Inform support team untuk anticipate questions
- [ ] Monitor inbox setelah kirim

## 📞 Support

Jika ada kendala:
- WhatsApp: +62 812-3456-7890
- Email: support@eksporyuk.com
- Documentation: https://eksporyuk.com/migrasi
