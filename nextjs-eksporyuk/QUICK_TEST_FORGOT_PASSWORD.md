# QUICK TEST: Forgot Password Flow

## 🚀 One-Command Setup Test

```bash
# In nextjs-eksporyuk folder
npm run dev

# In another terminal
node test-complete-reset-flow.js
node test-api-endpoints.js
```

## 🧪 Manual Test (5 Minutes)

1. **Open browser**: http://localhost:3000/forgot-password
2. **Enter email**: founder@eksporyuk.com (or your admin email)
3. **Click "Kirim Link Reset"**
4. **Check email**: Look for "🔐 Reset Password" email
5. **Click link**: Should see password reset form
6. **Enter new password**: Type same password twice (min 6 chars)
7. **Submit**: See "Password Berhasil Direset!" message
8. **Click "Login Sekarang"**: Go to /login
9. **Test login**: Use email + new password

## ✅ What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| Email sending | ❌ Not working | ✅ Working (Mailketing) |
| Reset link format | ❌ Wrong format | ✅ Query parameter (`?token=`) |
| API endpoint | ❌ Mismatch | ✅ Unified (v2) |
| Token model | ❌ Multiple models | ✅ Single PasswordResetToken |
| Error handling | ❌ Generic errors | ✅ Specific messages |

## 📝 Key Changes

### 1. Fixed Link Format
```typescript
// ❌ BEFORE (wrong)
const resetLink = `${appUrl}/reset-password/${token}`

// ✅ AFTER (correct)
const resetLink = `${appUrl}/reset-password?token=${token}`
```

### 2. Added PUT Handler
```typescript
// ✅ NEW: /api/auth/forgot-password-v2 now has PUT method
export async function PUT(request: NextRequest) {
  // Validates token, resets password, returns success
}
```

### 3. Fixed Reset Page Endpoint
```typescript
// ❌ BEFORE (old endpoint)
fetch('/api/auth/forgot-password', { method: 'PUT' })

// ✅ AFTER (new endpoint with matching token model)
fetch('/api/auth/forgot-password-v2', { method: 'PUT' })
```

## 🔐 Security Checks

- [x] Token is 64-character random hex
- [x] Token expires in 1 hour
- [x] Token is single-use only
- [x] Expired tokens are deleted
- [x] Used tokens cannot be reused
- [x] Password is bcrypt hashed
- [x] Email enumeration prevented

## 📧 Email Configuration

- **API**: Mailketing (mailketing.co.id)
- **From**: Tim Ekspor Yuk <admin@eksporyuk.com>
- **Templates**: reset-password, password-reset-confirmation
- **Status**: ✅ Configured and working

## 🎯 Success Indicators

When everything works:
1. ✅ Email arrives in inbox within seconds
2. ✅ Reset link is clickable
3. ✅ Reset form loads with empty fields
4. ✅ Password validation works client-side
5. ✅ Submit button is disabled until passwords match
6. ✅ Success page shows after submit
7. ✅ Redirect to /login after 3 seconds
8. ✅ New password works for login

## 🛠️ Debug Commands

```bash
# Check if token exists in database
node -e "require('@prisma/client').PrismaClient().$queryRaw\`SELECT COUNT(*) as count FROM PasswordResetToken\`"

# Check email templates
node -e "require('@prisma/client').PrismaClient().brandedTemplate.findMany({ where: { slug: { in: ['reset-password', 'password-reset-confirmation'] } } }).then(t => console.log(t))"

# Check Mailketing config
node -e "require('@prisma/client').PrismaClient().integrationConfig.findFirst({ where: { service: 'mailketing' } }).then(c => console.log(c))"
```

## 📞 Support

If reset password still doesn't work:

1. Check Mailketing API key is in IntegrationConfig
2. Verify email templates are created and active
3. Check browser console for JavaScript errors
4. Check server console for API errors
5. Verify NEXTAUTH_URL or NEXT_PUBLIC_APP_URL is set
6. Check database for PasswordResetToken records

---

**Status**: ✅ READY FOR TESTING
**Last Updated**: January 2025
**Tested With**: Next.js 16, Prisma ORM, Mailketing API
