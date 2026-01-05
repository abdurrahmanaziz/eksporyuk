## FIX UI DISPLAY NAME - PANDUAN UNTUK USER

### Masalah
Dashboard menampilkan nama lama "Sambung Dakwah" padahal di database sudah "Abdurrahman Aziz"

### Penyebab  
NextAuth menggunakan JWT token yang tersimpan di browser cookie. Token ini berisi nama user yang lama dan tidak otomatis update ketika database berubah.

### Solusi yang Sudah Diterapkan
✅ Updated `auth-options.ts` untuk selalu fetch nama terbaru dari database di JWT callback
✅ Deploy ke production: https://eksporyuk.com

### Yang Perlu Dilakukan User
**User harus logout dan login ulang** untuk mendapatkan JWT token baru dengan nama yang benar.

### Langkah-langkah
1. Klik "Keluar" / "Logout" di dashboard
2. Login kembali dengan email: azizbiasa@gmail.com
3. Dashboard sekarang akan menampilkan "Abdurrahman Aziz" bukan "Sambung Dakwah"

### Penjelasan Teknis
- NextAuth menyimpan data user di JWT token di browser cookie
- Token ini expired dalam 30 hari, jadi masalah ini akan otomatis hilang setelah 30 hari
- Tapi dengan logout/login, user langsung dapat token baru

### Pencegahan Future
Sekarang auth system sudah diperbaiki untuk selalu mengambil nama terbaru dari database, jadi masalah ini tidak akan terjadi lagi untuk perubahan nama di masa depan.