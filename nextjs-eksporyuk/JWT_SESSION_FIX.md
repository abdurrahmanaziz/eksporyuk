# 🔧 JWT Session Error - Solusi

## Masalah
Error `JWT_SESSION_ERROR: decryption operation failed` terjadi karena perubahan `NEXTAUTH_SECRET` di konfigurasi.

## Penyebab
- JWT token yang tersimpan di browser cookie menggunakan secret lama
- Secret baru tidak bisa decrypt token lama
- User perlu login ulang untuk mendapat token baru

## Solusi

### ✅ Cara 1: Clear Browser Cookies (Recommended)

1. **Buka Browser DevTools:**
   - Chrome/Edge: `F12` atau `Ctrl+Shift+I`
   - Firefox: `F12` atau `Ctrl+Shift+K`

2. **Buka Console Tab**

3. **Copy dan Paste Script Ini:**
   ```javascript
   // Clear all cookies
   document.cookie.split(';').forEach(cookie => {
     const cookieName = cookie.split('=')[0].trim()
     document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
     document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`
   })
   console.log('✅ Cookies cleared! Please refresh and login again.')
   ```

4. **Refresh halaman** (`F5` atau `Ctrl+R`)

5. **Login ulang**

### ✅ Cara 2: Clear Cookies via Browser Settings

**Chrome/Edge:**
1. Klik kanan pada halaman → Inspect
2. Application tab → Cookies → http://localhost:3000
3. Klik kanan → Clear all cookies
4. Refresh halaman

**Firefox:**
1. Klik kanan pada halaman → Inspect Element
2. Storage tab → Cookies → http://localhost:3000
3. Klik kanan → Delete All
4. Refresh halaman

### ✅ Cara 3: Incognito/Private Window

1. Buka Incognito/Private window
2. Akses http://localhost:3000
3. Login dengan akun Anda

### ✅ Cara 4: Restart Browser

1. Close semua tab browser
2. Close browser sepenuhnya
3. Buka browser baru
4. Akses http://localhost:3000

## Prevention (Untuk Production)

1. **Jangan ubah `NEXTAUTH_SECRET` setelah ada user login**
2. **Jika harus ubah secret:**
   - Beri notifikasi ke semua user
   - Paksa logout semua session
   - Clear database session (jika pakai database strategy)

## Server Status

✅ Server sudah running dengan konfigurasi baru
✅ Auth system sudah diperbaiki dengan:
- Secret yang valid
- Session maxAge 30 hari
- Debug mode untuk development
- Error logging yang lebih baik

## Test Login

Setelah clear cookies, test dengan:
- Email: admin@eksporyuk.com
- Password: [your password]

Atau register akun baru.

---

**Status:** ✅ Fixed - User perlu clear cookies dan login ulang
