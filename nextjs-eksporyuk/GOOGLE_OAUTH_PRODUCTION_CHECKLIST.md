# Google OAuth Production Deployment - Quick Checklist

**Domain**: eksporyuk.com  
**Status**: Ready for Production Setup

---

## 📋 Quick Action Checklist

### STEP 1: Google Cloud Console Setup (5 minutes)

- [ ] Go to console.cloud.google.com
- [ ] Create or select project
- [ ] Enable Google+ API
- [ ] Create OAuth Consent Screen (External)
  - App Name: Eksporyuk
  - Support Email: support@eksporyuk.com
  - Dev Email: admin@eksporyuk.com
- [ ] Create OAuth 2.0 Client ID (Web application)
  - Authorized Origins: https://eksporyuk.com, https://www.eksporyuk.com
  - Redirect URIs: https://eksporyuk.com/api/auth/callback/google
- [ ] Copy Client ID
- [ ] Copy Client Secret

### STEP 2: Production Admin Configuration (2 minutes)

- [ ] Go to https://eksporyuk.com/admin/integrations
- [ ] Select "Google OAuth"
- [ ] Paste Client ID
- [ ] Paste Client Secret
- [ ] Verify Callback URL: https://eksporyuk.com/api/auth/callback/google
- [ ] Click SAVE
- [ ] Wait for ✅ Connected status

### STEP 3: Verification (3 minutes)

- [ ] Status shows ✅ Connected (green)
- [ ] Click "Test Connection" → Success
- [ ] Check environment: GOOGLE_CLIENT_ID is set
- [ ] Check database: integration_config has google entry

### STEP 4: Test User Login (5 minutes)

- [ ] Go to https://eksporyuk.com/checkout/[membership-slug]
- [ ] See "Lanjutkan dengan Google" button
- [ ] Click button → Google login page
- [ ] Login with test Google account
- [ ] Redirected back to eksporyuk.com
- [ ] User logged in (name visible in header)
- [ ] Check database: new user record created
- [ ] Verify: role=MEMBER_FREE, email_verified=true

### STEP 5: Production Monitoring (Ongoing)

- [ ] Check /admin/integrations status daily (first week)
- [ ] Monitor login success rate
- [ ] Check error logs for Google OAuth errors
- [ ] Test login weekly with different account
- [ ] Document any issues

---

## 🔑 Production Credentials Template

**Save in secure location (password manager, vault):**

```
Service: Eksporyuk Production Google OAuth
Domain: eksporyuk.com
Environment: Production (HTTPS)

Client ID: [from Google Cloud Console]
Client Secret: [from Google Cloud Console]

Authorized Origins:
  - https://eksporyuk.com
  - https://www.eksporyuk.com

Authorized Redirect URI:
  - https://eksporyuk.com/api/auth/callback/google
  - https://www.eksporyuk.com/api/auth/callback/google

Created: [date]
Last Rotated: [date]
Next Rotation: [date + 6 months]

Notes: [any special notes]
```

---

## ⚙️ Environment Variables (Production Server)

After admin configuration, verify these are set:

```bash
# Check variables
echo "Client ID: $GOOGLE_CLIENT_ID"
echo "Callback: $GOOGLE_CALLBACK_URL"

# Should output:
# Client ID: xxxxx.apps.googleusercontent.com
# Callback: https://eksporyuk.com/api/auth/callback/google
```

---

## 🧪 Quick Test Commands

### Test API Configuration
```bash
curl https://eksporyuk.com/api/admin/integrations?service=google \
  -H "Cookie: [admin-session-token]"

# Should return config with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

### Check Database
```sql
-- In production database
SELECT service, isActive, testStatus 
FROM integration_config 
WHERE service = 'google';

-- Should show: google | true | success
```

---

## ⚠️ Common Issues (Production)

### Button doesn't appear
- [ ] Refresh browser + clear cache
- [ ] Check admin panel: status = ✅
- [ ] Restart application server
- [ ] Check GOOGLE_CLIENT_ID is set

### "Redirect URI mismatch" error
- [ ] Go to Google Cloud Console
- [ ] Verify Authorized Redirect URIs match exactly
- [ ] Re-save in admin panel
- [ ] Clear browser cookies

### User not created
- [ ] Check database connection
- [ ] Check application logs
- [ ] Verify auth callbacks
- [ ] Try login with different email

### "Invalid Client Secret"
- [ ] Regenerate in Google Cloud Console
- [ ] Update in admin panel
- [ ] Re-test connection
- [ ] Try login again

---

## 📞 Quick Reference

**Documentation Files:**
- Setup Guide: GOOGLE_OAUTH_PRODUCTION_SETUP.md (this file)
- Quick Ref: GOOGLE_OAUTH_QUICK_REFERENCE.md
- Full Guide: GOOGLE_OAUTH_ADMIN_INTEGRATION.md

**Admin Panel Location:** https://eksporyuk.com/admin/integrations

**Production Domain:** eksporyuk.com (HTTPS only)

**Callback URL Pattern:** https://eksporyuk.com/api/auth/callback/google

**Database Table:** integration_config (service='google')

---

## ✅ Sign-Off Checklist

- [ ] All steps completed
- [ ] Login tested successfully
- [ ] No errors in logs
- [ ] Status shows Connected
- [ ] User creation verified
- [ ] Monitoring set up
- [ ] Credentials securely stored
- [ ] Team notified of go-live

---

**Status**: Ready for Production Deployment  
**Environment**: eksporyuk.com (HTTPS)  
**Date Created**: December 8, 2025
