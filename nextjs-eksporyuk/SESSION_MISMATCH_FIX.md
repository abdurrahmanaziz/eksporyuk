# Session Mismatch Fix - Eksporyuk Platform

## Problem
Error "User not found" di halaman `/profile` terjadi ketika:
- User ID di session cookie tidak cocok dengan database
- Biasanya terjadi setelah database di-reset/seed ulang
- Session masih menyimpan ID user lama yang sudah tidak ada

## Automatic Solution

### 🎯 Quick Fix (Recommended)

1. **Buka halaman profile** yang error
2. **Klik tombol "Fix Session Mismatch"** 
3. Akan auto-redirect ke `/clear-session`
4. Session akan dibersihkan otomatis
5. Redirect ke login
6. Login dengan credentials valid

### 🔧 Manual Access

Langsung akses: **`http://localhost:3000/clear-session`**

## Features

### 1. Auto-Detection & Redirect
- Ketika API return 404 (User not found)
- Otomatis redirect ke `/clear-session` dalam 1.5 detik
- Toast notification menginformasikan masalah

### 2. Clear Session Page (`/clear-session`)
- Otomatis sign out dari NextAuth
- Clear session via API
- Clear all cookies client-side
- Auto redirect ke login setelah sukses

### 3. API Endpoint
```
GET /api/auth/clear-session
```
Returns:
```json
{
  "success": true,
  "message": "Session cleared successfully",
  "deletedCookies": ["next-auth.session-token", ...],
  "instructions": { ... }
}
```

### 4. Debug Script
```bash
node fix-session-mismatch.js
```
Output:
- List semua user di database
- Menampilkan ID, email, role
- Instruksi manual clear session

## Login Credentials (Default Seed)

| Email | Password | Role |
|-------|----------|------|
| `admin@eksporyuk.com` | `password123` | ADMIN |
| `premium@eksporyuk.com` | `password123` | MEMBER_PREMIUM |
| `affiliate@eksporyuk.com` | `password123` | AFFILIATE |

## Manual Clear (If Automatic Fails)

### Browser DevTools
1. Open DevTools (F12)
2. Go to: **Application** → **Cookies** → **http://localhost:3000**
3. Delete all cookies (especially `next-auth.*`)
4. Reload page
5. Go to `/login` and login again

### Browser Console
```javascript
// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/"
})

// Reload
location.reload()
```

## Architecture

```
User opens /profile
       ↓
API: GET /api/user/profile
       ↓
Session user ID: xyz123 (old)
Database user IDs: abc456, def789 (new)
       ↓
404 User not found
       ↓
fetchProfile() detects 404
       ↓
Toast: "User tidak ditemukan - session mismatch"
       ↓
Auto redirect to /clear-session (1.5s)
       ↓
/clear-session page:
  1. signOut() from NextAuth
  2. fetch('/api/auth/clear-session')
  3. Clear client cookies
       ↓
Redirect to /auth/login
       ↓
User logs in with valid credentials
       ↓
New session with correct user ID
       ↓
/profile loads successfully ✅
```

## Files Involved

1. **`/src/app/clear-session/page.tsx`** - Clear session page with auto-clearing
2. **`/src/app/api/auth/clear-session/route.ts`** - API to delete cookies server-side
3. **`/src/app/(dashboard)/profile/page.tsx`** - Enhanced error handling with auto-redirect
4. **`fix-session-mismatch.js`** - Debug script to check database users

## Prevention

To avoid this issue in future:
1. Always **logout before** running `prisma migrate reset` or `db push`
2. After seed, **login immediately** with fresh credentials
3. If seeding fails, run: `node scripts/quick-seed.js`

## Troubleshooting

### Error persists after clear session
**Cause**: Database might be empty or user doesn't exist

**Solution**:
```bash
cd nextjs-eksporyuk
node scripts/quick-seed.js
# Or
npx prisma db seed
```

### Clear session page doesn't work
**Cause**: JavaScript blocked or API error

**Solution**: Manual clear via DevTools (see above)

### Cannot login after clearing
**Cause**: User doesn't exist in database

**Solution**:
```bash
# Check users
sqlite3 prisma/dev.db "SELECT id, email, role FROM User;"

# If empty, seed
node scripts/quick-seed.js
```

## Support

For issues, check:
1. Console errors (F12)
2. Network tab for API responses
3. Database: `sqlite3 prisma/dev.db "SELECT * FROM User LIMIT 5;"`
4. NextAuth debug logs in terminal

---

**Last Updated**: 8 Desember 2025  
**Version**: 1.0.0
