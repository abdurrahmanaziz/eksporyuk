# 📚 Email Template Library - Panduan Penggunaan

## Fitur Baru: Template Library dengan Desain Professional

Admin sekarang memiliki **2 cara** untuk membuat email template:

### 1️⃣ Mulai dari Template Professional (RECOMMENDED)
- Klik tombol **"+ Buat Template Baru"** di tab Email
- Pilih salah satu dari 5 desain professional:
  - **📄 Blank Template** - Mulai dari awal
  - **👋 Welcome - Professional** - Email selamat datang dengan gradient header
  - **🧾 Invoice - Modern** - Invoice dengan desain clean & modern
  - **🔔 Notification - Minimal** - Notifikasi simple & elegan
  - **🎁 Promo - Vibrant** - Email promosi yang eye-catching
- Template akan otomatis terisi dengan HTML professional
- Edit sesuai kebutuhan menggunakan Visual Editor atau HTML Mode

### 2️⃣ Mulai dari Awal
- Pilih template **"Blank Template"**
- Mulai menulis dari kosong

---

## 🎨 Detail Template yang Tersedia

### 1. **Welcome - Professional** 👋
**Kategori:** Onboarding  
**Fitur:**
- Gradient header (Purple to Violet)
- Feature box dengan checklist
- CTA button prominent
- Footer dengan copyright

**Variabel tersedia:**
- `{name}` - Nama user
- `{siteName}` - Nama website
- `{email}` - Email user
- `{dashboardUrl}` - Link ke dashboard

**Cocok untuk:**
- Welcome email untuk user baru
- Onboarding email
- Email aktivasi akun

---

### 2. **Invoice - Modern** 🧾
**Kategori:** Payment  
**Fitur:**
- Header dengan invoice number
- Tabel detail pembelian
- Total pembayaran dengan highlight
- Warning box untuk deadline
- CTA button "Bayar Sekarang"

**Variabel tersedia:**
- `{name}` - Nama customer
- `{email}` - Email customer
- `{invoiceId}` - Nomor invoice
- `{date}` - Tanggal invoice
- `{dueDate}` - Tanggal jatuh tempo
- `{productName}` - Nama produk
- `{amount}` - Jumlah harga
- `{totalAmount}` - Total pembayaran
- `{paymentUrl}` - Link pembayaran

**Cocok untuk:**
- Invoice pembayaran
- Payment reminder
- Order confirmation

---

### 3. **Notification - Minimal** 🔔
**Kategori:** Notification  
**Fitur:**
- Icon badge dengan gradient
- Layout centered & clean
- CTA button subtle
- Footer simple

**Variabel tersedia:**
- `{name}` - Nama user
- `{email}` - Email user
- `{actionUrl}` - Link action
- `{siteName}` - Nama website

**Cocok untuk:**
- Notifikasi sistem
- Update status
- Alert penting
- Reminder sederhana

---

### 4. **Promo - Vibrant** 🎁
**Kategori:** Marketing  
**Fitur:**
- Gradient banner eye-catching (Pink to Red)
- Discount badge dengan shadow
- Feature pills dengan icon
- Countdown timer box
- CTA button dengan gradient & shadow

**Variabel tersedia:**
- `{name}` - Nama user
- `{email}` - Email user
- `{timeLeft}` - Waktu tersisa
- `{promoUrl}` - Link promo
- `{siteName}` - Nama website

**Cocok untuk:**
- Email promosi/diskon
- Flash sale announcement
- Limited offer
- Special event

---

### 5. **Blank Template** 📄
**Kategori:** Basic  
**Fitur:**
- Mulai dari kosong
- Bebas customize sepenuhnya

**Cocok untuk:**
- Custom design dari awal
- Template unik sesuai brand
- Experimental design

---

## 🎯 Cara Menggunakan Template Library

### Step 1: Buka Template Management
```
Dashboard Admin → Templates → Tab "Email Templates"
```

### Step 2: Klik "Buat Template Baru"
Modal **"Pilih Template Desain"** akan muncul dengan semua pilihan template.

### Step 3: Pilih Desain
- Klik salah satu card template
- HTML akan otomatis terisi di editor

### Step 4: Customize
1. **Isi Nama Template**: e.g., `invoice_payment_reminder`
2. **Isi Subject**: e.g., `Invoice #12345 - Menunggu Pembayaran`
3. **Edit Body**:
   - **Visual Mode**: Edit seperti Word (WYSIWYG)
   - **HTML Mode**: Edit kode HTML langsung

### Step 5: Tambahkan Variabel
- Klik tombol variabel untuk insert: `{name}`, `{amount}`, dll.
- Variabel akan otomatis diganti saat email dikirim

### Step 6: Simpan
Klik **"Simpan Template"** - Template siap digunakan!

---

## 💡 Tips Menggunakan Template

### ✅ DO's
1. **Pilih template yang sesuai kategori**
   - Welcome email → gunakan Welcome template
   - Invoice → gunakan Invoice template
   - Promo → gunakan Promo template

2. **Gunakan Visual Mode untuk edit cepat**
   - Ganti teks
   - Ubah warna
   - Tambah/hapus section

3. **Gunakan HTML Mode untuk fine-tuning**
   - Adjust spacing
   - Custom styling
   - Advanced layout

4. **Test sebelum production**
   - Kirim test email ke diri sendiri
   - Cek di berbagai email client (Gmail, Outlook, Yahoo)
   - Cek di mobile & desktop

5. **Konsisten dengan brand**
   - Sesuaikan warna dengan brand Anda
   - Ganti logo/header sesuai kebutuhan
   - Maintain tone of voice

### ❌ DON'Ts
1. **Jangan hapus variabel yang penting**
   - `{name}` untuk personalisasi
   - `{paymentUrl}` untuk invoice
   - `{actionUrl}` untuk CTA

2. **Jangan over-design**
   - Keep it simple & readable
   - Terlalu banyak warna = spam folder

3. **Jangan lupa test**
   - Email yang rusak = unprofessional
   - Test di berbagai device

---

## 🔧 Customization Advanced

### Mengubah Warna
Cari kode warna di HTML Mode dan ganti:
```html
<!-- Dari purple gradient -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Menjadi blue gradient -->
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

### Menambah Section
Copy-paste section yang sudah ada, lalu edit kontennya:
```html
<tr>
  <td style="padding: 20px;">
    <h3>Section Baru</h3>
    <p>Konten tambahan...</p>
  </td>
</tr>
```

### Mengganti Icon/Emoji
Ganti emoji di HTML:
```html
<span style="font-size: 40px;">🔔</span>
<!-- Ganti menjadi -->
<span style="font-size: 40px;">🎉</span>
```

---

## 📊 Template Comparison

| Template | Best For | Design Style | Complexity |
|----------|----------|--------------|------------|
| Welcome | Onboarding | Professional | Medium |
| Invoice | Payment | Clean & Modern | Medium |
| Notification | Alert | Minimal | Simple |
| Promo | Marketing | Vibrant | Complex |
| Blank | Custom | - | - |

---

## 🎓 Best Practices

### Email Design Principles
1. **Mobile-First**: 60% email dibuka di mobile
2. **Clear CTA**: Satu action utama per email
3. **Scannable**: Gunakan headings, bullets, spacing
4. **Professional**: Typo-free, consistent branding
5. **Personal**: Gunakan variabel untuk personalisasi

### Testing Checklist
- [ ] Subject line menarik (max 50 karakter)
- [ ] Semua variabel terisi dengan benar
- [ ] CTA button jelas & clickable
- [ ] Tampilan OK di Gmail
- [ ] Tampilan OK di Outlook
- [ ] Tampilan OK di mobile
- [ ] Link semua berfungsi
- [ ] Tidak masuk spam folder

---

## 🚀 Quick Start Examples

### Example 1: Welcome Email
1. Pilih template **"Welcome - Professional"**
2. Edit:
   - Nama: `welcome_new_member`
   - Subject: `Selamat Datang di {siteName}! 🎉`
3. Ganti:
   - Judul: "Selamat Datang di Ekspor Yuk!"
   - Fitur list sesuai produk Anda
4. Test & Save

### Example 2: Invoice Email
1. Pilih template **"Invoice - Modern"**
2. Edit:
   - Nama: `payment_invoice`
   - Subject: `Invoice #{invoiceId} - Menunggu Pembayaran`
3. Pastikan variabel:
   - `{invoiceId}`, `{amount}`, `{paymentUrl}` ada
4. Test & Save

### Example 3: Promo Email
1. Pilih template **"Promo - Vibrant"**
2. Edit:
   - Nama: `flash_sale_50_percent`
   - Subject: `🔥 FLASH SALE 50% - Hari Ini Saja!`
3. Customize:
   - Ganti "50% OFF" sesuai diskon
   - Update timer/deadline
4. Test & Save

---

## 🆘 Troubleshooting

### Template tidak muncul?
- Refresh halaman
- Clear browser cache
- Check console untuk error

### Variabel tidak terganti?
- Pastikan format: `{variableName}` (dengan kurung kurawal)
- Cek spelling variabel
- Lihat dokumentasi API untuk variabel yang available

### Email masuk spam?
- Jangan gunakan ALL CAPS berlebihan
- Kurangi kata-kata spam trigger (FREE, WIN, CLICK HERE)
- Setup SPF/DKIM di domain
- Jangan overuse exclamation marks!!!

### Design rusak di email client?
- Test di https://litmus.com atau https://emailonacid.com
- Gunakan inline CSS (sudah ada di template)
- Avoid JavaScript (tidak support di email)
- Gunakan table-based layout (sudah ada di template)

---

## 📞 Support

Jika ada pertanyaan atau butuh custom template:
- Check dokumentasi lengkap di `EMAIL_TEMPLATE_EDITOR_GUIDE.md`
- Contact: support@eksporyuk.com

---

**Version:** 1.0  
**Last Updated:** November 2024  
**Created by:** Ekspor Yuk Dev Team
