# Vercel Deployment - Quick Reference

## 🚀 Deployment Started

**Status**: ⏳ Uploading files to Vercel...

**Project**: eksporyuk  
**Team**: ekspor-yuks-projects  
**Environment**: Preview (first deployment)

---

## 📋 Deployment Steps (Automatic)

1. ✅ Upload source code
2. ⏳ Install dependencies (`npm install`)
3. ⏳ Generate Prisma client (`prisma generate`)
4. ⏳ Build Next.js app (`next build`)
5. ⏳ Deploy to Vercel CDN
6. ⏳ Assign preview URL

**Expected Time**: 3-5 minutes

---

## 🔍 Monitor Progress

### Via Terminal
```bash
# Watch deployment in current terminal
# Output will show build logs
```

### Via Dashboard
1. Go to: https://vercel.com/dashboard
2. Select project: "eksporyuk"
3. Click "Deployments" tab
4. View real-time build logs

---

## ⚠️ Important: Environment Variables

**Action Required BEFORE testing**:

1. Go to: https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/environment-variables

2. Add these REQUIRED variables:

```bash
DATABASE_URL = postgresql://neondb_owner:xxxxx@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL = postgresql://neondb_owner:xxxxx@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL = https://your-preview-url.vercel.app
NEXTAUTH_SECRET = [generate with: openssl rand -base64 32]
```

3. Apply to: ✅ Production ✅ Preview ✅ Development

4. **Redeploy** after adding variables (or wait for next push)

---

## 🎯 After Deployment Completes

### Step 1: Get Preview URL
Vercel will output: `https://eksporyuk-xxxxx.vercel.app`

### Step 2: Test Critical Pages

```bash
# Homepage
https://your-url.vercel.app

# Auth
https://your-url.vercel.app/auth/login

# Admin (requires login)
https://your-url.vercel.app/admin/lead-magnets

# Affiliate (requires login)
https://your-url.vercel.app/affiliate/optin-forms
```

### Step 3: Check Logs

```bash
# Get deployment URL from terminal output, then:
vercel logs [deployment-url]

# Or in browser:
# https://vercel.com/ekspor-yuks-projects/eksporyuk/deployments
```

### Step 4: Verify Database Connection

1. Try to login
2. Check if Prisma queries work
3. Look for database errors in logs

---

## 🐛 Common Issues & Solutions

### Issue: Build fails with "prisma: command not found"
**Solution**: Already handled in `package.json` → `vercel-build` script

### Issue: "DATABASE_URL is not defined"
**Solution**: 
1. Add in Vercel Dashboard → Environment Variables
2. Redeploy: `vercel --prod` or push to git

### Issue: "Invalid NEXTAUTH_SECRET"
**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Add to Vercel env vars
# Redeploy
```

### Issue: 500 Error on API routes
**Solution**: Check Vercel Function logs for specific error

---

## 📊 Deployment Checklist

- [x] Source code uploaded
- [ ] Dependencies installed
- [ ] Prisma client generated
- [ ] Next.js build completed
- [ ] Deployed to CDN
- [ ] Preview URL assigned
- [ ] Environment variables added (MANUAL STEP)
- [ ] Database connection tested
- [ ] Authentication tested
- [ ] Admin features tested
- [ ] Affiliate features tested

---

## 🔄 Next Deployment (After This Preview)

### For Production:
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
vercel --prod
```

### For Auto-deploy via Git:
```bash
git add .
git commit -m "feat: ready for production"
git push origin main  # Auto-deploys to production
```

---

## 📞 Vercel Commands Reference

```bash
# Check deployment status
vercel ls

# View logs
vercel logs [url]

# Inspect deployment
vercel inspect [url]

# Check environment variables
vercel env ls

# Promote preview to production
vercel promote [url]

# Rollback
vercel rollback [previous-url]
```

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Preview URL is accessible
3. ✅ Homepage loads
4. ✅ Database connection works
5. ✅ Login functionality works
6. ✅ No 500 errors in critical routes

---

**Current Status**: ⏳ Deployment in progress...  
**Check terminal for live updates**

For detailed guide, see: `VERCEL_DEPLOYMENT_GUIDE.md`
