# Setup Google OAuth untuk Ekspor Yuk

## Status Implementasi

✅ **Sudah Selesai:**
- Google Provider ditambahkan ke NextAuth
- Halaman register dengan flow Google OAuth
- Halaman login dengan tombol Google OAuth
- API endpoint `/api/auth/complete-profile`
- API endpoint `/api/auth/register` sudah support WhatsApp
- Prisma schema sudah diupdate (field `whatsapp` dan `password` nullable)

⏳ **Perlu Dilakukan:**
1. Generate Prisma client ulang
2. Setup Google OAuth Credentials
3. Update environment variables

---

## Cara Setup Google OAuth

### 1. Buat Google OAuth Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Google+ API**
4. Pergi ke **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Pilih **Application type**: Web application
6. Isi **Authorized redirect URIs**:
   ```
   http://localhost:3005/api/auth/callback/google
   http://eksporyuk.test/api/auth/callback/google
   ```
7. Copy **Client ID** dan **Client Secret**

### 2. Update File .env

Buka file `.env` dan isi:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### 3. Generate Prisma Client

Karena ada perubahan schema (field `whatsapp` dan `password` nullable), generate ulang:

```powershell
# Stop server dulu
# Lalu jalankan:
npx prisma generate
npx prisma db push

# Restart server
.\dev-safe.ps1
```

---

## Cara Kerja Flow Google OAuth

### Register via Google:

1. User klik **"Daftar dengan Google"**
2. Redirect ke Google untuk login
3. Setelah sukses, redirect kembali ke `/auth/register`
4. Sistem detect user baru dari Google (belum ada WhatsApp)
5. Tampilkan form **"Lengkapi Profil"** untuk input WhatsApp
6. Save WhatsApp ke database via `/api/auth/complete-profile`
7. Redirect ke `/demo`

### Login via Google:

1. User klik **"Masuk dengan Google"**
2. Redirect ke Google untuk login
3. Setelah sukses, redirect ke halaman yang ditentukan
4. Session tersimpan, user bisa akses dashboard

---

## Testing (Tanpa Setup Google)

Jika belum setup Google OAuth, masih bisa test dengan:

1. **Demo Users** - Login dengan email/password:
   - `admin@eksporyuk.com` / `password123`
   - `mentor@eksporyuk.com` / `password123`
   - dll (lihat `auth-options.ts`)

2. **Register Email/Password** - Klik "Daftar dengan Email & Password" di halaman register

---

## File yang Sudah Diupdate

- ✅ `src/lib/auth-options.ts` - GoogleProvider ditambahkan
- ✅ `src/app/auth/register/page.tsx` - Flow 3 langkah dengan Google OAuth
- ✅ `src/app/auth/login/page.tsx` - Tombol Google OAuth
- ✅ `src/app/api/auth/register/route.ts` - Support WhatsApp field
- ✅ `src/app/api/auth/complete-profile/route.ts` - Endpoint baru untuk save WhatsApp
- ✅ `prisma/schema.prisma` - Field `whatsapp` dan `password?` nullable

---

## Troubleshooting

### Error: EPERM saat generate Prisma

Solusi:
1. Stop semua terminal yang menjalankan Next.js
2. Tutup VS Code
3. Buka ulang VS Code
4. Jalankan `npx prisma generate`

### Google OAuth tidak jalan

Cek:
1. `.env` sudah diisi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`
2. Redirect URI di Google Console sudah benar
3. Server restart setelah update .env

### User Google tidak bisa masuk

Cek:
1. Database sudah ada user dengan email tersebut
2. Field `whatsapp` sudah diisi (tidak null)
3. Session NextAuth masih valid

---

## Next Steps

Setelah Google OAuth jalan:
1. Test register via Google + lengkapi profil
2. Test login via Google untuk user yang sudah lengkap profil
3. Integrate Xendit payment untuk checkout
4. Add logo ke semua halaman (pricing, demo, admin)
