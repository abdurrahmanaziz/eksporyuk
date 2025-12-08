# Google OAuth Admin Integration - Quick Reference

## TL;DR (untuk mereka yang ingin langsung action)

### Admin Configuration (3 menit)

```
1. Navigate to: /admin/integrations
2. Select: Google OAuth
3. Fill fields:
   - Client ID: xxxxx.apps.googleusercontent.com
   - Client Secret: GOCSPX-xxxxx
   - Callback URL: http://localhost:3000/api/auth/callback/google
4. Click: SAVE
5. Status: Should show ✅ Connected
```

### Get Google Credentials (5 menit)

1. Go to: https://console.cloud.google.com
2. Create new project (or use existing)
3. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized Redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID & Client Secret
5. Paste ke admin panel

### Test It Works

1. Click "Test Connection" in admin panel → Should succeed
2. Go to `/checkout/[slug]` or `/auth/login`
3. See "Lanjutkan dengan Google" button
4. Click → Google login → Done!

---

## Common Tasks

### "Saya sudah configure, tapi Google button tidak muncul"

**Checklist:**
- [ ] Go to `/admin/integrations` → Google OAuth selected → Status = ✅ Connected?
- [ ] Close dev tools, refresh page, clear cache
- [ ] Check server console: `grep GOOGLE_CLIENT_ID .env.local` → exists?
- [ ] Restart dev server: `npm run dev`

### "Saya dapat error 'Redirect URI mismatch' saat login"

**Quick fix:**
1. Copy callback URL yang error dari Google message
2. Go to Google Cloud Console
3. Update "Authorized Redirect URIs" dengan yang error
4. Simpan
5. Go back to `/admin/integrations`
6. Update "Callback URL" field ke yang sama
7. Click SAVE
8. Try login again

### "Client Secret tidak bisa di-copy di admin panel (karena masked)"

**Solution:**
1. Go to Google Cloud Console
2. Find your OAuth 2.0 Client ID
3. Click pencil icon untuk edit
4. Regenerate Client Secret (jika perlu)
5. Copy the new one
6. Paste ke `/admin/integrations` > Google OAuth > Client Secret field

### "Saya ubah dari development ke production domain"

**Steps:**
1. In Google Cloud Console:
   - Add new "Authorized Redirect URIs": `https://eksporyuk.com/api/auth/callback/google`

2. In `/admin/integrations` > Google OAuth:
   - Update Callback URL: `https://eksporyuk.com/api/auth/callback/google`
   - Click SAVE

3. Check `.env.local` updated:
   ```bash
   grep GOOGLE_CALLBACK_URL .env.local
   # Should show: GOOGLE_CALLBACK_URL=https://eksporyuk.com/api/auth/callback/google
   ```

---

## Database Queries

### Check jika Google OAuth sudah di-save

```sql
SELECT * FROM integration_config WHERE service = 'google';
```

**Expected:**
```
id           | service | config (JSON with 3 keys)      | isActive | testStatus | lastTestedAt
cuid_123456  | google  | {"GOOGLE_CLIENT_ID": "...", ...} | true     | success    | 2025-12-08...
```

### Delete configuration (jika mau reset)

```sql
DELETE FROM integration_config WHERE service = 'google';
```

Then go back to `/admin/integrations` → Fresh form

---

## API Calls (untuk testing)

### Get Configuration Status

```bash
curl http://localhost:3000/api/admin/integrations?service=google \
  -H "Cookie: next-auth.session-token=<your-token>"
```

### Save Configuration

```bash
curl -X POST http://localhost:3000/api/admin/integrations \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d 'service=google&config={"GOOGLE_CLIENT_ID":"xxx.apps.googleusercontent.com","GOOGLE_CLIENT_SECRET":"GOCSPX-xxx","GOOGLE_CALLBACK_URL":"http://localhost:3000/api/auth/callback/google"}'
```

### Test Connection

```bash
curl -X POST http://localhost:3000/api/admin/integrations/test \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d '{"service":"google"}'
```

---

## Environment Variables

### What gets set automatically

After saving in admin panel, `.env.local` gets updated:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google
```

### What needs to be there already

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

If these missing, Google login won't work even if Google creds are set.

---

## File Locations

### Where did we add code?

```
src/app/(dashboard)/admin/integrations/
  └─ page.tsx              ← Google OAuth in list + form

src/app/api/admin/integrations/
  ├─ route.ts              ← Validation & saving
  └─ test/route.ts         ← Connection testing

.env.example               ← GOOGLE_CALLBACK_URL added
```

### Where did we add docs?

```
root/
  ├─ GOOGLE_OAUTH_SETUP_GUIDE.md                    ← For setup
  ├─ GOOGLE_OAUTH_ADMIN_INTEGRATION.md              ← For admin panel
  └─ GOOGLE_OAUTH_IMPLEMENTATION_COMPLETE.md        ← This overview
```

---

## Status Indicators

### What the ✅✅✅ mean?

| Status | Meaning |
|--------|---------|
| ✅ Connected | Config saved, tested, ready to use |
| ⚠️ Not Configured | No credentials saved yet |
| ❌ Error | Credentials invalid atau test failed |

Check `/admin/integrations` to see current status.

---

## Next Steps

1. **Now**: Go to `/admin/integrations` and configure
2. **After save**: Test connection
3. **Then**: Try login on checkout/login page
4. **Finally**: Go live! 🚀

---

## Linked Documentation

For detailed info:

- **Setup dari scratch**: `GOOGLE_OAUTH_SETUP_GUIDE.md`
- **Admin panel guide**: `GOOGLE_OAUTH_ADMIN_INTEGRATION.md`
- **Full overview**: `GOOGLE_OAUTH_IMPLEMENTATION_COMPLETE.md`

---

## Super Quick Troubleshooting

| Problem | 1st Try | 2nd Try |
|---------|---------|---------|
| Button tidak muncul | Refresh page + clear cache | Restart dev server |
| Can't save config | Check fields all filled | Check format (Client ID, Callback URL) |
| "Redirect URI mismatch" | Check Callback URL match | Update Google Cloud Console |
| Can't copy secret | It's masked for security | Get new one from Google Cloud Console |
| Status shows error | Re-save config | Run test connection |

---

**Version**: 1.0  
**Last Updated**: December 8, 2025  
**Status**: Production Ready
