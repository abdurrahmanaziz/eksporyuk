# Quick Start: Fix Sejoli Sync Kesalahan

## 🆘 Ada Kesalahan Data? (Affiliate/Membership/Komisi Salah)

### Step 1: Identifikasi Invoice Prefix
Dari tangkapan layar atau hasil sync, catat invoice number yang pertama.
Contoh: `INV12001` → ambil prefix: `INV12`

### Step 2: Jalankan Fix Script
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
node fix-sejoli-sync.js "INV12"
```

**Ganti `INV12` dengan prefix Anda!**

### Step 3: Verifikasi & Konfirmasi
Script akan menampilkan:
- ✅ Semua transactions yang akan dihapus
- ✅ Total komisi yang akan di-refund
- ⚠️ Minta konfirmasi

**KETIK "YES" (persis) untuk lanjut** (case-sensitive!)

### Step 4: Tunggu Selesai
Script akan:
1. Hapus semua affiliate conversion records
2. Hapus semua user membership assignments
3. Hapus semua commission transactions
4. Hapus semua membership transactions
5. Refund komisi ke affiliate wallet

Tunggu hingga muncul ✅ CLEANUP COMPLETE!

### Step 5: Verifikasi di Admin
1. Buka http://localhost:3000/admin/sales
2. Cari invoice dengan prefix yang dihapus (contoh: INV12xxx)
3. Pastikan semua recordnya sudah hilang
4. Cek affiliate wallet balance (harus turun)

### Step 6: Re-Sync dengan Data Benar
1. Buka http://localhost:3000/admin/sync/sejoli
2. Pilih **affiliate yang BENAR** (bukan yang salah)
3. Pilih **membership yang BENAR**
4. Input **komisi yang BENAR**
5. Paste data CSV lagi
6. **Lihat preview** dan verifikasi
7. Klik **START SYNC**

---

## 📊 Contoh

### Scenario: Ada sync dengan invoice INV12001 - INV12010 yang salah

```bash
# Step 1
node fix-sejoli-sync.js "INV12"

# Output:
# 🔍 Looking for transactions with prefix: INV12...
# 📋 Found 10 membership transactions
# 📋 Found 10 commission transactions
# ...
# ⚠️ Are you SURE? (type YES):

# Step 2
# Ketik: YES

# Output:
# ✅ Deleted 10 affiliate conversion records
# ✅ Deleted 10 user membership records
# ✅ Deleted 10 commission transactions
# ✅ Deleted 10 membership transactions
# ✅ Refunded Rp3,250,000 to affiliate wallet
# 
# ✅ CLEANUP COMPLETE!
```

---

## ❓ FAQ

**Q: Bagaimana kalau prefix saya `INV120`?**
A: Gunakan `node fix-sejoli-sync.js "INV120"`

**Q: Kalau saya typo "YES" jadi "yes" atau "Yes"?**
A: Script akan cancel, tidak jadi dihapus (case-sensitive untuk keamanan)

**Q: Berapa lama proses cleanup?**
A: Biasanya < 5 detik untuk 10-20 transactions

**Q: Apa yang akan di-delete?**
A: Semua yang dimulai dengan prefix tersebut:
- INV12xxx (membership transactions)
- COM-INV12xxx (commission transactions)
- Affiliate conversions
- User memberships
- Wallet adjustments

**Q: Data customer/user juga ikut dihapus?**
A: Tidak! Hanya transactions dan relationships. Customer user tetap ada.

**Q: Bisa recover data yang sudah dihapus?**
A: Tidak ada backup. Tapi sudah refund komisinya, jadi bisa re-sync.

---

## ⚠️ Penting!

1. **Backup dulu** jika punya database backup tool
2. **Verifikasi affiliate wallet** sebelum dan sesudah
3. **Double-check prefix** sebelum ketik YES
4. **Jangan interrupt** script saat sedang berjalan
5. **Cek hasil** di /admin/sales setelah cleanup

---

## 🎯 Best Practice

**SEBELUM SYNC LAGI:**
- [ ] Verifikasi affiliate BENAR
- [ ] Verifikasi membership BENAR
- [ ] Verifikasi komisi BENAR
- [ ] Lihat preview data
- [ ] Baru klik START SYNC

---

Semoga berhasil! 🎉
