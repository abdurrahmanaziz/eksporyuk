# Google OAuth Login Setup Guide

## Overview
Konfigurasi Google OAuth untuk enable login dengan akun Google di platform Eksporyuk. Integrasi ini menggunakan NextAuth.js dengan Google provider.

## Requirements
- Google Cloud Project (new atau existing)
- Access ke Google Cloud Console
- Admin access ke Eksporyuk platform

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in dengan akun Google
3. Klik **"Select a Project"** di top navigation
4. Klik **"NEW PROJECT"**
5. Fill in:
   - **Project Name**: `eksporyuk` atau nama lainnya
   - **Organization**: Pilih yang sesuai (opsional)
6. Klik **"CREATE"**

### 2. Enable Google+ API

1. Di console, search untuk **"Google+ API"** atau navigate ke APIs
2. Click pada Google+ API
3. Klik **"ENABLE"**
4. Tunggu sampai proses selesai

### 3. Create OAuth 2.0 Credentials

1. Di sidebar, klik **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** button
3. Select **"OAuth client ID"**
4. Akan diminta untuk create consent screen dulu

### 4. Configure OAuth Consent Screen

1. Klik **"Consent Screen"** tab di sidebar
2. Select **"External"** sebagai User Type
3. Klik **"CREATE"**
4. Fill in required fields:

   **OAuth Consent Screen:**
   - **App Name**: `Eksporyuk`
   - **User Support Email**: your-email@example.com
   - **Developer Contact Email**: your-email@example.com

5. Klik **"SAVE AND CONTINUE"**

6. **Scopes Page** - Optional, bisa skip
   - Klik **"SAVE AND CONTINUE"**

7. **Test Users** - Tambah email untuk testing (opsional)
   - Klik **"SAVE AND CONTINUE"**

8. Review dan klik **"BACK TO DASHBOARD"**

### 5. Create OAuth Credentials

1. Kembali ke **"Credentials"** tab
2. Klik **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. Choose **"Web application"**
5. Fill in:
   - **Name**: `Eksporyuk Web Client`
   - **Authorized JavaScript Origins**: 
     ```
     http://localhost:3000
     https://eksporyuk.com
     https://www.eksporyuk.com
     ```
   - **Authorized Redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://eksporyuk.com/api/auth/callback/google
     https://www.eksporyuk.com/api/auth/callback/google
     ```

6. Klik **"CREATE"**
7. Download JSON atau copy credentials

### 6. Copy Credentials

Di popup yang muncul, copy:
- **Client ID** (format: xxxxx.apps.googleusercontent.com)
- **Client Secret** (jangan share ini!)

## Configuration di Admin Panel

### Admin Integrations Page

1. Login sebagai ADMIN
2. Navigate ke **Admin > Integrations**
3. Select **"Google OAuth"** dari daftar integrasi
4. Fill in fields:

   | Field | Value |
   |-------|-------|
   | **Client ID** | Paste Client ID dari step sebelumnya |
   | **Client Secret** | Paste Client Secret (akan di-mask) |
   | **Callback URL** | `http://localhost:3000/api/auth/callback/google` (production: use your domain) |

5. Klik **"SAVE"** button
6. Sistem akan validate credentials

### Validation Checks

System akan validate:
- ✅ Client ID format (must contain `.apps.googleusercontent.com`)
- ✅ Client Secret presence
- ✅ Callback URL format (must end with `/api/auth/callback/google`)
- ✅ Callback URL matches NEXTAUTH_URL

## Environment Variables

Variables yang akan di-set:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-key
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google
```

## Testing Google Login

### Development Testing

1. **Start Dev Server**
   ```bash
   cd nextjs-eksporyuk
   npm run dev
   ```

2. **Go to Login Page**
   - Navigate ke `/auth/login`
   - Atau ke checkout page

3. **Click "Lanjutkan dengan Google"**
   - Button akan trigger Google login flow
   - Redirect ke Google login page
   - After approval, redirect ke app dengan user data

4. **Verify User Creation**
   - Check database untuk new user record
   - User harus punya email dari Google account
   - Session harus include user data

### Production Testing

1. **Update Callback URL**
   - In Google Cloud Console
   - Change callback URL to production domain
   
2. **Update Environment Variables**
   ```env
   NEXTAUTH_URL=https://eksporyuk.com
   GOOGLE_CALLBACK_URL=https://eksporyuk.com/api/auth/callback/google
   ```

3. **Test Login Flow**
   - Visit production domain
   - Test Google login button

## Troubleshooting

### Error: "Invalid Client ID"
- **Cause**: Client ID format invalid atau tidak cocok dengan di-config
- **Solution**: 
  - Copy exact Client ID dari Google Cloud Console
  - Make sure format: `xxxxx.apps.googleusercontent.com`

### Error: "Redirect URI mismatch"
- **Cause**: Callback URL di code tidak match dengan di Google Cloud Console
- **Solution**:
  - Update `GOOGLE_CALLBACK_URL` environment variable
  - Update Authorized Redirect URIs di Google Cloud Console
  - Pastikan NEXTAUTH_URL sama dengan domain di callback URL

### Error: "Invalid Client Secret"
- **Cause**: Secret key wrong atau expired
- **Solution**:
  - Regenerate credentials di Google Cloud Console
  - Copy new secret
  - Update di admin integrations panel

### Login Button Not Showing
- **Cause**: 
  - GOOGLE_CLIENT_ID not set
  - Credentials not saved to database
- **Solution**:
  - Check database: `integrationConfig` table untuk service='google'
  - Verify `isActive=true` dan config has credentials
  - Clear browser cache

### User Not Created After Google Login
- **Cause**: NextAuth callback logic issue
- **Solution**:
  - Check NextAuth logs in server
  - Verify `authOptions` include google provider
  - Check user role assignment logic

## Features Integration

### Where Google Login Shows

1. **Checkout Page** (`/checkout/[slug]`)
   - Google login button untuk non-logged-in users
   - Allow purchase with Google auth

2. **Login Page** (`/auth/login`)
   - Google OAuth button sebagai alternative login

3. **Membership Enrollment** (`/membership/[slug]`)
   - Option to login with Google

### Auto User Registration

Saat user login via Google:
1. Check if email exists di database
2. If not exist:
   - Create new user dengan:
     - email dari Google
     - name dari Google profile
     - role: MEMBER_FREE (default)
     - Auto-verify email (since from trusted source)
3. If exist: just login

### Role Assignment

New users dari Google login automatically assign:
- **Role**: `MEMBER_FREE`
- **Email Verified**: `true`
- **Status**: `active`

## Best Practices

### Security

1. **Never share Client Secret**
   - Only share Client ID for public use
   - Client Secret hanya di environment variables

2. **Use Environment Variables**
   - Never hardcode credentials
   - Use `.env.local` untuk development

3. **HTTPS in Production**
   - Always use HTTPS URLs di production
   - Google requires HTTPS for redirect URIs in production

4. **Regenerate Periodically**
   - Regenerate credentials setiap 6-12 bulan
   - Delete old credentials

### Configuration

1. **Separate Credentials per Environment**
   - Development: localhost credentials
   - Staging: staging.domain.com credentials
   - Production: domain.com credentials

2. **Keep Redirect URIs Updated**
   - Add all domains yang akan pakai Google login
   - Include www dan non-www variants

3. **Test Before Going Live**
   - Test di staging environment dulu
   - Verify all features bekerja dengan Google auth

## Monitoring

### Check Integration Status

Via Admin Panel:
- Go to `/admin/integrations`
- Select "Google OAuth"
- Status indicator akan show:
  - ✅ **Connected** - Credentials valid dan authenticated
  - ⚠️ **Not Configured** - Missing credentials
  - ❌ **Error** - Credentials invalid atau test failed

### Database Checks

Check `integrationConfig` table:
```sql
SELECT * FROM integration_config 
WHERE service = 'google';
```

Should show:
- `config` with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- `isActive = true`
- `testStatus = success` (after successful test)

### Logs Monitoring

Check server logs untuk:
- Google OAuth callback requests
- User creation/login events
- Any authentication errors

## Rollback / Disable

### Temporarily Disable

1. Go to Admin Integrations
2. Select "Google OAuth"
3. Klik **"Disable"** button (jika ada)
4. Google login akan hidden dari UI

### Delete Credentials

1. Go to Google Cloud Console
2. Go to Credentials
3. Find OAuth 2.0 Client IDs
4. Klik 3-dot menu > Delete

Note: This akan immediate break Google login. Prepare users dulu.

## Related Documentation

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Eksporyuk Auth System](./AUTH_SYSTEM.md)
- [Admin Integration Panel](./ADMIN_FEATURES.md)

## Support

Untuk masalah Google OAuth setup:
1. Check console browser untuk errors
2. Check server logs di terminal
3. Verify credentials di Google Cloud Console
4. Test connection via Admin Panel > Test Connection button

---

**Last Updated**: December 8, 2025
**Status**: Complete & Tested
