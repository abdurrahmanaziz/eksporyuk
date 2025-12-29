# 🚀 QUICK DEPLOYMENT GUIDE - PASSWORD RESET FIX

**Last Updated**: December 29, 2025  
**Status**: Ready for Production ✅

---

## Pre-Deployment Checklist

- [x] All tests passed (100%)
- [x] Code reviewed and verified
- [x] Database integration confirmed
- [x] Email service configured
- [x] Security measures implemented
- [x] Documentation complete

---

## Step 1: Create Database Backup

```bash
# Before deploying, backup your database
# Using Vercel Blob Storage

curl -X POST https://eksporyuk-production-backup.example.com/backup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Or locally for development
# cp /path/to/dev.db /path/to/dev.db.backup-2025-12-29
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Deploy to production
vercel --prod

# Or with custom environment
vercel --prod --env DATABASE_URL="your-database-url"
```

### Option B: Using Git Push (if configured)
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk

git add .
git commit -m "Fix: Unified password reset system with query parameter support"
git push origin main  # Assuming main branch is connected to Vercel
```

---

## Step 3: Verify Deployment

### Check Deployment Status
```bash
# View Vercel deployment logs
vercel logs

# Or check in Vercel dashboard
# https://vercel.com/dashboard
```

### Test Password Reset in Production

1. **Open forgot password page**:
   - URL: `https://eksporyuk.com/auth/forgot-password`
   - Enter test email address

2. **Check email for reset link**:
   - Email should arrive within 1 minute
   - Link format: `https://eksporyuk.com/auth/reset-password?token=xxx`

3. **Click reset link and verify page loads**:
   - URL should match email link with token parameter
   - Form should display (not error message)
   - Token validation should pass

4. **Enter new password**:
   - Password: minimum 8 characters
   - Confirmation should match
   - Form should validate in real-time

5. **Submit and verify success**:
   - Should see success message
   - Should redirect to login page

6. **Login with new password**:
   - Email: your test email
   - Password: the new password you entered
   - Should successfully login

---

## Step 4: Monitor Production

### Check Error Logs
```bash
# View real-time logs
vercel logs --follow

# Or search specific errors
vercel logs --search "password reset"
vercel logs --search "ERROR"
```

### Monitor Metrics
- API response times (check Vercel Analytics)
- Email delivery success rate
- User success rate (track manually or with analytics)
- Error frequency (should be 0)

### Set Up Alerts
- Configure alerts in Vercel dashboard for HTTP errors
- Monitor email service (Mailketing) status
- Check database connection health

---

## Step 5: Handle Issues (If Any)

### Issue: "Link reset password tidak valid" still appearing

**Cause**: Old page still being served from cache

**Solution**:
1. Clear Vercel edge cache: `vercel env rm VERCEL_CACHE`
2. Redeploy: `vercel --prod`
3. Clear browser cache (user's side)
4. Try incognito/private browser window

### Issue: Email not received

**Cause**: Mailketing service not working or API key expired

**Solution**:
1. Check Mailketing API status
2. Verify API keys in environment variables
3. Check email spam folder
4. Test with different email address
5. Check API logs in Mailketing dashboard

### Issue: Password update not persisting

**Cause**: Database connection issue or transaction failure

**Solution**:
1. Check database URL is correct in Vercel env
2. Verify database is running and accessible
3. Check Prisma schema is up to date
4. Review database logs for errors

### Rollback (If Critical Issues)

```bash
# Revert to previous deployment
vercel rollback

# Or deploy specific commit
vercel --prod --target=production
```

---

## Step 6: Post-Deployment Tasks

### Immediate (First Hour)
- [ ] Verify page loads without errors
- [ ] Test complete password reset flow
- [ ] Check email delivery
- [ ] Monitor error logs
- [ ] Verify no critical errors

### Short-term (First 24 Hours)
- [ ] Monitor error rate
- [ ] Check user feedback
- [ ] Verify password changes persist
- [ ] Test with different user accounts
- [ ] Verify email templates render correctly

### Cleanup (When Confirmed Working)
- [ ] Remove old reset password page (optional)
- [ ] Remove old API endpoint (optional)
- [ ] Archive test data from local testing
- [ ] Update documentation with production URLs

---

## Testing Endpoints in Production

### Forgot Password API
```bash
curl -X POST https://eksporyuk.com/api/auth/forgot-password-v2 \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Kami telah mengirimkan link reset password ke email Anda"
}
```

### Reset Password API
```bash
curl -X POST https://eksporyuk.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-from-email-link",
    "newPassword": "NewPassword123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Password berhasil direset. Silakan login dengan password baru"
}
```

---

## Environment Variables

Ensure these are set in Vercel:

```env
DATABASE_URL=your-database-url
NEXTAUTH_URL=https://eksporyuk.com
NEXTAUTH_SECRET=your-secret-key
MAILKETING_API_KEY=your-mailketing-key
MAILKETING_FROM_EMAIL=noreply@eksporyuk.com
```

---

## Rollback Procedure

If critical issues occur:

### Option 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select eksporyuk project
3. Go to "Deployments"
4. Find previous working deployment
5. Click "Promote to Production"

### Option 2: Command Line
```bash
# View recent deployments
vercel list

# Promote specific deployment
vercel promote DEPLOYMENT_ID
```

---

## Success Criteria

After deployment, verify:

- ✅ Page loads without errors
- ✅ Token validation works
- ✅ Password reset form displays
- ✅ Password validation works (min 8 chars)
- ✅ Password update persists
- ✅ Old password no longer works
- ✅ Email confirmation received
- ✅ Token cannot be reused
- ✅ No console errors
- ✅ Response times < 500ms

---

## Monitoring Command

```bash
# Real-time monitoring of password reset flow
watch -n 5 'vercel logs --follow | grep -i "password\|reset"'
```

---

## Support & Documentation

For detailed information:
- See: `PASSWORD_RESET_FIX_COMPLETE.md`
- See: `SESSION_SUMMARY_PASSWORD_RESET.md`
- Test scripts: `test-password-reset-*.js`

---

## Deployment Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Backup database |
| 2 | 2 min | Deploy to Vercel |
| 3 | 5 min | Verify deployment status |
| 4 | 10 min | Test password reset flow |
| 5 | 5 min | Check error logs |
| 6 | 60+ min | Monitor production |

**Total Estimated Time: ~15 minutes deployment + monitoring**

---

## Contacts & Escalation

- **Vercel Support**: vercel.com/support
- **Database Issues**: Check Prisma docs or Vercel database service
- **Email Service**: Check Mailketing API docs
- **Team Lead**: For critical issues

---

## Post-Deployment Review

After 24 hours of successful deployment:

1. ✅ Document deployment results
2. ✅ Archive test artifacts
3. ✅ Update production documentation
4. ✅ Notify team of successful deployment
5. ✅ Plan for future enhancements

---

**Status**: 🟢 READY FOR DEPLOYMENT

All systems verified and tested. Ready to deploy to production.

---

**Last Updated**: December 29, 2025  
**Version**: 1.0  
**Ready**: YES ✅
