# Google OAuth Integration - Admin Panel Configuration

## Quick Start

### Location
- **Admin Panel**: `/admin/integrations`
- **Service**: Google OAuth
- **Status Indicator**: Shows connected/not-configured/error status

### Configuration Fields

| Field | Description | Required | Type |
|-------|-------------|----------|------|
| **Client ID** | OAuth 2.0 Client ID dari Google Cloud Console | Yes | Text (not masked) |
| **Client Secret** | OAuth 2.0 Client Secret (sensitive!) | Yes | Text (masked) |
| **Callback URL** | Authorized Redirect URI | Yes | Text (not masked) |

## Configuration Steps in Admin Panel

### 1. Select Google OAuth Service

1. Go to `/admin/integrations`
2. Look for **"Google OAuth"** in the service list
3. Click to select it
4. The service details and configuration form will appear

### 2. Fill in Client ID

1. Copy your **Client ID** from [Google Cloud Console](https://console.cloud.google.com)
2. Format: `xxxxx.apps.googleusercontent.com`
3. Paste into **"Client ID"** field
4. Click away or press Tab to validate

**Validation Rules:**
- ✅ Must contain `.apps.googleusercontent.com`
- ✅ Length > 10 characters
- ❌ Cannot be empty

### 3. Fill in Client Secret

1. Copy your **Client Secret** from Google Cloud Console
2. Paste into **"Client Secret"** field
3. This field will be masked for security

**Validation Rules:**
- ✅ Must be at least 20 characters
- ✅ Will be stored encrypted in database
- ❌ Cannot be empty
- ❌ Cannot be shared via URL (masked in UI)

### 4. Fill in Callback URL

1. Enter your **Callback URL**
2. Format: `{YOUR_DOMAIN}/api/auth/callback/google`

**Examples:**
```
Development:   http://localhost:3000/api/auth/callback/google
Staging:       https://staging.eksporyuk.com/api/auth/callback/google
Production:    https://eksporyuk.com/api/auth/callback/google
```

**Validation Rules:**
- ✅ Must end with `/api/auth/callback/google` or `/auth/callback/google`
- ✅ Must be exactly same as in Google Cloud Console's Authorized Redirect URIs
- ✅ Must be HTTPS in production
- ❌ Cannot have trailing slash or query params

### 5. Save Configuration

1. Click **"SAVE"** button
2. System will validate all credentials
3. If successful:
   - ✅ Green status indicator
   - ✅ "Successfully configured" message
   - ✅ Config saved to database
   - ✅ Environment variables updated (`.env.local`)

**Error Handling:**
- If error, red indicator and error message appears
- Common errors:
  - "Client ID tidak valid" → Check format
  - "Callback URL harus berakhir dengan..." → Fix callback URL
  - "Client Secret, dan Callback URL harus diisi" → Fill all required fields

### 6. Test Connection (Optional)

1. After saving, click **"Test Connection"** button
2. System will validate credentials with Google
3. Results:
   - ✅ "Konfigurasi Google OAuth valid" → Credentials recognized
   - ❌ "Error dari Google: ..." → Credentials invalid or revoked

## Integration Points in App

### Where Google Login Appears

#### 1. Checkout Page - Membership
**Path**: `/checkout/[slug]`
```
[Lanjutkan dengan Google] button appears when:
- User not logged in
- GOOGLE_CLIENT_ID is configured
- Google OAuth is active
```

#### 2. Checkout Page - Product
**Path**: `/checkout/product/[slug]`
```
Same behavior as membership checkout
```

#### 3. Login Page
**Path**: `/auth/login`
```
Google OAuth button appears when GOOGLE_CLIENT_ID is set
```

### Conditional Rendering

Google login button shows only when:
1. GOOGLE_CLIENT_ID environment variable is set
2. IntegrationConfig for 'google' service exists
3. isActive = true in database
4. config contains GOOGLE_CLIENT_ID value

## Database Schema

### IntegrationConfig Table

```sql
CREATE TABLE integration_config (
  id String @id
  service String @unique        -- 'google'
  config Json                   -- { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL }
  isActive Boolean @default(true)
  testStatus String?            -- 'success', 'failed', null
  lastTestedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
)
```

**Example Record:**
```json
{
  "id": "cuid_123",
  "service": "google",
  "config": {
    "GOOGLE_CLIENT_ID": "123456789.apps.googleusercontent.com",
    "GOOGLE_CLIENT_SECRET": "GOCSPX-xxxxxxxxxxxxxxxx",
    "GOOGLE_CALLBACK_URL": "http://localhost:3000/api/auth/callback/google"
  },
  "isActive": true,
  "testStatus": "success",
  "lastTestedAt": "2025-12-08T10:30:00Z",
  "createdAt": "2025-12-08T09:00:00Z",
  "updatedAt": "2025-12-08T10:30:00Z"
}
```

## Environment Variables

### Saved Variables in `.env.local`

After saving configuration, these variables are written to `.env.local`:

```env
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google
```

### Required Variables for NextAuth

For Google OAuth to work, NextAuth needs:

```env
NEXTAUTH_URL=http://localhost:3000           # Domain where app runs
NEXTAUTH_SECRET=your-secret-key              # For JWT signing (auto-generated)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

## API Endpoints

### GET /api/admin/integrations
**Get all services status**

```bash
curl http://localhost:3000/api/admin/integrations \
  -H "Authorization: Bearer <admin-session-token>"
```

**Response:**
```json
{
  "google": {
    "configured": true,
    "isActive": true,
    "testStatus": "success",
    "lastTestedAt": "2025-12-08T10:30:00Z"
  },
  ...
}
```

### GET /api/admin/integrations?service=google
**Get specific service configuration**

```bash
curl "http://localhost:3000/api/admin/integrations?service=google" \
  -H "Authorization: Bearer <admin-session-token>"
```

**Response:**
```json
{
  "configured": true,
  "isActive": true,
  "config": {
    "GOOGLE_CLIENT_ID": "123456789.apps.googleusercontent.com",
    "GOOGLE_CLIENT_SECRET": "GOCSPX-xxxxx",
    "GOOGLE_CALLBACK_URL": "http://localhost:3000/api/auth/callback/google"
  },
  "testStatus": "success",
  "lastTestedAt": "2025-12-08T10:30:00Z"
}
```

### POST /api/admin/integrations
**Save configuration**

```bash
curl -X POST http://localhost:3000/api/admin/integrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-session-token>" \
  -d '{
    "service": "google",
    "config": {
      "GOOGLE_CLIENT_ID": "123456789.apps.googleusercontent.com",
      "GOOGLE_CLIENT_SECRET": "GOCSPX-xxxxx",
      "GOOGLE_CALLBACK_URL": "http://localhost:3000/api/auth/callback/google"
    }
  }'
```

**Response on Success:**
```json
{
  "success": true,
  "message": "Konfigurasi google berhasil disimpan",
  "service": "google",
  "configId": "cuid_123"
}
```

### POST /api/admin/integrations/test
**Test connection**

```bash
curl -X POST http://localhost:3000/api/admin/integrations/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-session-token>" \
  -d '{ "service": "google" }'
```

**Response on Success:**
```json
{
  "success": true,
  "message": "Konfigurasi Google OAuth valid",
  "details": "Format credentials sudah benar. NextAuth akan menangani proses OAuth."
}
```

**Response on Failure:**
```json
{
  "success": false,
  "message": "Format Client ID tidak valid",
  "details": "Client ID harus mengandung .apps.googleusercontent.com"
}
```

## User Flow After Configuration

### Login Flow

1. **User clicks "Lanjutkan dengan Google"**
   - Button redirects to NextAuth signIn handler
   - Uses 'google' provider

2. **Google Login Flow**
   - User authenticated by Google
   - Google redirects to `GOOGLE_CALLBACK_URL`
   - NextAuth validates authorization code

3. **User Creation/Login**
   - Check if user email exists
   - If new: create user with MEMBER_FREE role
   - If existing: login to existing account
   - Set session with user data

4. **Redirect Back**
   - Redirect to original page or dashboard
   - User is now authenticated

### Session Data

After Google login, user session contains:

```typescript
{
  user: {
    id: "user_123",
    email: "user@example.com",
    name: "User Name",
    image: "https://lh3.googleusercontent.com/...",
    role: "MEMBER_FREE",          // Auto-assigned for new users
    verified: true,                // Auto-verified (Google is trusted)
  },
  expires: "2025-12-09T10:00:00Z"
}
```

## Troubleshooting

### Configuration Won't Save

**Symptoms:**
- Save button disabled or shows error
- Red status indicator

**Solutions:**
1. Verify all three fields are filled
2. Check Client ID format (must contain `.apps.googleusercontent.com`)
3. Check Callback URL format (must end with `/api/auth/callback/google`)
4. Check database permissions (admin user must be able to write)
5. Check server logs for detailed error

### Google Login Button Doesn't Appear

**Symptoms:**
- No "Lanjutkan dengan Google" button on checkout/login page
- Manual configuration in browser dev tools shows GOOGLE_CLIENT_ID not set

**Solutions:**
1. Verify configuration was saved (go back to `/admin/integrations`)
2. Verify `isActive=true` in database
3. Refresh browser page (clear cache)
4. Check server logs: grep for "GOOGLE_CLIENT_ID"
5. Verify NEXTAUTH_URL matches your domain

### "Redirect URI mismatch" Error During Login

**Symptoms:**
- User clicks Google login button
- Google shows error: "Redirect URI mismatch"
- User cannot complete login

**Solutions:**
1. Copy exact error message from browser
2. In Google Cloud Console, verify Authorized Redirect URIs match:
   - `http://localhost:3000/api/auth/callback/google` (for dev)
   - `https://eksporyuk.com/api/auth/callback/google` (for prod)
3. Ensure GOOGLE_CALLBACK_URL in admin panel matches Google Cloud Console exactly
4. Re-save configuration in admin panel
5. Clear browser cookies and try again

### "Invalid Client ID" Error

**Symptoms:**
- Error appears when saving configuration
- Test connection fails with "Format Client ID tidak valid"

**Solutions:**
1. Go back to Google Cloud Console
2. Copy Client ID again (full string)
3. Paste into admin panel
4. Verify it contains `.apps.googleusercontent.com`

## Best Practices

1. **Use Environment Variables**
   - Don't hardcode credentials in code
   - Always use `.env.local` or admin panel

2. **Keep Credentials Secret**
   - Client Secret should never appear in logs
   - Use masking in UI (already implemented)
   - Don't share in messages or documentation

3. **Test Before Production**
   - Configure in staging first
   - Test full login flow
   - Verify user data is correct

4. **Monitor Integration Status**
   - Regularly check `/admin/integrations` for errors
   - Re-run test connection if issues occur
   - Keep LastTestedAt timestamp updated

5. **Backup & Recovery**
   - Keep Google Client ID/Secret in secure location
   - Store .env.local in secure backup
   - Have recovery plan if credentials compromised

## Related Files

- **Frontend**: `/src/app/(dashboard)/admin/integrations/page.tsx`
- **API Route**: `/src/app/api/admin/integrations/route.ts`
- **Test Route**: `/src/app/api/admin/integrations/test/route.ts`
- **Auth Config**: `/src/lib/auth-options.ts`
- **Guide**: `GOOGLE_OAUTH_SETUP_GUIDE.md`

## Support

For issues with Google OAuth configuration:
1. Check this guide and GOOGLE_OAUTH_SETUP_GUIDE.md
2. Check server logs in terminal
3. Check browser console for errors
4. Verify Google Cloud Console configuration
5. Test with API endpoints using curl/Postman

---

**Last Updated**: December 8, 2025
**Status**: Complete & Ready for Use
