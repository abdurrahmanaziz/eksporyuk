# Vercel Environment Variables Checklist

Copy these to Vercel Dashboard: Project Settings → Environment Variables

## ✅ REQUIRED (Must have)

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:xxxxx@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:xxxxx@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth (CRITICAL - Generate new secret for production!)
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_32_CHARS"

# Generate secret with:
# openssl rand -base64 32
```

## 🔧 Optional (Recommended for full features)

```bash
# Payment Gateway (Xendit)
XENDIT_API_KEY="xnd_public_xxxxx"
XENDIT_SECRET_KEY="xnd_xxxxx"
XENDIT_WEBHOOK_TOKEN="xxxxx"
XENDIT_VA_COMPANY_CODE="88088"

# Email Marketing (Mailketing)
MAILKETING_API_KEY="your-api-key"
MAILKETING_API_URL="https://api.mailketing.com"

# WhatsApp (Starsender)
STARSENDER_API_KEY="your-api-key"
STARSENDER_API_URL="https://api.starsender.com"
STARSENDER_DEVICE_ID="your-device-id"

# Push Notifications (OneSignal)
ONESIGNAL_APP_ID="your-app-id"
ONESIGNAL_REST_API_KEY="your-api-key"

# Real-time (Pusher)
PUSHER_APP_ID="your-app-id"
PUSHER_APP_KEY="your-key"
PUSHER_APP_SECRET="your-secret"
PUSHER_APP_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# App Settings
APP_URL="https://your-domain.vercel.app"
SHORT_LINK_DOMAIN="link.eksporyuk.com"

# Cron Job Security
CRON_SECRET="your-secure-random-string"

# Commission Settings
FOUNDER_PERCENTAGE="60"
CO_FOUNDER_PERCENTAGE="40"
COMPANY_FEE_PERCENTAGE="15"
```

## 📋 How to Add in Vercel

### Method 1: Via Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project "eksporyuk"
3. Click "Settings" tab
4. Click "Environment Variables"
5. For each variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environment: Select all (Production, Preview, Development)
   - Click "Add"

### Method 2: Via CLI

```bash
# Add single variable
vercel env add DATABASE_URL production

# Add from .env file
vercel env pull .env.production
```

### Method 3: Bulk Import

Create file `env-production.txt`:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://...
NEXTAUTH_SECRET=...
```

Then import:
```bash
cat env-production.txt | while read line; do
  key=$(echo $line | cut -d'=' -f1)
  value=$(echo $line | cut -d'=' -f2-)
  vercel env add $key production <<< "$value"
done
```

## 🔐 Security Notes

1. **Never commit** environment variables to git
2. **Generate new secrets** for production (don't reuse dev secrets)
3. **Use different values** for preview vs production
4. **Rotate secrets** regularly (every 3-6 months)
5. **Limit access** to environment variables in Vercel team settings

## ✅ Verification

After adding variables, verify:

```bash
# Check what's set (values hidden)
vercel env ls

# Pull to local (for testing)
vercel env pull .env.local
```

## 🚨 Critical Variables Explanation

### DATABASE_URL
- Must be PostgreSQL connection string
- Must include `?sslmode=require` for Neon
- Get from Neon Dashboard

### NEXTAUTH_SECRET
- Must be random 32+ character string
- NEVER reuse between environments
- Generate: `openssl rand -base64 32`

### NEXTAUTH_URL
- Production: `https://your-domain.com`
- Preview: `https://eksporyuk-git-branch.vercel.app`
- Must match actual deployment URL

## 🔄 Environment-Specific Values

### Production
```
NEXTAUTH_URL=https://eksporyuk.com
NODE_ENV=production
```

### Preview (Auto-deploy branches)
```
NEXTAUTH_URL=https://eksporyuk-git-staging.vercel.app
NODE_ENV=production
```

### Development (Local)
```
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

## ⚡ Quick Setup Command

For first-time setup, use this interactive script:

```bash
./deploy-vercel.sh
```

Or manual:

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Test environment
vercel env pull .env.vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not defined"
- Add in Vercel Dashboard
- Make sure applied to correct environment
- Redeploy after adding

### Error: "Invalid NEXTAUTH_SECRET"
- Must be at least 32 characters
- Generate new: `openssl rand -base64 32`
- Must be different from development

### Error: "NEXTAUTH_URL mismatch"
- Must exactly match deployment URL
- Include https://
- No trailing slash

## 📞 Need Help?

Check documentation:
- `/VERCEL_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `.env.example` - List of all variables
- Vercel Docs: https://vercel.com/docs/concepts/projects/environment-variables
