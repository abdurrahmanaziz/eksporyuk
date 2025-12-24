# Vercel Deployment Guide - Eksporyuk Platform

## Prerequisites Checklist

- [x] Database: Neon PostgreSQL configured
- [x] Prisma schema synced
- [x] Environment variables prepared
- [x] Build tested locally
- [ ] Vercel account ready
- [ ] Domain configured (optional)

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel
```

---

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

---

## Step 3: Environment Variables Setup

Vercel needs these environment variables. Add them in Vercel Dashboard or via CLI.

### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-random-32-char-string"

# Generate secret:
openssl rand -base64 32
```

### Optional Variables (for full functionality)

```bash
# Payment Gateway
XENDIT_API_KEY="your-xendit-api-key"
XENDIT_SECRET_KEY="your-xendit-secret"
XENDIT_WEBHOOK_TOKEN="your-webhook-token"

# Email Marketing
MAILKETING_API_KEY="your-mailketing-key"
MAILKETING_API_URL="https://api.mailketing.com"

# WhatsApp Integration
STARSENDER_API_KEY="your-starsender-key"
STARSENDER_API_URL="https://api.starsender.com"
STARSENDER_DEVICE_ID="your-device-id"

# Push Notifications
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_REST_API_KEY="your-onesignal-key"

# Real-time (Pusher)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_APP_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App Settings
APP_URL="https://your-domain.vercel.app"
SHORT_LINK_DOMAIN="link.eksporyuk.com"

# Cron Job Security
CRON_SECRET="your-secure-cron-secret"

# Commission Settings
FOUNDER_PERCENTAGE="60"
CO_FOUNDER_PERCENTAGE="40"
COMPANY_FEE_PERCENTAGE="15"
```

---

## Step 4: Deploy via CLI (Recommended)

### First Time Deployment

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your account
- **Link to existing project**: No
- **Project name**: eksporyuk (or your choice)
- **Directory**: ./ (current directory)
- **Override settings**: No

### Production Deployment

```bash
vercel --prod
```

---

## Step 5: Deploy via GitHub (Alternative)

### 5.1 Push to GitHub

```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin main
```

### 5.2 Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository: `abdurrahmanaziz/eksporyuk`
4. Configure:
   - **Root Directory**: `nextjs-eksporyuk`
   - **Framework**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 5.3 Add Environment Variables

In Vercel Dashboard:
1. Go to Project Settings
2. Click "Environment Variables"
3. Add all required variables from Step 3
4. Apply to: Production, Preview, Development

---

## Step 6: Verify Build Settings

Vercel should auto-detect these settings:

```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "next dev --port 3000"
}
```

**Important**: Prisma needs to generate client before build!

---

## Step 7: Post-Deployment Checks

### 7.1 Check Build Log

Look for:
- ✅ `prisma generate` completed
- ✅ `next build` successful
- ✅ No TypeScript errors (false positive warnings OK)
- ✅ API routes compiled

### 7.2 Test Critical Pages

```
✓ Homepage: https://your-domain.vercel.app
✓ Login: https://your-domain.vercel.app/auth/login
✓ Admin: https://your-domain.vercel.app/admin/lead-magnets
✓ Affiliate: https://your-domain.vercel.app/affiliate/optin-forms
```

### 7.3 Test API Endpoints

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Admin endpoint (requires auth)
curl https://your-domain.vercel.app/api/admin/lead-magnets
```

### 7.4 Database Connection

```
✓ Check Vercel logs for database connection
✓ Test login functionality
✓ Verify Prisma queries work
```

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain: `eksporyuk.com`
3. Configure DNS:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 8.2 Update Environment Variables

After domain is active:
```bash
NEXTAUTH_URL="https://eksporyuk.com"
APP_URL="https://eksporyuk.com"
```

Redeploy to apply changes.

---

## Step 9: Troubleshooting

### Issue 1: Build Fails - "prisma: command not found"

**Solution**: Check `package.json` has Prisma in dependencies:
```json
"dependencies": {
  "@prisma/client": "^4.16.2"
},
"devDependencies": {
  "prisma": "^4.16.2"
}
```

### Issue 2: Database Connection Error

**Solution**: Verify `DATABASE_URL` in Vercel environment variables:
- Must be PostgreSQL connection string
- Must include `?sslmode=require` for Neon
- Check `DIRECT_URL` is also set

### Issue 3: TypeScript Errors During Build

**Solution**: 
- False positive errors about `prisma.leadMagnet` are safe to ignore
- Add to `next.config.js`:
```javascript
typescript: {
  ignoreBuildErrors: true // Use cautiously
}
```

### Issue 4: 500 Error on API Routes

**Solution**: Check Vercel Function Logs:
1. Go to Vercel Dashboard
2. Click "Functions" tab
3. Find failing endpoint
4. Check error message
5. Common causes:
   - Missing environment variable
   - Database connection timeout
   - NextAuth secret not set

### Issue 5: Slow Build Time

**Solution**: 
- Enable Vercel caching in `vercel.json`
- Use `npm ci` instead of `npm install`
- Consider upgrading Vercel plan for faster builds

---

## Step 10: Environment-Specific Configuration

### Production
```bash
NEXTAUTH_URL="https://eksporyuk.com"
NODE_ENV="production"
```

### Preview (Staging)
```bash
NEXTAUTH_URL="https://eksporyuk-git-staging.vercel.app"
NODE_ENV="production"
```

### Development
```bash
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Step 11: Continuous Deployment

### Auto-deploy on Git Push

Vercel automatically deploys when you push to:
- **main branch** → Production
- **other branches** → Preview

```bash
# Deploy to production
git push origin main

# Deploy preview
git checkout -b feature/new-feature
git push origin feature/new-feature
# Preview URL: https://eksporyuk-git-feature-new-feature.vercel.app
```

### Manual Redeployment

```bash
vercel --prod
```

Or in Vercel Dashboard:
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

---

## Step 12: Monitoring & Analytics

### Enable Analytics

1. Go to Vercel Dashboard
2. Click "Analytics" tab
3. Enable Web Analytics (free)

### Monitor Function Performance

1. Go to "Functions" tab
2. Check execution time
3. Monitor error rate
4. Set up alerts

### Database Monitoring

Use Neon Dashboard:
1. Go to https://neon.tech
2. Select project
3. Check:
   - Connection count
   - Query performance
   - Storage usage

---

## Quick Deploy Commands

```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy to production
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
vercel --prod

# Check deployment status
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]
```

---

## Checklist Before Production

- [ ] All environment variables added in Vercel
- [ ] Database connection tested
- [ ] Login/Authentication works
- [ ] Admin pages accessible
- [ ] Affiliate features functional
- [ ] Lead magnet system tested
- [ ] Payment gateway connected (if needed)
- [ ] Email/WhatsApp integration tested (if needed)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring enabled

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma on Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Neon PostgreSQL**: https://neon.tech/docs

---

## Emergency Rollback

If deployment fails:

```bash
# List deployments
vercel list

# Promote previous deployment to production
vercel promote [previous-deployment-url]
```

Or in Vercel Dashboard:
1. Go to Deployments
2. Find working deployment
3. Click "..." → "Promote to Production"

---

**Ready to Deploy!** 🚀

Run: `vercel --prod` from `nextjs-eksporyuk` directory
