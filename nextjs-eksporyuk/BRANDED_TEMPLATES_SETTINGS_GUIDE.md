# 🎨 Pengaturan Template Bermerek - PANDUAN LENGKAP PERBAIKAN

## 📋 Status Sistem

✅ **SEMUA KOMPONEN SUDAH BERFUNGSI SEMPURNA**

- ✅ Settings API endpoints (GET & POST)
- ✅ File upload endpoint
- ✅ Test email endpoint  
- ✅ Page component dengan semua fungsi
- ✅ TypeScript validation - NO ERRORS
- ✅ Database schema ready

---

## 🚀 Cara Menggunakan Pengaturan Template

### 1. **Mengakses Halaman Pengaturan**

1. Login sebagai ADMIN
2. Navigasi ke: `http://localhost:3000/admin/branded-templates`
3. Klik tab **"Pengaturan Template"** di atas daftar template

### 2. **Mengatur Logo Website**

**Opsi A: Gunakan URL**
1. Di bagian "Logo Website", masukkan URL logo
2. Format: `https://example.com/logo.png`
3. Preview logo akan ditampilkan

**Opsi B: Upload dari Device**
1. Klik tombol "Upload dari Device"
2. Pilih file gambar (PNG, JPG, GIF, WebP, dll)
3. Maksimal ukuran: 5MB
4. File akan tersimpan otomatis

### 3. **Mengatur Footer Email**

Field yang dapat dikonfigurasi:

| Field | Contoh | Kegunaan |
|-------|--------|----------|
| **Nama Perusahaan** | PT. Eksporyuk | Ditampilkan di header footer |
| **Deskripsi** | Platform Ekspor Terpercaya | Tagline di footer |
| **Alamat** | Jl. Sudirman No. 123 | Informasi lokasi |
| **Telepon** | +62-21-1234-5678 | Kontak telepon |
| **Email** | support@eksporyuk.com | Email support |
| **Website URL** | https://eksporyuk.com | Link website |
| **Instagram** | https://instagram.com/eksporyuk | Link Instagram |
| **Facebook** | https://facebook.com/eksporyuk | Link Facebook |
| **LinkedIn** | https://linkedin.com/company/eksporyuk | Link LinkedIn |
| **Copyright** | © 2025 Eksporyuk | Teks copyright |

### 4. **Preview Footer Email**

- Setiap kali Anda mengisi field footer, preview akan otomatis terupdate
- Preview menampilkan bagaimana footer akan terlihat di email
- Social media links hanya muncul jika Anda mengisinya

### 5. **Mengirim Test Email**

**Persyaratan:**
1. Pilih template dari dropdown (hanya EMAIL templates yang bisa dikirim)
2. Masukkan email tujuan test
3. Klik "Kirim Test"

**Proses:**
- Email akan dikirim dengan data sample
- Data sample termasuk: nama, membership plan, amount, affiliate code, dll
- Email akan menampilkan logo dari Settings dan footer email yang sudah dikonfigurasi
- Check inbox Anda dalam 1-2 menit

**Contoh Data Sample:**
```
- Nama: John Doe
- Email: [email yang Anda masukkan]
- Membership Plan: Premium Plan
- Amount: Rp 500.000
- Invoice: INV-2025-001
- Affiliate Code: JOHNDOE123
```

### 6. **Menyimpan Pengaturan**

1. Setelah mengubah settings, klik tombol **"Simpan Pengaturan"** di bawah
2. Tunggu notifikasi "Pengaturan berhasil disimpan"
3. Settings akan diterapkan ke semua template EMAIL aktif

---

## 🔧 Troubleshooting

### Problem: Logo tidak muncul di preview email

**Solusi:**
1. Pastikan URL logo valid dan accessible
2. Coba upload ulang file logo menggunakan "Upload dari Device"
3. Gunakan format gambar yang support (PNG, JPG, GIF)
4. Pastikan ukuran file < 5MB

### Problem: Test email tidak terkirim

**Solusi:**
1. Cek apakah Anda sudah memilih template dari dropdown
2. Pastikan email tujuan valid (cek format @)
3. Cek folder SPAM/Junk email Anda
4. Jika masih tidak terkirim, cek browser console (F12) untuk error message
5. Pastikan API Mailketing sudah terhubung (lihat status di halaman)

### Problem: Footer email tidak muncul

**Solusi:**
1. Pastikan minimal field "Nama Perusahaan" sudah diisi
2. Klik "Simpan Pengaturan" sebelum mengirim test
3. Tunggu 30 detik setelah save, kemudian kirim test email lagi
4. Cek apakah template sudah AKTIF di "Daftar Template"

### Problem: Pengaturan tidak tersimpan

**Solusi:**
1. Pastikan koneksi internet stabil
2. Cek browser console (F12) untuk error message
3. Coba refresh halaman dengan F5
4. Login kembali sebagai ADMIN
5. Cek network tab di DevTools untuk melihat response dari API

---

## 📧 Email Template Flow

```
Template yang Dipilih
        ↓
    [Content Text dari Template DB]
        ↓
    [Render dengan Sample Data]
        ↓
    [Tambahkan Logo dari Settings]
        ↓
    [Tambahkan Footer Email dari Settings]
        ↓
    [Generate HTML Email]
        ↓
    [Kirim via Mailketing API]
        ↓
    Inbox User ✉️
```

---

## 🎯 Shortcodes yang Tersedia

Template dapat menggunakan shortcodes berikut (auto-replace dengan data real):

- `{name}` - Nama user
- `{email}` - Email user
- `{phone}` - Nomor telepon
- `{membership_plan}` - Rencana membership
- `{expiry_date}` - Tanggal expired
- `{amount}` - Jumlah pembayaran
- `{amount_formatted}` - Jumlah dengan currency (Rp X.XXX)
- `{invoice_number}` - Nomor invoice
- `{affiliate_code}` - Kode affiliate
- `{commission}` - Komisi affiliate
- `{site_name}` - Nama website
- `{site_url}` - URL website
- `{support_email}` - Email support (dari Settings)
- `{current_date}` - Tanggal hari ini

---

## ✅ Checklist Konfigurasi Lengkap

- [ ] Logo website sudah diatur (URL atau upload)
- [ ] Nama perusahaan sudah diisi
- [ ] Email support sudah diatur
- [ ] Website URL sudah diisi
- [ ] Minimal 1 template sudah AKTIF
- [ ] Sudah kirim test email ke email pribadi
- [ ] Email diterima dengan logo dan footer lengkap
- [ ] Pengaturan sudah disave

---

## 📱 Format yang Didukung

### Logo
- Format: PNG, JPG, GIF, WebP, JPEG
- Ukuran maksimal: 5MB
- Resolusi optimal: 200x50px atau 300x75px
- Recommended: PNG dengan transparent background

### Email Template
- Format konten: Plain text (tanpa HTML)
- Paragraf dipisah dengan newline kosong
- CTA button: opsional (jika diisi, akan menjadi tombol)
- Maksimal 5000 karakter

---

## 🔐 Keamanan

- Hanya ADMIN yang bisa mengakses settings
- File upload divalidasi: hanya gambar yang diizinkan
- Email test hanya bisa dikirim ke template EMAIL aktif
- Semua perubahan dicatat dalam database

---

## 📞 Support

Jika ada masalah dengan pengaturan template:
1. Cek browser console (F12 → Console tab)
2. Cek Network tab untuk melihat API response
3. Verify bahwa API endpoints sudah accessible
4. Pastikan database Settings sudah exist (id=1)

---

**Last Updated:** 29 Desember 2025
**Status:** ✅ FULLY FUNCTIONAL
