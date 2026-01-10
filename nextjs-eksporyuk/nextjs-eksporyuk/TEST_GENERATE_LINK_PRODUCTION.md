# Test Generate Link di Production

**Deployed:** ✅ https://eksporyuk.com  
**Date:** 1 Januari 2026

---

## 🧪 Test Steps

### 1. Login sebagai Affiliate

URL: https://eksporyuk.com/auth/login

**Credentials:** (gunakan akun affiliate yang sudah approved)

---

### 2. Navigate ke Affiliate Links

URL: https://eksporyuk.com/affiliate/links

---

### 3. Click "Generate Link" Tab

Atau scroll ke section **"🎉 Generate Link Sekarang!"**

---

### 4. Pilih Tipe Produk

**Options:**
- [ ] Membership
- [ ] Product  
- [ ] Course
- [ ] Supplier

---

### 5. (Optional) Pilih Item Spesifik

**Leave empty** untuk generate semua item dari tipe yang dipilih

---

### 6. (Optional) Pilih Kupon

**Select dari dropdown** jika ingin link dengan diskon otomatis

---

### 7. Click "Generate Semua Link!"

**Expected Result:**
- Loading spinner muncul
- Toast sukses: "🎉 Berhasil generate X link affiliate!"
- List link ter-refresh otomatis
- Link baru muncul di list

---

## 🐛 Jika Ada Error

### Check Browser Console

1. Buka DevTools (F12 atau Cmd+Option+I)
2. Tab **Console**
3. Cari error merah
4. Screenshot dan share

### Check Network Tab

1. DevTools → **Network**
2. Filter: **Fetch/XHR**
3. Cari request ke `/api/affiliate/links/smart-generate`
4. Klik request → Tab **Response**
5. Screenshot response error

### Common Errors & Solutions

#### Error: "Authentication required"
**Solution:** Login ulang, session mungkin expired

#### Error: "Affiliate profile not found"
**Solution:** 
1. Navigate ke `/affiliate/apply`
2. Submit aplikasi
3. Tunggu admin approval
4. Setelah approved, coba generate lagi

#### Error: "No active membership found"
**Solution:** 
- Belum ada membership di database
- Contact admin untuk activate membership

#### Error: "Gagal generate link - terlalu banyak link yang sudah ada"
**Solution:**
- Archive beberapa link lama di `/affiliate/links`
- Atau gunakan link yang sudah ada

---

## 📊 Verify Links Created

### Check di List

Setelah generate berhasil:
1. Scroll ke **"Daftar Link Saya"**
2. Filter by **Membership** / **Product** / etc
3. Link baru akan muncul paling atas (sorted by date)

### Check URL Format

Link harus terlihat seperti:
```
✅ https://eksporyuk.com/membership/paket-premium?ref=YOURCODE-ABC123
✅ https://eksporyuk.com/checkout/paket-premium?ref=YOURCODE-ABC123&coupon=KUPON10

❌ https://eksporyuk.com
   /membership/... (dengan newline - TIDAK BOLEH)
```

---

## 🔍 Debug Info

### Check Server Logs (Vercel)

**Only for developers:**

1. Login ke Vercel dashboard
2. Project: eksporyuk
3. Tab **Logs**
4. Filter by time (saat Anda test)
5. Cari logs dengan prefix:
   ```
   �� [Smart Generate] ...
   ✅ [Smart Generate] ...
   ❌ [Smart Generate] ...
   ```

---

## ✅ Success Criteria

- [ ] Button "Generate" clickable
- [ ] Loading state shows
- [ ] No console errors
- [ ] Toast success appears
- [ ] Links appear in list
- [ ] URLs clean (no newlines)
- [ ] Copy button works
- [ ] Links navigable

---

## 📝 Report Template

Jika masih error, copy template ini dan isi:

```
### Error Report

**Date/Time:** [kapan test]
**User:** [username affiliate]
**Steps:**
1. Login ✅/❌
2. Navigate to /affiliate/links ✅/❌
3. Click Generate tab ✅/❌
4. Select: [Membership/Product/Course/Supplier]
5. Click Generate ✅/❌

**Error:**
[paste error message atau screenshot]

**Browser Console:**
[paste console errors]

**Network Response:**
[paste API response]

**Screenshot:**
[attach screenshot]
```

---

**Test sekarang dan report hasilnya!** 🚀
