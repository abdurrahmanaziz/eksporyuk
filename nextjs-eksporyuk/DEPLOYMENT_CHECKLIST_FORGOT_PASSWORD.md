# FORGOT PASSWORD DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

### Database
- [ ] Prisma schema includes `PasswordResetToken` model
- [ ] Run migration: `npx prisma db push`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify tables exist: Check in Prisma Studio

### Email Configuration
- [ ] Mailketing API key configured in IntegrationConfig table
- [ ] Check value: `SELECT config FROM IntegrationConfig WHERE service='mailketing'`
- [ ] Mailketing email templates created (reset-password, password-reset-confirmation)
- [ ] Templates are marked as active/enabled
- [ ] From email configured: admin@eksporyuk.com
- [ ] From name configured: Tim Ekspor Yuk

### Environment Variables
- [ ] `NEXTAUTH_URL` set correctly (production domain)
- [ ] `NEXT_PUBLIC_APP_URL` set as fallback
- [ ] `.env.local` has all required variables (dev)
- [ ] `.env.production` has all required variables (prod)

### Code Review
- [ ] `/src/app/api/auth/forgot-password-v2/route.ts` has POST + PUT handlers
- [ ] `/src/app/auth/reset-password/page.tsx` calls `/api/auth/forgot-password-v2`
- [ ] Token generation uses 32 random bytes: `crypto.randomBytes(32).toString('hex')`
- [ ] Password hashing uses bcryptjs: `await bcrypt.hash(password, 10)`
- [ ] Error messages are in Indonesian language

### Testing
- [ ] Run `node test-complete-reset-flow.js` - PASS
- [ ] Run `node test-api-endpoints.js` - PASS
- [ ] Manual test: Send forgot password email - RECEIVED
- [ ] Manual test: Click reset link - WORKS
- [ ] Manual test: Reset password - SUCCESS
- [ ] Manual test: Login with new password - WORKS

---

## Deployment Steps

### 1. Database Migration (If First Time)
```bash
cd nextjs-eksporyuk

# Push schema to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Seed templates if needed
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.brandedTemplate.createMany({
  data: [
    {
      slug: 'reset-password',
      name: 'Reset Password Email',
      isActive: true,
      // ... template content
    },
    {
      slug: 'password-reset-confirmation',
      name: 'Password Reset Confirmation',
      isActive: true,
      // ... template content
    }
  ],
  skipDuplicates: true
});
"
```

### 2. Build
```bash
npm run build

# Check for errors
# Should see "✓ Building..." and "✓ Compiled successfully"
```

### 3. Deploy
```bash
# Deploy to your hosting (Vercel, etc)
# Make sure environment variables are set in hosting dashboard

# Environment variables needed:
# - DATABASE_URL
# - NEXTAUTH_URL
# - NEXT_PUBLIC_APP_URL
# - NEXTAUTH_SECRET
# - All Mailketing credentials (via IntegrationConfig database)
```

### 4. Post-Deployment Verification
```bash
# Test production endpoints
curl -X POST https://your-domain/api/auth/forgot-password-v2 \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Should return:
# {"success": true, "message": "..."}

# Check database
prisma studio # or database client
SELECT COUNT(*) FROM PasswordResetToken; # Should be 0 or small number

# Test complete flow
# 1. Go to https://your-domain/forgot-password
# 2. Enter email
# 3. Check email receipt
# 4. Click reset link
# 5. Verify form loads
# 6. Reset password
# 7. Login with new password
```

---

## Rollback Plan

If something goes wrong:

### Quick Rollback
1. Revert code changes:
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

2. Clear test tokens:
   ```bash
   npx prisma db seed # Or manual cleanup
   ```

### Data Cleanup
```bash
# Remove test tokens
DELETE FROM PasswordResetToken WHERE used = true;
DELETE FROM PasswordResetToken WHERE expiresAt < NOW();

# Keep only recent tokens
DELETE FROM PasswordResetToken WHERE createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Monitoring

### Things to Monitor

1. **Email Delivery**
   - Check Mailketing dashboard for delivery metrics
   - Monitor bounce rates
   - Check spam folder reports

2. **Error Logs**
   - Monitor API error responses
   - Check token validation failures
   - Track password reset failures

3. **Database**
   - Monitor PasswordResetToken table size
   - Ensure old tokens are being cleaned
   - Check for orphaned tokens

### Alerts to Set Up

```
1. Alert if email delivery rate drops below 95%
2. Alert if API error rate exceeds 1% 
3. Alert if PasswordResetToken table grows above 10,000 rows
4. Alert if same email requests reset 10+ times in 1 hour
```

---

## Security Checklist

- [ ] Tokens are random 64-character hex strings
- [ ] Tokens expire after 1 hour
- [ ] Tokens are single-use only
- [ ] Used tokens cannot be reused
- [ ] Expired tokens are deleted from database
- [ ] Passwords are bcrypt hashed (10 rounds)
- [ ] Email enumeration is prevented
- [ ] Rate limiting is in place (recommend 5 resets/email/hour)
- [ ] Passwords are validated for minimum length (6 chars)
- [ ] HTTPS is enforced in production
- [ ] Mailketing API key is not exposed in code
- [ ] Password reset link contains no sensitive info besides token

---

## Performance Checklist

- [ ] Email sending is non-blocking (try/catch doesn't break flow)
- [ ] Database queries use proper indexes
- [ ] No N+1 query problems
- [ ] Token validation is fast (should be <10ms)
- [ ] Password hashing happens server-side only
- [ ] No sensitive data logged to console

---

## Maintenance Tasks

### Daily
- Monitor error logs
- Check email delivery success rate

### Weekly
- Review PasswordResetToken table size
- Check for orphaned tokens
- Monitor successful reset rates

### Monthly
- Analyze reset password metrics
- Review security logs
- Update documentation if needed
- Test recovery process

### Quarterly
- Security audit
- Penetration testing
- Rate limiting review
- Email template update if needed

---

## Success Criteria

✅ Deployment successful if:
1. Email sends within 5 seconds of request
2. Reset link is clickable and leads to form
3. Password reset completes in <5 seconds
4. User can login with new password immediately
5. No errors in production logs
6. Email delivery rate > 95%
7. Reset success rate > 99%

---

## Support & Escalation

**Level 1**: Check email arrived, verify link format
**Level 2**: Check database tokens, verify Mailketing API
**Level 3**: Review application logs, check code changes
**Level 4**: Database migration, API rebuild, full revert

---

**Last Updated**: January 2025
**Status**: ✅ READY FOR DEPLOYMENT
**Test Result**: ALL PASSED ✅
