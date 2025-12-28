# Google Login Troubleshooting - Quick Diagnosis

## 🔴 Current Issue
Google login button doesn't work on production (https://eksporyuk.com)

## ✅ What's Working
- Google credentials are configured in .env
- Google credentials are likely in Vercel (need to verify)
- NextAuth is properly set up
- Login page has Google button with correct handler

## ❌ Likely Problem: Missing Redirect URI in Google Cloud Console

### The Problem
Google OAuth requires exact redirect URI configuration. Without the correct URI, Google will reject the callback.

### The Solution

**REQUIRED ACTION:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID (format: `xxx.apps.googleusercontent.com`)
3. Click to edit
4. Under "Authorized redirect URIs", add:
   - `https://eksporyuk.com/api/auth/callback/google`
5. Click Save

### Why This Works
When user clicks Google login:
1. Our app redirects to: `https://accounts.google.com/o/oauth2/v2/auth?...`
2. User logs in with Google
3. Google redirects back to: `https://eksporyuk.com/api/auth/callback/google`
4. If this URI isn't in Google Console whitelist → Google rejects it
5. Error shows: "redirect_uri_mismatch" or similar

## 🔍 How to Verify the Problem

### In Browser
1. Open Chrome DevTools (F12)
2. Go to https://eksporyuk.com/auth/login
3. Click "Masuk dengan Google"
4. Check Console tab for errors
5. Look for errors like:
   - `redirect_uri_mismatch`
   - `invalid_request`
   - "OAuth provider not configured"

### In Vercel Logs
1. Go to https://vercel.com/dashboard
2. Select eksporyuk project
3. Click "Deployments" → Latest
4. Click "Runtime logs"
5. Search for "google" or "OAuth"
6. Look for errors in auth flow

## 📋 Verification Checklist

- [ ] Google Cloud Console has redirect URI for production
- [ ] Vercel has GOOGLE_CLIENT_ID set correctly
- [ ] Vercel has GOOGLE_CLIENT_SECRET set correctly
- [ ] Vercel has NEXTAUTH_URL = https://eksporyuk.com
- [ ] Vercel deployment is NOT in preview/draft mode
- [ ] Waited 5-10 minutes after adding redirect URI
- [ ] Cleared browser cache (Cmd+Shift+Delete)
- [ ] Hard refreshed page (Cmd+Shift+R)
- [ ] Tested in incognito/private window

## 🆘 If Still Not Working

1. Check error message in browser console
2. Share the exact error with support
3. Verify client ID matches between:
   - .env file
   - Google Cloud Console
   - Vercel environment variables
4. Double-check redirect URI spelling/casing

## 📞 For Support
If the above doesn't work:
1. Check Vercel deployment logs for detailed error
2. Verify all environment variables are set
3. Test on a different browser/device
4. Clear all cookies and cache
5. Try logging in on localhost (if NEXTAUTH_URL is set correctly)

