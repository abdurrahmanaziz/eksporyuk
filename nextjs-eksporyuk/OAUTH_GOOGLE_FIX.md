# Checklist Perbaikan Google OAuth (Aman untuk Prod)

Gunakan daftar ini saat memperbaiki masalah signup/login Google di Vercel.

## 1) Environment Vercel
- NEXTAUTH_URL = `https://eksporyuk.com`
- NEXTAUTH_SECRET (atau AUTH_SECRET) di-set.
- GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sesuai project OAuth yang memakai redirect di bawah.
- DATABASE_URL gunakan DSN pooled (PgBouncer) untuk Neon, contoh:
  `postgres://USER:PASSWORD@HOST/dbname?sslmode=require&pgbouncer=true&connect_timeout=10`

## 2) Redirect URI di Google Cloud
- Tambahkan Authorized redirect URI: `https://eksporyuk.com/api/auth/callback/google`
- Pastikan origin/URI lain tidak typo atau beda domain.

## 3) Retest & Ambil Log (Vercel CLI)
Segera setelah klik "Sign in with Google" di prod, jalankan:

```
vercel logs eksporyuk.com | grep -i "api/auth"
vercel logs eksporyuk.com | grep -i "google"
```
Catat timestamp percobaan (WIB) kalau masih ada error.

## 4) Validasi Middleware
- Pastikan `/api/auth/*` tidak diblokir; middleware saat ini sudah bypass (aman).

## 5) Pusher (opsional, merapikan log)
- Samakan `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET` dengan `NEXT_PUBLIC_PUSHER_KEY`.
- Ini tidak menghambat Google OAuth, tapi mengurangi spam error 401 di log.

## 6) Jika Masih AccessDenied
- Pastikan cookie domain default (tidak ada override custom).
- Coba akses langsung `https://eksporyuk.com/api/auth/signin`; pastikan redirect ke Google muncul.
- Jika tidak ada log `/api/auth/*`, cek kembali DNS/Cloudflare/redirect eksternal yang bisa mengubah callback.
