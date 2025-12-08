# Google OAuth Production Setup - Web Online Configuration

**Date**: December 8, 2025  
**Purpose**: Production deployment configuration untuk eksporyuk.com

---

## 🚀 Production Environment Details

### Domain Information
- **Primary Domain**: eksporyuk.com
- **WWW Domain**: www.eksporyuk.com
- **Environment**: Production
- **NextAuth URL**: https://eksporyuk.com

---

## Step 1: Create Production Google OAuth Credentials

### 1.1 Go to Google Cloud Console
```
https://console.cloud.google.com
```

### 1.2 Create New Project (atau gunakan existing)
- **Project Name**: Eksporyuk Production
- **Organization**: (sesuai akun Anda)

### 1.3 Enable Google+ API
1. Search for "Google+ API"
2. Click "ENABLE"
3. Wait for activation

### 1.4 Create OAuth Consent Screen (Production)
1. Go to **Credentials** → **Consent Screen**
2. Select **External** as User Type
3. Fill in:
   - **App Name**: Eksporyuk
   - **User Support Email**: support@eksporyuk.com
   - **Developer Contact Email**: admin@eksporyuk.com
4. Click **SAVE AND CONTINUE**
5. Skip Scopes, click **SAVE AND CONTINUE**
6. Add test users (optional)
7. Review & back to dashboard

### 1.5 Create OAuth 2.0 Client ID (Production)
1. Go to **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth client ID**
4. Choose **Web application**
5. Fill in:
   - **Name**: Eksporyuk Web Production
   - **Authorized JavaScript Origins**:
     ```
     https://eksporyuk.com
     https://www.eksporyuk.com
     ```
   - **Authorized Redirect URIs**:
     ```
     https://eksporyuk.com/api/auth/callback/google
     https://www.eksporyuk.com/api/auth/callback/google
     ```

6. Click **CREATE**

### 1.6 Copy Credentials
Save these securely:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

---

## Step 2: Configure in Admin Panel (Production)

### 2.1 Access Production Admin
```
https://eksporyuk.com/admin/integrations
```

**Requirements:**
- Login as ADMIN user
- In production environment

### 2.2 Navigate to Google OAuth
1. In integrations list, find **"Google OAuth"**
2. Click to select
3. Form will appear with 3 fields

### 2.3 Fill Configuration

**Field 1: Client ID**
```
xxxxx.apps.googleusercontent.com
```
(Copy from Google Cloud Console - production credentials)

**Field 2: Client Secret**
```
GOCSPX-xxxxx
```
(Copy from Google Cloud Console - will be masked in UI)

**Field 3: Callback URL**
```
https://eksporyuk.com/api/auth/callback/google
```
(Match with Google Cloud Console exactly)

### 2.4 Save Configuration
1. Click **SAVE** button
2. Wait for validation (should take 1-2 seconds)
3. Should see: ✅ **Connected** status
4. (Optional) Click **Test Connection** to verify

---

## Step 3: Environment Variables (Production Server)

### 3.1 Server Environment File (.env.local)

After saving via admin panel, these variables should be auto-set:

```env
# Google OAuth - Production
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=https://eksporyuk.com/api/auth/callback/google
```

### 3.2 Required NextAuth Variables

Make sure these are also set on production:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://eksporyuk.com
NEXTAUTH_SECRET=[your-secret-key-here]

# Database
DATABASE_URL=[your-production-db-url]
```

### 3.3 Verify Environment Variables

On production server, verify:
```bash
# Check if GOOGLE variables are set
env | grep GOOGLE

# Should output:
# GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
# GOOGLE_CALLBACK_URL=https://eksporyuk.com/api/auth/callback/google
```

---

## Step 4: Verify Configuration

### 4.1 Check Admin Panel Status
1. Go to `/admin/integrations` on production
2. Select "Google OAuth"
3. Verify status shows: ✅ **Connected**
4. Check "Last Tested At" timestamp

### 4.2 Check Database
```sql
SELECT * FROM integration_config WHERE service = 'google';
```

**Expected result:**
```
id      | service | config (JSON)                           | isActive | testStatus
--------|---------|----------------------------------------|----------|----------
cuid... | google  | {"GOOGLE_CLIENT_ID":"...", ...}        | true     | success
```

### 4.3 Test Connection (Admin Panel)
1. Go to `/admin/integrations`
2. Select "Google OAuth"
3. Click **"Test Connection"** button
4. Should see: ✅ **Success message**

---

## Step 5: Test User Login Flow

### 5.1 Test on Checkout Page
1. Open `/checkout/[slug]` (any membership)
2. Without login, should see: **"Lanjutkan dengan Google"** button
3. Click button
4. Redirect to Google login
5. Complete Google login
6. Redirect back to eksporyuk.com
7. User should be logged in

### 5.2 Test on Login Page
1. Open `/auth/login`
2. Should see Google OAuth button
3. Click to trigger login
4. Complete flow
5. Verify user created in database

### 5.3 Verify User Creation
Check database:
```sql
SELECT * FROM user WHERE email LIKE '%@gmail.com' 
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
LIMIT 5;
```

Expected:
- New user record created
- Email from Google account
- Role: MEMBER_FREE
- Email verified: true
- Status: active

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Google OAuth credentials created for production domain
- [ ] Authorized Redirect URIs added in Google Cloud Console
- [ ] NEXTAUTH_URL set to https://eksporyuk.com
- [ ] NEXTAUTH_SECRET configured on production

### During Deployment
- [ ] Configure Google OAuth in admin panel
- [ ] Test connection via admin panel
- [ ] Verify environment variables set
- [ ] Verify database connection

### Post-Deployment
- [ ] Test full login flow on production
- [ ] Monitor login success/failure rates
- [ ] Check server logs for errors
- [ ] Verify user creation in database
- [ ] Test on multiple browsers

### Monitoring (First 24 Hours)
- [ ] Check `/admin/integrations` status regularly
- [ ] Monitor failed login attempts
- [ ] Watch database user creation
- [ ] Monitor error logs
- [ ] Test login every few hours

---

## Common Production Issues & Solutions

### Issue: "Redirect URI mismatch"

**Cause**: Callback URL in admin doesn't match Google Cloud Console

**Solution**:
1. Go to Google Cloud Console
2. Find "Authorized Redirect URIs"
3. Verify it matches: `https://eksporyuk.com/api/auth/callback/google`
4. Update in admin panel if different
5. Re-save configuration

### Issue: Google Button Not Appearing

**Cause**: GOOGLE_CLIENT_ID not set in production

**Solution**:
1. Verify admin panel shows ✅ Connected
2. Check environment variables: `echo $GOOGLE_CLIENT_ID`
3. Restart application server
4. Clear browser cache
5. Try again

### Issue: User Not Created After Login

**Cause**: Database connection or NextAuth callback issue

**Solution**:
1. Check production logs
2. Verify database connection
3. Verify user table exists
4. Check NextAuth callbacks in auth-options.ts
5. Try login again with different email

### Issue: "Invalid Client Secret"

**Cause**: Client Secret expired or regenerated

**Solution**:
1. Go to Google Cloud Console
2. Regenerate Client Secret
3. Copy new secret
4. Update in admin panel
5. Re-save configuration
6. Test connection

---

## Database Configuration

### Check Integration Config
```sql
SELECT 
  service,
  config,
  isActive,
  testStatus,
  lastTestedAt
FROM integration_config 
WHERE service = 'google';
```

### Update if Needed
```sql
UPDATE integration_config 
SET config = JSON_SET(
  config,
  '$.GOOGLE_CLIENT_ID', 'xxxxx.apps.googleusercontent.com',
  '$.GOOGLE_CLIENT_SECRET', 'GOCSPX-xxxxx',
  '$.GOOGLE_CALLBACK_URL', 'https://eksporyuk.com/api/auth/callback/google'
)
WHERE service = 'google';
```

---

## Security Checklist (Production)

- [ ] Client Secret is protected (not in logs, not shared)
- [ ] HTTPS used for all callback URLs
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Environment variables not exposed
- [ ] Admin-only access to integrations page
- [ ] Database encryption enabled
- [ ] Regular credential rotation (every 6 months)
- [ ] Monitoring and alerting set up

---

## Domains Configuration

### Primary Domain (eksporyuk.com)

**Google Cloud Console:**
```
Authorized JavaScript Origins:
  https://eksporyuk.com

Authorized Redirect URIs:
  https://eksporyuk.com/api/auth/callback/google
```

**Admin Panel (Google OAuth):**
```
Client ID: xxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxx
Callback URL: https://eksporyuk.com/api/auth/callback/google
```

### WWW Domain (www.eksporyuk.com)

**Optional: If using both domains**

**Google Cloud Console:**
```
Authorized JavaScript Origins:
  https://www.eksporyuk.com

Authorized Redirect URIs:
  https://www.eksporyuk.com/api/auth/callback/google
```

**Note**: You can have multiple URIs in Google Cloud Console. Users logging in from both domains will work with single credentials.

---

## Troubleshooting Production Issues

### Check Logs
```bash
# Check application logs for Google OAuth errors
tail -f /var/log/eksporyuk/error.log | grep -i google

# Check authentication errors
tail -f /var/log/eksporyuk/auth.log | grep -i oauth
```

### Test from Command Line
```bash
# Verify GOOGLE variables
curl https://eksporyuk.com/api/admin/integrations?service=google

# Should return config with GOOGLE_* fields
```

### Manual Database Check
```sql
-- Verify configuration
SELECT * FROM integration_config WHERE service = 'google';

-- Check recent user logins
SELECT id, email, role, created_at FROM user 
ORDER BY created_at DESC LIMIT 10;

-- Check failed login attempts
SELECT * FROM login_attempts 
WHERE provider = 'google' AND success = false 
ORDER BY created_at DESC LIMIT 10;
```

---

## Performance Notes

### Expected Response Times
- Login button load: < 100ms
- Google redirect: instant
- Callback processing: 1-3 seconds
- User creation: < 500ms
- Total flow: 5-10 seconds

### Scalability
- Supports concurrent logins
- No performance impact on page load
- Database queries optimized
- No rate limiting from Google (for normal usage)

---

## Next Steps

1. ✅ Create production Google OAuth credentials
2. ✅ Add Authorized Redirect URIs in Google Cloud Console
3. ✅ Configure in admin panel (`/admin/integrations`)
4. ✅ Test connection
5. ✅ Test full login flow
6. ✅ Monitor for 24 hours
7. ✅ Document any issues
8. ✅ Plan credential rotation (every 6 months)

---

## Support & Documentation

For additional help:
- **Quick Reference**: GOOGLE_OAUTH_QUICK_REFERENCE.md
- **Detailed Setup**: GOOGLE_OAUTH_SETUP_GUIDE.md
- **Admin Panel**: GOOGLE_OAUTH_ADMIN_INTEGRATION.md
- **Full Overview**: GOOGLE_OAUTH_IMPLEMENTATION_COMPLETE.md

---

## Production Credentials (Secure Storage)

**KEEP IN SECURE LOCATION** (password manager, vault, etc):

```
Service: Eksporyuk Production Google OAuth
Domain: eksporyuk.com

Client ID: ___________________________________
Client Secret: ________________________________
Created Date: ________________________________
Rotation Date: ________________________________
Notes: ________________________________________
```

---

**Status**: Production Ready  
**Date**: December 8, 2025  
**Environment**: eksporyuk.com (HTTPS)
