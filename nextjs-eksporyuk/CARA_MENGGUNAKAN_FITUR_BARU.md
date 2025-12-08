# 📘 Cara Menggunakan Fitur User Management Baru

## 🚀 Akses Halaman Edit User

1. Login sebagai **ADMIN**
2. Buka menu **"Manajemen Pengguna"** di sidebar
3. Klik tombol **"Edit"** di salah satu user
4. Anda akan masuk ke halaman edit dengan semua fitur baru

---

## 1️⃣ Reset Password (Auto-Generate)

### Kapan Digunakan?
- User lupa password
- User minta reset password
- Akun baru yang perlu password awal

### Cara Pakai:
1. Scroll ke section **"Manajemen Password"**
2. Klik tombol **"Reset Password"**
3. Modal akan muncul
4. Klik tombol **"Generate Password Baru"**
5. Password baru akan muncul (contoh: `aB3dE7fGhJ9k`)
6. Klik icon **Copy** untuk salin password
7. Kirim password ke user via WhatsApp/Email
8. Klik **"Tutup"** untuk menutup modal

### Catatan:
- Password 12 karakter (huruf besar, kecil, angka, simbol)
- Password hanya muncul 1 kali, pastikan di-copy
- User wajib ganti password setelah login pertama kali

---

## 2️⃣ Set Password Baru (Manual)

### Kapan Digunakan?
- User request password tertentu
- Setting password untuk akun demo/testing
- Custom password untuk akses sementara

### Cara Pakai:
1. Scroll ke section **"Manajemen Password"**
2. Klik tombol **"Set Password Baru"**
3. Modal akan muncul
4. Ketik password yang diinginkan (minimal 6 karakter)
5. Klik icon **mata** untuk show/hide password
6. Klik tombol **"Set Password"**
7. Password berhasil diubah!

### Catatan:
- Tidak perlu tahu password lama user
- Minimal 6 karakter (recommended: 8+ karakter)
- Disarankan kombinasi huruf, angka, simbol

---

## 3️⃣ Manajemen Role Multi-Role

### Konsep Multi-Role:
User bisa punya **lebih dari 1 role** sekaligus!

**Contoh Skenario**:
- User A bisa jadi **MENTOR** + **AFFILIATE** + **MEMBER_PREMIUM**
- User B bisa jadi **AFFILIATE** + **MEMBER_FREE**
- User C hanya **ADMIN**

### Primary Role vs Additional Roles:
- **Primary Role**: Role utama yang menentukan akses dashboard default
- **Additional Roles**: Role tambahan yang memberikan akses fitur lain

**Role Priority** (dari tertinggi ke terendah):
1. **ADMIN** (5) - Full access
2. **MENTOR** (4) - Akses kelola course
3. **AFFILIATE** (3) - Akses dashboard affiliate
4. **MEMBER_PREMIUM** (2) - Akses konten premium
5. **MEMBER_FREE** (1) - Akses konten gratis

---

### ➕ Cara Tambah Role:

1. Scroll ke section **"Role Tambahan"**
2. Klik tombol **"+ Tambah Role"**
3. Modal akan muncul dengan list semua role
4. Pilih role yang ingin ditambahkan
5. Role yang sudah ada akan disabled (abu-abu)
6. Klik tombol **"Tambah Role"**
7. Role baru muncul sebagai badge

**Contoh**:
- User awalnya hanya **MEMBER_FREE**
- Tambah role **AFFILIATE** → User sekarang bisa akses dashboard affiliate
- Tambah role **MENTOR** → User sekarang bisa kelola course
- Primary role otomatis berubah ke **MENTOR** (priority tertinggi)

---

### ➖ Cara Hapus Role:

1. Lihat di section **"Role Tambahan"**
2. Setiap role punya badge warna dengan icon
3. Klik icon **X** di badge role yang ingin dihapus
4. Modal konfirmasi akan muncul
5. Klik **"Hapus Role"**
6. Role berhasil dihapus

**Catatan**:
- Jika hapus role dengan priority tinggi, primary role otomatis downgrade ke role tertinggi yang tersisa
- Contoh: Hapus **MENTOR**, primary role jadi **AFFILIATE**

---

### 📊 Contoh Kasus Real:

**Kasus 1: User Jadi Mentor DAN Affiliate**
```
1. User A register sebagai MEMBER_FREE
2. User A apply jadi affiliate → approved
3. Admin tambah role AFFILIATE di edit page
4. User A sekarang bisa akses:
   - Dashboard affiliate (lihat komisi, link, dll)
   - Konten member free
5. User A apply jadi mentor → approved
6. Admin tambah role MENTOR di edit page
7. User A sekarang bisa akses:
   - Dashboard mentor (kelola course)
   - Dashboard affiliate (lihat komisi)
   - Konten member free
8. Primary role otomatis jadi MENTOR (priority 4 > 3)
```

**Kasus 2: Downgrade Role**
```
1. User B punya role: MENTOR + AFFILIATE + MEMBER_PREMIUM
2. Primary role: MENTOR (tertinggi)
3. User B melanggar aturan mentor → suspend dari mentor
4. Admin hapus role MENTOR
5. Primary role otomatis downgrade ke AFFILIATE
6. User B masih bisa akses dashboard affiliate
```

---

## 4️⃣ Suspend/Block User dengan Alasan

### Kapan Suspend User?
- Melanggar ketentuan penggunaan
- Aktivitas spam/penyalahgunaan
- Pembayaran bermasalah/fraud
- Request suspend dari user sendiri

### Cara Suspend:

1. Scroll ke section **"Suspend User"** (paling bawah)
2. Klik tombol **"Suspend User Ini"**
3. Modal akan muncul
4. **WAJIB** isi alasan suspend di textarea
   - Contoh: "Melanggar ketentuan - Spam berulang kali"
   - Contoh: "Pembayaran fraud - Chargeback 3x"
5. Klik tombol **"Suspend User"**
6. User langsung di-suspend

**Yang Terjadi Setelah Suspend**:
- ❌ User tidak bisa login
- 📧 Saat coba login, user lihat pesan: **"Akun Anda disuspend. Alasan: [alasan yang Anda tulis]"**
- 🚫 Semua akses dashboard diblokir
- 📝 Activity log mencatat siapa suspend, kapan, dan kenapa

---

### Cara Unsuspend (Aktifkan Kembali):

**Jika User Suspended**:
1. Di atas halaman edit akan ada **banner merah**
2. Banner menampilkan:
   - Status: "User Disuspend"
   - Alasan suspend
   - Tanggal & waktu suspend
3. Klik tombol **"Aktifkan Kembali"** di banner
4. User langsung bisa login lagi

---

### 📋 Info yang Tersimpan Saat Suspend:

```javascript
{
  isSuspended: true,
  isActive: false,
  suspendReason: "Melanggar ketentuan - Spam",
  suspendedAt: "2025-01-15T10:30:00Z",
  suspendedBy: "admin@eksporyuk.com"
}
```

---

## 🔒 Keamanan & Proteksi

### Admin Tidak Bisa:
- ❌ Suspend diri sendiri
- ❌ Suspend admin lain
- ❌ Ubah role admin sendiri
- ❌ Hapus role admin lain

### Activity Log:
Semua aksi dicatat di database:
- Reset password → log siapa reset untuk siapa
- Set password → log siapa set untuk siapa
- Suspend → log siapa suspend siapa + alasan
- Unsuspend → log siapa unsuspend siapa
- Add role → log siapa tambah role apa
- Remove role → log siapa hapus role apa

---

## 💡 Tips Best Practices

### 1. Password Management:
- ✅ **DO**: Generate random password untuk keamanan
- ✅ **DO**: Kirim password via WhatsApp/Email terenkripsi
- ✅ **DO**: Minta user ganti password setelah login pertama
- ❌ **DON'T**: Set password terlalu simple (contoh: "123456")

### 2. Role Management:
- ✅ **DO**: Tambah role sesuai kebutuhan user
- ✅ **DO**: Monitor aktivitas user setelah dapat role baru
- ❌ **DON'T**: Berikan role ADMIN sembarangan
- ❌ **DON'T**: Hapus semua role user (minimal 1 role)

### 3. Suspend:
- ✅ **DO**: Tulis alasan suspend yang jelas dan spesifik
- ✅ **DO**: Beri warning dulu sebelum suspend (jika mungkin)
- ✅ **DO**: Review secara berkala user yang di-suspend
- ❌ **DON'T**: Suspend tanpa alasan yang valid
- ❌ **DON'T**: Suspend sebagai hukuman tanpa investigasi

---

## 🎯 Workflow Rekomendasi

### Workflow 1: Onboarding User Baru
```
1. User register → role: MEMBER_FREE
2. User bayar membership → Admin tambah role MEMBER_PREMIUM
3. User apply affiliate → Admin review & add role AFFILIATE
4. User apply mentor → Admin review & add role MENTOR
5. User sekarang punya 4 roles: MEMBER_FREE + MEMBER_PREMIUM + AFFILIATE + MENTOR
6. Primary role: MENTOR (tertinggi)
```

### Workflow 2: Handling User Bermasalah
```
1. User A melakukan spam
2. Admin beri warning via email/WA
3. User A ulangi spam
4. Admin suspend dengan alasan: "Spam berulang setelah warning - tanggal [date]"
5. User A hubungi admin minta maaf
6. Admin review case → unsuspend
7. Jika user A spam lagi → suspend permanent + note di alasan
```

### Workflow 3: Reset Password User Lupa
```
1. User hubungi admin: "Saya lupa password"
2. Admin verifikasi identitas user (email, phone, dll)
3. Admin buka edit page user
4. Klik "Reset Password" → generate otomatis
5. Copy password → kirim via WhatsApp
6. User login dengan password baru
7. Admin minta user ganti password di profile settings
```

---

## 📞 Troubleshooting

### Q: User tidak bisa login setelah unsuspend?
A: 
1. Cek di edit page apakah `isSuspended = false`
2. Cek apakah `isActive = true`
3. Cek di banner apakah masih ada status suspend
4. Clear cache browser user
5. Minta user logout dan login ulang

### Q: Role tidak muncul setelah ditambahkan?
A: 
1. Refresh halaman edit user
2. Cek di section "Role Tambahan" apakah ada badge
3. Cek di API response GET user apakah `userRoles` array terisi
4. Check database table `UserRole` apakah ada entry

### Q: Password generate tidak bisa di-copy?
A: 
1. Pastikan browser support clipboard API
2. Try manual copy (select text + Ctrl+C)
3. Kirim password via email sebagai backup

### Q: Admin bisa suspend admin lain?
A: 
- **TIDAK BISA**. Sistem otomatis blokir aksi ini
- Error message: "Tidak bisa suspend admin lain"
- Ini fitur proteksi keamanan

---

## 🎓 Video Tutorial (Coming Soon)

- [ ] Tutorial Reset & Set Password
- [ ] Tutorial Multi-Role Management
- [ ] Tutorial Suspend/Unsuspend User
- [ ] Workflow Complete: Onboarding to Suspension

---

## 📚 Referensi API

Untuk developer yang ingin integrasi:

```bash
# Reset Password
POST /api/admin/users/[id]/reset-password
Response: { success: true, newPassword: "aB3dE7fGhJ9k" }

# Set Password
POST /api/admin/users/[id]/set-password
Body: { newPassword: "myNewPass123" }

# Suspend
POST /api/admin/users/[id]/suspend
Body: { action: "suspend", reason: "Spam activity" }

# Unsuspend
POST /api/admin/users/[id]/suspend
Body: { action: "unsuspend" }

# Add Role
POST /api/admin/users/[id]/change-role
Body: { role: "MENTOR", action: "add" }

# Remove Role
POST /api/admin/users/[id]/change-role
Body: { role: "AFFILIATE", action: "remove" }
```

---

**Last Updated**: 15 Januari 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

**Need Help?** Contact admin atau buka documentation lengkap di `USER_MANAGEMENT_FEATURES_COMPLETE.md`
