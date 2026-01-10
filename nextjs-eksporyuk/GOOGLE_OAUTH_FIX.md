# Google OAuth Login Fix - Checklist

## Issue
Google login is not working on https://eksporyuk.com (production) and potentially on localhost development.

## Root Cause
The **Authorized redirect URIs** in Google Cloud Console OAuth 2.0 credentials are likely missing or incorrect.

## Fix Steps

### Step 1: Check Current Configuration in Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project (should be "ekspor-yuks-projects" based on the credentials)
3. Navigate to **APIs & Services** → **Credentials**
4. Find the OAuth 2.0 Client ID (format: `xxx.apps.googleusercontent.com`)
5. Click on it to view/edit details

### Step 2: Add Required Redirect URIs

Add these URIs under **Authorized redirect URIs**:

**For Production (REQUIRED):**
```
https://eksporyuk.com/api/auth/callback/google
```

**For Development (OPTIONAL, for testing):**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
http://127.0.0.1:3000/api/auth/callback/google
http://127.0.0.1:3001/api/auth/callback/google
```

**If using Vercel branch previews (OPTIONAL):**
```
https://eksporyuk.vercel.app/api/auth/callback/google
https://*.eksporyuk.vercel.app/api/auth/callback/google
```

### Step 3: Verify Environment Variables

Check that Vercel has these variables set:

**Settings → Environment Variables:**
- `NEXTAUTH_URL` = `https://eksporyuk.com` ✅ (already set)
- `NEXTAUTH_SECRET` = Set ✅ (already set)
- `GOOGLE_CLIENT_ID` = `<your-google-client-id>` ✅ (already set)
- `GOOGLE_CLIENT_SECRET` = `<your-google-client-secret>` ✅ (already set)

### Step 4: Test OAuth Flow

After updating Google Cloud Console redirect URIs:

1. **Clear browser cache/cookies** to remove old sessions
2. **Hard refresh** the page (Cmd+Shift+R on Mac)
3. Go to `https://eksporyuk.com/auth/login`
4. Click "Masuk dengan Google"
5. Should redirect to Google consent screen
6. After authorization, should redirect back to dashboard

## Debugging Tips

If still not working, check:

1. **Browser DevTools Console**
   - Check for CORS or redirect errors
   - Look for error messages about "Invalid OAuth scope" or "redirect_uri mismatch"

2. **Vercel Logs**
   - Check deployment logs for any build errors
   - Check runtime logs for NextAuth errors

3. **Check Cookie Settings**
   - In `next-auth.config.ts` (or auth-options.ts), cookies might be set to secure-only
   - For production, secure cookies are fine, but make sure `httpOnly: true` is set

4. **Verify NEXTAUTH_URL for Production**
   - Must be exactly: `https://eksporyuk.com` (no trailing slash)
   - Must match your domain exactly
   - NextAuth redirects will fail if this doesn't match

## Current Configuration Status

✅ Google credentials in .env: Present
✅ Environment variables in Vercel: Should be present
⚠️ Google OAuth Redirect URIs in Google Cloud Console: **NEEDS VERIFICATION**
✅ NextAuth auth-options.ts: Configured correctly

## Action Items

1. [ ] Log into Google Cloud Console
2. [ ] Navigate to OAuth 2.0 Client ID settings
3. [ ] Add `https://eksporyuk.com/api/auth/callback/google` to Authorized redirect URIs
4. [ ] Save changes
5. [ ] Wait 5-10 minutes for Google to propagate changes
6. [ ] Test login on production
7. [ ] If testing on localhost, also add `http://localhost:3000/api/auth/callback/google`
8. [ ] Clear browser cache and test again

## Reference
- NextAuth.js Google Provider: https://next-auth.js.org/providers/google
- OAuth Redirect URI Format: `{NEXTAUTH_URL}/api/auth/callback/{provider}`
