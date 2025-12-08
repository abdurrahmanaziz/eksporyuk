# 🎯 Quick Guide: Testing Affiliate CTA Button Dropdowns

## ✅ Status
- **Feature:** CTA Button dengan Dropdown untuk Membership, Product, Course, Event
- **Data:** 16 items tersedia (3 memberships + 4 products + 4 courses + 5 events)
- **Status:** Ready for Testing

---

## 🚀 Cara Test

### 1. Buka Halaman Bio Affiliate
```
http://localhost:3000/affiliate/bio
```

### 2. Klik Tombol "Tambah CTA Button"

### 3. Test Setiap Tipe Button:

#### A. **Membership Button**
1. Pilih **Button Type** → `Membership`
2. Lihat dropdown muncul dengan **3 pilihan**:
   - Membership Ekspor Pemula (Rp 299K)
   - Membership Professional Eksportir (Rp 799K)
   - Membership Lifetime Access (Rp 4.999K)

#### B. **Product Button**
1. Pilih **Button Type** → `Product`
2. Lihat dropdown muncul dengan **4 pilihan**:
   - Template Dokumen Ekspor Lengkap (Rp 199K)
   - E-Book: Rahasia Sukses Ekspor ke Eropa (Rp 149K)
   - Database 1000+ Buyer Internasional (Rp 499K)
   - Tools Kalkulasi Harga Ekspor Otomatis (Rp 299K)

#### C. **Course Button**
1. Pilih **Button Type** → `Course`
2. Lihat dropdown muncul dengan **4 pilihan**:
   - Kelas Ekspor untuk Pemula (Rp 499K)
   - Mastering Export Documentation (Rp 399K)
   - Strategi Negosiasi dengan Buyer Internasional (Rp 599K)
   - Digital Marketing untuk Eksportir (Rp 699K)

#### D. **Event Button**
1. Pilih **Button Type** → `Event`
2. Lihat dropdown muncul dengan **5 pilihan**:
   - Webinar: Cara Mencari Buyer di Alibaba (Rp 99K)
   - Workshop: Export Documentation Masterclass (Rp 199K)
   - Live Training: Negosiasi Payment Terms (Rp 149K)
   - Meetup Eksportir Indonesia (GRATIS)
   - Coaching Session: Scale Up Bisnis Ekspor (Rp 499K)

---

## 📝 Expected Behavior

### ✅ Yang Harus Terjadi:
1. **Loading State:** Saat modal dibuka, akan ada loading spinner singkat saat fetch data
2. **Dropdown Muncul:** Setelah pilih button type, dropdown yang sesuai akan muncul
3. **Data Terisi:** Dropdown berisi item sesuai tipe (membership/product/course/event)
4. **Bisa Dipilih:** User bisa select item dari dropdown
5. **Save Berhasil:** Setelah pilih dan klik simpan, CTA button tersimpan dengan benar

### ⚠️ Edge Cases:
- **Jika data kosong:** Akan muncul pesan "Tidak ada [item] tersedia"
- **Jika loading:** Akan muncul spinner icon di dropdown
- **Jika error:** Console akan log error (buka DevTools untuk lihat)

---

## 🔧 Troubleshooting

### Dropdown tidak muncul?
1. Buka DevTools Console (F12)
2. Cek error di Network tab
3. Pastikan API endpoints berjalan:
   - `/api/memberships`
   - `/api/products`
   - `/api/courses`
   - `/api/events`

### Data kosong di dropdown?
Jalankan verification script:
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
npx tsx verify-demo-data.ts
```

Jika data tidak ada, jalankan seeder lagi:
```bash
npx tsx seed-affiliate-demo.ts
```

### Loading terus-terusan?
- Cek apakah server Next.js berjalan
- Cek apakah database accessible
- Restart development server

---

## 📊 Data Summary

| Type | Count | Items |
|------|-------|-------|
| Memberships | 3 | Ekspor Pemula, Professional, Lifetime |
| Products | 4 | Template, E-Book, Database, Tools |
| Courses | 4 | Ekspor Pemula, Documentation, Negosiasi, Digital Marketing |
| Events | 5 | Webinar, Workshop, Meetup, Training, Coaching |
| **TOTAL** | **16** | Ready for testing |

---

## 🎨 UI Features Implemented

✅ **Conditional Rendering** - Dropdown hanya muncul sesuai button type
✅ **Loading State** - Spinner icon saat fetch data
✅ **Empty State** - Pesan jelas jika tidak ada data
✅ **Price Display** - Tampil harga di setiap opsi dropdown
✅ **Parallel Fetching** - Fetch semua data sekaligus (efficient)
✅ **Auto-Trigger** - Fetch otomatis saat modal dibuka

---

## 🔗 Related Files

**Frontend:**
- `/src/app/(affiliate)/affiliate/bio/page.tsx` - Main Bio page dengan CTA modal

**Seeder Scripts:**
- `/seed-affiliate-demo.ts` - Create demo data
- `/verify-demo-data.ts` - Verify data exists

**Documentation:**
- `/AFFILIATE_DEMO_DATA_CREATED.md` - Full data details
- `/TESTING_GUIDE_CTA_DROPDOWNS.md` - This file

**APIs:**
- `/api/memberships` - Fetch memberships
- `/api/products` - Fetch products
- `/api/courses` - Fetch courses
- `/api/events` - Fetch events

---

## ✅ Validation Checklist

Saat testing, pastikan:

- [ ] Modal "Tambah CTA Button" bisa dibuka
- [ ] Loading spinner muncul sesaat saat modal dibuka
- [ ] Dropdown Membership tampil dengan 3 items
- [ ] Dropdown Product tampil dengan 4 items
- [ ] Dropdown Course tampil dengan 4 items
- [ ] Dropdown Event tampil dengan 5 items
- [ ] Bisa select item dari setiap dropdown
- [ ] Harga tampil dengan benar di setiap opsi
- [ ] Bisa save CTA button dengan item yang dipilih
- [ ] CTA button tersimpan ke database
- [ ] CTA button tampil di halaman Bio

---

## 💡 Tips

1. **Test per tipe** - Test satu button type dulu sampai berhasil sebelum test yang lain
2. **Cek Console** - Selalu buka DevTools Console untuk lihat log dan error
3. **Cek Network** - Monitor API calls di Network tab
4. **Test Save** - Pastikan data benar-benar tersimpan setelah pilih dari dropdown

---

**Last Updated:** 3 Desember 2025  
**Status:** ✅ Ready for Testing  
**Total Demo Items:** 16
