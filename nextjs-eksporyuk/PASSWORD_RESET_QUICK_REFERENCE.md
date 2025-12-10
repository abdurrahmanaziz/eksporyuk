# Password Reset System - Quick Reference

## User Flows

### 1. Forgot Password
```
User → /forgot-password
       ↓
    Email input
       ↓
POST /api/auth/forgot-password-v2
       ↓
Token generated (256-bit, 1-hour expiry)
       ↓
Email sent via Mailketing
       ↓
Success: "Cek Email Anda"
```

### 2. Reset Password
```
User clicks email link
       ↓
/reset-password/[token]
       ↓
Password form loads
       ↓
User enters password (8+ chars)
       ↓
POST /api/auth/reset-password-new
       ↓
Token validated:
  - Not used? ✅
  - Not expired? ✅
  - User exists? ✅
       ↓
Password hashed with bcrypt
       ↓
User record updated
       ↓
Confirmation email sent
       ↓
Success: "Password Berhasil Direset"
```

---

## Key API Details

### POST /api/auth/forgot-password-v2
```json
Request:
{
  "email": "user@example.com"
}

Response (200 OK):
{
  "success": true,
  "message": "Jika email terdaftar, link reset password telah dikirim..."
}
```

### POST /api/auth/reset-password-new
```json
Request:
{
  "token": "hex-string-32-bytes",
  "password": "newPassword123"
}

Response (200 OK):
{
  "success": true,
  "message": "Password berhasil direset"
}

Response (401):
{
  "error": "Token tidak valid atau sudah kadaluarsa"
}
```

---

## Database

### PasswordResetToken Table
```sql
CREATE TABLE "PasswordResetToken" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "used" BOOLEAN DEFAULT false,
  "usedAt" TIMESTAMP
);

CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
```

---

## Security

| Aspect | Implementation |
|--------|-----------------|
| Token Generation | crypto.randomBytes(32) → 256-bit hex |
| Token Expiry | 1 hour, server-side validation |
| One-Time Use | Boolean flag "used", timestamp "usedAt" |
| Password Hashing | bcrypt, 10 salt rounds |
| Email Format | Regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Email Enumeration | Always return success (can't determine if email exists) |
| Cleanup | Auto-delete old tokens before creating new |

---

## Email Templates

### Reset Link Email
- Gradient header (orange→red)
- "Reset Password" button
- Plain link for copy-paste
- 1-hour expiry warning
- Security tips section

### Confirmation Email
- Green gradient header
- Confirmation message
- Timestamp of change
- "Login" button
- Security warning

---

## Development

### Running Locally
```bash
# 1. Ensure DATABASE_URL is set in .env
# 2. Start dev server
npm run dev

# 3. Test forgot-password
curl -X POST http://localhost:3000/api/auth/forgot-password-v2 \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 4. Check terminal logs for token (since Mailketing might be in dev mode)
```

### Checking Database
```bash
# View all reset tokens
npm run prisma:studio

# Or query directly
SELECT * FROM "PasswordResetToken" WHERE email='user@example.com';
```

---

## Environment Variables

```env
# Must set for production
NEXTAUTH_URL=https://eksporyuk.com
NEXTAUTH_SECRET=<32-char-random-string>
MAILKETING_API_KEY=<your-api-key>
DATABASE_URL=<postgresql-url>

# Optional
NEXT_PUBLIC_APP_URL=https://eksporyuk.com
NEXT_PUBLIC_APP_NAME=EksporYuk
```

---

## Testing

### Test Email Addresses
```
Development: Can use any email format
             (Mailketing API logs the email)

Production: Use real email addresses
           (Will actually send via Mailketing)
```

### Test Cases
✅ Valid email → token generated & email sent  
✅ Invalid email format → error message  
✅ Valid token → password resets  
✅ Expired token → "Token tidak valid"  
✅ Used token → "Token tidak valid"  
✅ Short password (<8 chars) → validation error  
✅ Mismatched passwords → validation error  

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not received | Check Mailketing logs, verify API key, check spam folder |
| Token expired | Token valid for exactly 1 hour, request new one |
| Password won't update | Check password meets requirements (8+ chars, letters+numbers) |
| "Token not found" | Verify token from email URL matches database |
| API 500 error | Check database connection, review server logs |

---

## Files

| Path | Purpose |
|------|---------|
| `/api/auth/forgot-password-v2/route.ts` | Generate token & send email |
| `/api/auth/reset-password-new/route.ts` | Validate token & reset password |
| `/(auth)/forgot-password/page.tsx` | Email input form |
| `/(auth)/reset-password/[token]/page.tsx` | Password reset form |
| `prisma/schema.prisma` | PasswordResetToken model |
| `lib/services/mailketingService.ts` | Email methods |

---

## Monitoring

### What to Watch
- Email delivery rate (Mailketing dashboard)
- Failed password reset attempts (server logs)
- Token generation rate (database growth)
- User feedback on process

### Alerts to Set Up
- Mailketing API failures
- Database connection errors
- High rate of expired token requests (security issue?)
- Email delivery failures (>5%)

---

## Next Steps After Launch

1. Monitor first 24 hours of usage
2. Check email delivery rate (target: 99%+)
3. Gather user feedback on UI/UX
4. Track password reset success rate
5. Review security logs for anomalies
6. Plan enhancements (SMS reset, 2FA, etc.)

---

## Support Resources

📚 **Full Documentation**: `PASSWORD_RESET_SYSTEM_COMPLETE.md`  
📋 **Implementation Summary**: `PASSWORD_RESET_IMPLEMENTATION_SUMMARY.md`  
✅ **Checklist**: `PASSWORD_RESET_CHECKLIST.sh`  
📖 **This Guide**: Quick reference for common tasks  

---

**System Status**: ✅ **PRODUCTION READY**  
**Last Updated**: 2024  
**Build Status**: ✅ Compiled successfully
