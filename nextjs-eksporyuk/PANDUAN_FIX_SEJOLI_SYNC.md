# Panduan Mengatasi Kesalahan Sejoli Sync

## 🚨 Masalah Umum

### 1. **Affiliate Salah (contoh: "Rahmat Al Fianto" jadi pembeli)**
- **Penyebab**: Form memilih affiliate yang salah sebelum sync
- **Tanda**: Customer name menunjukkan nama affiliate, bukan nama pembeli asli

### 2. **Membership Salah (contoh: "Coming Soon" atau paket yang tidak sesuai)**
- **Penyebab**: Memilih membership yang salah atau CSV memiliki produk yang tidak sesuai
- **Tanda**: Membership yang ditampilkan tidak sesuai dengan yang seharusnya

### 3. **Komisi Ganda (commission dan membership di-count dua kali)**
- **Penyebab**: Bug di sistem atau re-sync data yang sama
- **Tanda**: Affiliate wallet balance lebih besar dari yang seharusnya

---

## ✅ Cara Mencegah Kesalahan

### SEBELUM KLIK "START SYNC":

1. **Periksa Preview Data** ⚠️
   - Lihat bagian "Preview Data (CSV)" di form
   - Pastikan data sudah sesuai dengan yang diinginkan
   - Jangan lanjut jika masih ada keraguan

2. **Verifikasi Affiliate** 👥
   - Pastikan nama affiliate di dropdown sudah benar
   - Jangan keliru dengan nama customer
   - Jika ada keraguan, scrollkan dropdown untuk memastikan

3. **Verifikasi Membership** 📦
   - Pastikan paket membership sudah dipilih dengan benar
   - Lihat harga dan nama paket pada dropdown
   - Semua pembeli akan diberikan membership yang SAMA

4. **Verifikasi Komisi** 💰
   - Masukkan jumlah komisi yang tepat (bukan otomatis)
   - Lihat total komisi di "Komisi Affiliate" box
   - Pastikan sesuai dengan kesepakatan

5. **Terakhir, Klik START SYNC** ✅
   - Tunggu hingga proses selesai
   - Lihat hasil di "Results Summary"
   - Catat invoice number terakhir untuk referensi

---

## 🔧 Jika Terjadi KESALAHAN (Sudah Sync)

### Langkah 1: Identifikasi Invoice Prefix
Dari tangkapan layar atau Results Summary, catat invoice prefix:
- Contoh: `INV12001`, `INV12025`, etc.
- Ambil prefix-nya: `INV12` atau `INV120` (3-4 digit pertama)

### Langkah 2: Jalankan Fix Script
Buka terminal dan jalankan:

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
node fix-sejoli-sync.js "INV12"
```

Ganti `INV12` dengan prefix dari step 1.

### Langkah 3: Konfirmasi Penghapusan
Script akan menampilkan:
- ✅ Semua transactions yang akan dihapus
- ✅ Total commission yang akan di-refund
- ✅ Affiliate mana yang affected

**KETIK "YES" untuk konfirmasi** (case-sensitive!)

### Langkah 4: Verifikasi di Admin
Setelah script selesai:
1. Buka `/admin/sales` di browser
2. Filter dengan invoice prefix yang dihapus
3. Pastikan semua recordnya hilang
4. Cek affiliate wallet balance (harus turun sesuai komisi)

### Langkah 5: Re-sync dengan Data Benar
Buka `/admin/sync/sejoli` kembali:
1. Pilih **affiliate yang BENAR** dari dropdown
2. Pilih **membership yang BENAR** dari dropdown
3. Masukkan **komisi yang BENAR**
4. Paste data CSV lagi
5. **DOUBLE CHECK** preview data
6. Klik **START SYNC**

---

## 📊 Melihat Data yang Sudah Sync

### Di Admin Dashboard
- **Path**: `/admin/sales`
- **Lihat**: Semua transaction termasuk yang dari Sejoli
- **Filter**: By invoice number (cari `INV12xxx`)

### Informasi Per Transaction
- **Invoice**: INV12001 (membership purchase)
- **Customer**: Nama pembeli asli (dari CSV)
- **Affiliate**: Nama affiliate yang dipilih
- **Amount**: Harga paket
- **Status**: COMPLETED (hijau)
- **Type**: MEMBERSHIP

### Komisi Transaction
- **Invoice**: COM-INV12001 (commission from sales)
- **Customer**: Affiliate name (yang menerima komisi)
- **Amount**: Jumlah komisi
- **Type**: COMMISSION

---

## 💡 Tips Penting

1. **Jangan buru-buru** - Lihat preview 3x sebelum klik sync
2. **Jangan duplikasi** - Jangan sync data yang sama 2x
3. **Jangan ganti membership** - Semua pembeli dalam 1 batch dapat membership yang sama
4. **Jangan ganti affiliate** - Semua komisi dalam 1 batch untuk 1 affiliate
5. **Buat catatan** - Catat invoice prefix untuk referensi di masa depan

---

## 🆘 Jika Masih Ada Masalah

### Gejala: Script error "Affiliate profile not found"
**Solusi**: 
- Affiliate belum jadi afiliasi
- Buka `/admin/affiliates`
- Cari user tersebut dan aktivasi sebagai affiliate

### Gejala: Wallet balance tidak sesuai
**Solusi**:
- Manual fix di database
- Hubungi admin untuk direct query

### Gejala: UserMembership tidak terassign
**Solusi**:
- Cek apakah membership ID valid
- Verifikasi membership masih aktif (`isActive: true`)

---

## 📝 Checklist Sebelum Sync

- [ ] Data CSV sudah didownload dari Sejoli
- [ ] Sudah lihat preview data di form
- [ ] Affiliate sudah dipilih (dan benar)
- [ ] Membership sudah dipilih (dan benar)  
- [ ] Komisi sudah dimasukkan (dan benar)
- [ ] Klik START SYNC
- [ ] Catat invoice prefix dari results
- [ ] Verifikasi di `/admin/sales`
- [ ] Selesai ✅

---

## 🎯 Contoh Skenario

**Skenario A: Sync dengan Benar**
```
Affiliate: Rahmat Al Fianto (ID: abc123)
Membership: Paket Ekspor Yuk - Lifetime
Komisi: Rp 325.000
Data CSV: 10 pembeli dengan email asli mereka

Hasil:
✅ 10 user baru dibuat (dengan email dari CSV)
✅ 10 membership assigned
✅ 10 komisi ditransfer ke Rahmat (Rp 3.250.000 total)
✅ Semua invoice dari INV12001-INV12010
```

**Skenario B: Sync dengan Salah (Affiliate)**
```
❌ Affiliate dipilih: Wrong Person (bukan Rahmat)
❌ Hasil: Semua komisi masuk ke Wrong Person
❌ Fix: node fix-sejoli-sync.js "INV12"
✅ Ulang sync dengan affiliate yang benar
```

**Skenario C: Sync dengan Salah (Membership)**
```
❌ Membership dipilih: Member Free (salah!)
❌ Seharusnya: Paket Ekspor Yuk - Lifetime
❌ Fix: node fix-sejoli-sync.js "INV12"
✅ Ulang dengan membership yang benar
```

---

Semoga panduan ini membantu! 🎉
