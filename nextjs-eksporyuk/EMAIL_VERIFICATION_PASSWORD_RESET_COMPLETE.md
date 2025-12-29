# Email Verification & Password Reset System - Complete Documentation

**Status**: ✅ FULLY IMPLEMENTED AND TESTED  
**Last Updated**: December 29, 2025

## Overview

The Eksporyuk platform includes a complete email verification and password reset system integrated with **Mailketing API**. Users must verify their email after registration, and can securely reset their password if forgotten.

## System Architecture

### Components

1. **Frontend Pages**
   - `/auth/register` - User registration with email
   - `/auth/verify-email` - Email verification page (link-based)
   - `/auth/forgot-password` - Request password reset email
   - `/auth/reset-password` - Reset password with token

2. **Backend APIs**
   - `POST /api/auth/register` - Create new user account
   - `POST /api/auth/resend-verification` - Resend verification email
   - `GET /api/auth/verify-email?token=xxx` - Verify email with token
   - `POST /api/auth/forgot-password` - Request password reset
   - `POST /api/auth/reset-password` - Reset password with token

3. **Email Service**
   - **Provider**: Mailketing API (`https://api.mailketing.co.id`)
   - **Config**: `src/lib/integrations/mailketing.ts`
   - **Functions**: `sendEmail()`, `sendVerificationEmail()`, `sendPasswordResetConfirmationEmail()`

4. **Database**
   - **User Model**: Stores user data with `emailVerified` flag
   - **EmailVerificationToken Model**: Stores email verification and password reset tokens
   - **Token Types**: `EMAIL_VERIFY`, `PASSWORD_RESET`

## Email Verification Flow

### 1. Registration (User Signup)

**Trigger**: User registers at `/auth/register`

**API**: `POST /api/auth/register`
```json
{
  "email": "user@gmail.com",
  "name": "User Name",
  "password": "password123",
  "whatsapp": "+62xxx"
}
```

**Actions**:
1. Validate email is Gmail (@gmail.com)
2. Create user with `emailVerified: false`
3. Generate 32-byte random verification token
4. Store token in `EmailVerificationToken` with:
   - `type: 'EMAIL_VERIFY'`
   - `expires: 24 hours from now`
   - `identifier: userId`
5. Send verification email via Mailketing:
   - Contains verification link: `https://eksporyuk.com/auth/verify-email?token=xxxxx`
   - Template: "Email Verification" from branded templates
6. Return success message to frontend

**Response**:
```json
{
  "success": true,
  "message": "Registrasi berhasil! Silakan cek email Anda untuk verifikasi.",
  "user": {
    "id": "cm...",
    "email": "user@gmail.com",
    "emailVerified": false
  }
}
```

### 2. Email Verification (User Action)

**Trigger**: User clicks verification link in email

**URL**: `/auth/verify-email?token=xxxxx`

**Frontend Page** (`src/app/auth/verify-email/page.tsx`):
1. Extracts token from URL parameter
2. Calls `GET /api/auth/verify-email?token=xxxxx`
3. Shows loading state while verifying
4. On success:
   - Displays "Email Terverifikasi!" success message
   - Logs user out to refresh session
   - Redirects to login after 3 seconds
5. On error:
   - Displays error message with option to resend email

**API Route** (`src/app/api/auth/verify-email/route.ts`):
```
GET /api/auth/verify-email?token=xxxxx
```

**Actions**:
1. Extract token from query parameter
2. Call `verifyEmailToken(token)` function:
   - Find token in database
   - Verify token hasn't expired
   - Update user: `emailVerified: true`
   - Delete token from database
3. Return success response
4. If token invalid/expired: return error

**Response on Success**:
```json
{
  "success": true,
  "message": "Email berhasil diverifikasi!",
  "user": {
    "id": "cm...",
    "email": "user@gmail.com"
  }
}
```

### 3. Resend Verification Email

**Trigger**: User clicks "Resend Email" in verification modal

**API**: `POST /api/auth/resend-verification`

**Actions**:
1. Get current user from session
2. Check if email already verified → error if true
3. Delete existing verification tokens for this user
4. Create new verification token
5. Send verification email via Mailketing
6. Return success message

**Response**:
```json
{
  "success": true,
  "message": "Email verifikasi telah dikirim!"
}
```

## Password Reset Flow

### 1. Request Password Reset

**Trigger**: User clicks "Forgot Password" at `/auth/forgot-password`

**Frontend Page** (`src/app/auth/forgot-password/page.tsx`):
1. User enters email address
2. Submits form to `POST /api/auth/forgot-password`
3. Shows success message (even if email not found, for security)
4. Displays instructions to check email

**API Route** (`src/app/api/auth/forgot-password/route.ts`):
```
POST /api/auth/forgot-password
Body: { email: "user@gmail.com" }
```

**Actions**:
1. Find user by email (case-insensitive)
2. Always return success (prevent email enumeration)
3. If user found:
   - Generate 32-byte random reset token
   - Store token in `EmailVerificationToken`:
     - `type: 'PASSWORD_RESET'`
     - `expires: 1 hour from now`
     - `identifier: userId`
   - Send reset email via Mailketing:
     - Contains reset link: `https://eksporyuk.com/auth/reset-password?token=xxxxx`
     - Valid for 1 hour only
     - Template: "Password Reset" from branded templates
4. Return success message

**Response**:
```json
{
  "success": true,
  "message": "Jika email terdaftar, link reset password telah dikirim"
}
```

### 2. Reset Password (User Action)

**Trigger**: User clicks reset link in email

**URL**: `/auth/reset-password?token=xxxxx`

**Frontend Page** (`src/app/auth/reset-password/page.tsx`):
1. Extracts token from URL parameter
2. Displays form to enter new password
3. Validates password:
   - Minimum 6 characters (UI shows 8 in error message for docs)
   - Matches confirmation password
4. Submits to `POST /api/auth/reset-password`
5. On success:
   - Shows "Password Berhasil Direset!" message
   - Redirects to login after 3 seconds
6. On error:
   - Shows error message
   - Option to request new reset link

**API Route** (`src/app/api/auth/reset-password/route.ts`):
```
POST /api/auth/reset-password
Body: { token: "xxxxx", newPassword: "newpass123" }
```

**Actions**:
1. Validate input: token and newPassword required
2. Find reset token in database:
   - Must have `type: 'PASSWORD_RESET'`
   - Must not be expired
3. If invalid/expired: return error "Link reset password tidak valid atau sudah kadaluarsa"
4. If valid:
   - Find user by token identifier
   - Hash new password with bcrypt (10 rounds)
   - Update user: `password: hashedPassword`
   - Delete used token
   - Delete all other PASSWORD_RESET tokens for this user
   - Send confirmation email via Mailketing
5. Return success message

**Response on Success**:
```json
{
  "success": true,
  "message": "Password berhasil direset. Silakan login dengan password baru"
}
```

## Database Schema

### User Model
```prisma
model User {
  id                String              @id
  email             String              @unique
  name              String
  password          String              // bcrypt hashed
  emailVerified     Boolean             @default(false)
  username          String              @unique
  isActive          Boolean             @default(true)
  // ... other fields
}
```

### EmailVerificationToken Model
```prisma
model EmailVerificationToken {
  id         String   @id
  identifier String   // User ID
  token      String   // Random token (32 bytes hex)
  expires    DateTime // Expiration time
  type       String   @default("EMAIL_VERIFY")  // EMAIL_VERIFY or PASSWORD_RESET
  metadata   String?  // JSON metadata
  createdAt  DateTime @default(now())
}
```

## Mailketing Integration

### Configuration

**Environment Variables**:
```env
MAILKETING_API_KEY=your_api_key_here
MAILKETING_API_URL=https://api.mailketing.co.id/api/v1
MAILKETING_FROM_EMAIL=admin@eksporyuk.com
MAILKETING_FROM_NAME=Tim Ekspor Yuk
```

**Service File**: `src/lib/integrations/mailketing.ts`

### Email Functions

#### 1. `sendEmail(payload)`
Generic email sending function.

```typescript
await mailketing.sendEmail({
  to: 'user@gmail.com',
  subject: 'Subject Line',
  html: '<html>...</html>',
  text: 'Plain text fallback',
  tags: ['verification', 'onboarding']
})
```

#### 2. `sendVerificationEmail(email, name, verificationUrl)`
Sends branded verification email.

```typescript
const result = await sendVerificationEmail(
  'user@gmail.com',
  'User Name',
  'https://eksporyuk.com/auth/verify-email?token=xxx'
)
```

**Template**: "Email Verification" (branded template)

#### 3. `sendPasswordResetConfirmationEmail(data)`
Sends confirmation email after password reset.

```typescript
await mailketingService.sendPasswordResetConfirmationEmail({
  email: 'user@gmail.com',
  name: 'User Name'
})
```

### Email Templates (Branded)

1. **Email Verification** (`slug: 'email-verification'`)
   - Subject: "Verifikasi Email Anda - EksporYuk"
   - Used for: New user registration
   - CTA: "Verifikasi Email Sekarang" → `{verification_url}`

2. **Password Reset** (`slug: 'reset-password'`)
   - Subject: "🔐 Reset Password - EksporYuk"
   - Used for: Forgot password requests
   - CTA: "Reset Password" → `{verification_url}`

3. **Password Reset Confirmation**
   - Sent via fallback HTML in API route
   - Subject: "✅ Password Berhasil Direset - EksporYuk"
   - Used for: Confirmation after successful reset

## Security Features

### Token Security
- **Random Generation**: Tokens generated using `crypto.randomBytes(32)`
- **Hex Encoding**: 64-character hex strings (32 bytes)
- **Expiration**:
  - Email verification: 24 hours
  - Password reset: 1 hour
- **One-Time Use**: Tokens deleted after first use
- **No Enumeration**: Forgot password always returns success (doesn't reveal if email exists)

### Password Security
- **Hashing**: bcrypt with 10 rounds
- **Never Logged**: Passwords never logged or stored in plain text
- **HTTPS Only**: All links and forms use HTTPS in production

### Email Security
- **Verification Required**: Users can't fully access system until email verified
- **Token in URL**: Tokens passed as URL parameters (HTTPS encrypted in transit)
- **Expiration**: Tokens expire to limit attack window
- **Rate Limiting**: (Optional - can be added to API routes)

## Testing

### Run Tests
```bash
node test-email-verification-complete.js
```

**What's Tested**:
1. ✓ Database schema verification
2. ✓ Email verification token creation and verification
3. ✓ Password reset token creation and reset
4. ✓ Mailketing API configuration
5. ✓ Token expiration handling
6. ✓ Password hashing and verification

### Manual Testing

**Email Verification Flow**:
1. Register at `/auth/register` with Gmail address
2. Check email inbox for verification email
3. Click "Verifikasi Email Sekarang" button or copy verification link
4. Should be redirected and logged out
5. Login again - email should show as verified

**Password Reset Flow**:
1. Go to `/auth/forgot-password`
2. Enter registered email
3. Check email inbox for reset link
4. Click "Reset Password" or copy reset link
5. Enter new password (minimum 6 characters)
6. Click "Reset Password" button
7. Should be redirected to login after success message
8. Login with new password should work

## Troubleshooting

### Email Not Received

**Possible Causes**:
1. **Mailketing API Key not configured**
   - Check `MAILKETING_API_KEY` in environment
   - Verify API key is valid in Mailketing dashboard

2. **Email template not found**
   - Verify branded templates exist in database
   - Check `BrandedTemplate` model for 'email-verification' and 'reset-password' slugs
   - Fall back to hardcoded HTML template if not found

3. **Email in spam folder**
   - Check spam/junk filters
   - Verify sender email in Mailketing is whitelisted

**Solution**:
```bash
# Check configuration
node -e "console.log({
  api_key: !!process.env.MAILKETING_API_KEY,
  from_email: process.env.MAILKETING_FROM_EMAIL,
  from_name: process.env.MAILKETING_FROM_NAME
})"

# Test email sending
curl -X POST https://api.mailketing.co.id/api/v1/send \
  -d "api_token=YOUR_KEY" \
  -d "to=test@gmail.com" \
  -d "subject=Test" \
  -d "html=<p>Test email</p>"
```

### Token Invalid or Expired

**Possible Causes**:
1. **Token already used** - Deleted from database after verification
2. **Token expired** - Email verification tokens expire after 24 hours
3. **Token copied incorrectly** - Copy full token from email link

**Solution**:
- For email verification: Click "Resend Email" to get new token
- For password reset: Go to `/auth/forgot-password` to request new reset link

### User Can't Login After Email Verification

**Possible Causes**:
1. **Session not refreshed** - User needs to logout and login again
2. **Database not updated** - Check if `emailVerified` flag was set to true

**Solution**:
```bash
# Check user's email status
npx prisma studio
# Navigate to User model and find user by email
# Check emailVerified field (should be true)
```

## API Response Codes

| Code | Scenario | Response |
|------|----------|----------|
| 200 | Success | `{ success: true, message: "..." }` |
| 400 | Invalid input | `{ success: false, error: "..." }` |
| 400 | Token invalid/expired | `{ success: false, error: "Token tidak valid atau sudah kadaluarsa" }` |
| 401 | Unauthorized | `{ success: false, error: "Unauthorized" }` |
| 404 | User not found | `{ success: false, error: "User tidak ditemukan" }` |
| 500 | Server error | `{ success: false, error: error.message }` |

## Recent Changes

### December 29, 2025
- ✅ Fixed password reset page to call correct API endpoint (`/api/auth/reset-password` with POST)
- ✅ Verified Mailketing integration is properly configured
- ✅ All email verification and password reset flows tested and working
- ✅ Database schema verified with proper token fields

## Files Overview

| File | Purpose |
|------|---------|
| `src/app/auth/register/page.tsx` | Registration form UI |
| `src/app/auth/verify-email/page.tsx` | Email verification UI |
| `src/app/auth/forgot-password/page.tsx` | Password reset request UI |
| `src/app/auth/reset-password/page.tsx` | Password reset form UI |
| `src/app/api/auth/register/route.ts` | User creation API |
| `src/app/api/auth/verify-email/route.ts` | Email verification API |
| `src/app/api/auth/forgot-password/route.ts` | Password reset request API |
| `src/app/api/auth/reset-password/route.ts` | Password reset API |
| `src/app/api/auth/resend-verification/route.ts` | Resend verification email API |
| `src/lib/email-verification.ts` | Email verification utilities |
| `src/lib/integrations/mailketing.ts` | Mailketing API integration |
| `prisma/schema.prisma` | Database models |

## Quick Commands

```bash
# Test email system
node test-email-verification-complete.js

# Check user's email status in database
npx prisma studio
# Find User by email, check emailVerified field

# Check verification tokens
npx prisma studio
# View EmailVerificationToken model

# Resend verification email to user
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Cookie: your_session_token"

# Request password reset for user
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@gmail.com"}'

# Reset password with token
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"xxx","newPassword":"newpass123"}'
```

## Deployment Checklist

- [ ] `MAILKETING_API_KEY` is set in production environment
- [ ] `MAILKETING_FROM_EMAIL` is set to valid Mailketing sender email
- [ ] `NEXTAUTH_URL` is set correctly for production domain
- [ ] Branded email templates exist in database (email-verification, reset-password)
- [ ] Emails are being sent to test inbox before full rollout
- [ ] Test complete flow: register → verify → forgot password → reset
- [ ] Monitor email delivery in Mailketing dashboard
- [ ] Set up email alerts for failed sends

---

**Status**: ✅ Ready for Production  
**Tested**: Yes (All tests pass)  
**Last Verified**: December 29, 2025
