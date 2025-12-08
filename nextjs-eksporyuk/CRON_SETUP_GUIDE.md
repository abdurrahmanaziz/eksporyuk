# 🕐 Automated Cron Jobs - Setup Guide

## 📋 Overview

Sistem ini memiliki 3 cron jobs otomatis untuk mengelola membership lifecycle:

1. **Payment Follow-up** (Existing) - Hourly
2. **Check Expiring Memberships** (NEW) - Daily at 09:00
3. **Auto-Expire Memberships** (NEW) - Daily at 00:00

---

## 🚀 Quick Start

### Development Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Generate CRON_SECRET:**
   ```powershell
   # PowerShell
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

3. **Add to .env.local:**
   ```env
   CRON_SECRET="your-generated-secret-here"
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Test cron jobs:**
   ```bash
   $env:CRON_SECRET = "your-secret"
   node test-cron.cjs check-expiring
   node test-cron.cjs expire
   ```

---

## 🌐 Production Deployment (Vercel)

### Step 1: Configure Environment
In Vercel Dashboard → Settings → Environment Variables:

```
CRON_SECRET = your-secure-random-key-here
```

Apply to: Production, Preview, Development

### Step 2: Deploy
```bash
git add .
git commit -m "Add membership cron jobs"
git push
```

Vercel automatically:
- Reads `vercel.json` cron configuration
- Sets up scheduled jobs
- Adds Authorization header with CRON_SECRET

### Step 3: Verify
Check Vercel Dashboard → Deployments → Functions → Cron Jobs

---

## 📅 Cron Schedule

| Job | Schedule | Time (UTC) | Purpose |
|-----|----------|------------|---------|
| payment-followup | `0 * * * *` | Every hour | Follow up pending payments |
| check-expiring-memberships | `0 9 * * *` | 09:00 daily | Send expiry warnings |
| expire-memberships | `0 0 * * *` | 00:00 daily | Auto-expire memberships |

**Cron Format:** `minute hour day month weekday`

---

## 🧪 Manual Testing

### Using Test Script
```bash
# Set secret
$env:CRON_SECRET = "your-secret"

# Test specific job
node test-cron.cjs check-expiring
node test-cron.cjs expire
node test-cron.cjs both

# Test production URL
$env:TEST_URL = "https://yoursite.com"
node test-cron.cjs both
```

### Using cURL
```bash
curl -X GET http://localhost:3000/api/cron/check-expiring-memberships \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X GET http://localhost:3000/api/cron/expire-memberships \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Using PowerShell
```powershell
$headers = @{ Authorization = "Bearer YOUR_CRON_SECRET" }

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/check-expiring-memberships" `
  -Method GET `
  -Headers $headers | ConvertTo-Json
```

---

## 📊 Expected Output

### Success Response
```json
{
  "success": true,
  "timestamp": "2025-11-24T09:00:00.000Z",
  "job": "check-expiring-memberships",
  "results": {
    "total": 5,
    "success": 5,
    "failed": 0,
    "errors": []
  },
  "message": "Processed 5 memberships: 5 success, 0 failed"
}
```

### Error Response
```json
{
  "error": "Unauthorized"
}
```

---

## 🔐 Security Notes

- ✅ All cron endpoints require `Authorization: Bearer` header
- ✅ Secret stored in environment variables (never hardcoded)
- ✅ Returns 401 if unauthorized
- ✅ Logs unauthorized access attempts
- ✅ No sensitive data in responses

---

## 🐛 Troubleshooting

### Cron not running
1. Check Vercel logs: Dashboard → Deployments → View Function Logs
2. Verify `vercel.json` is committed and deployed
3. Check CRON_SECRET is set in environment variables

### 401 Unauthorized
1. Verify CRON_SECRET matches in environment
2. Check Authorization header format: `Bearer YOUR_SECRET`
3. Ensure no trailing spaces in secret

### Emails not sent
1. Check MAILKETING_API_KEY is configured
2. Verify Mailketing service status
3. Check logs for email errors

### Database timeout
1. Check Prisma connection pool settings
2. Verify database is accessible
3. Check query performance (already indexed)

---

## 📝 Maintenance

### View Logs
```bash
# Vercel CLI
vercel logs

# Or in Vercel Dashboard
Deployments → Your Deploy → View Function Logs
```

### Monitor Performance
- Check execution time in Vercel logs
- Monitor email delivery rate
- Track UserMembership status updates

### Update Schedule
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-memberships",
      "schedule": "0 9 * * *"  // Change time here
    }
  ]
}
```

Then deploy: `git push`

---

## 📚 Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Mailketing API Documentation](https://mailketing.co.id/docs)

---

## ✅ Checklist

**Development:**
- [ ] CRON_SECRET set in .env.local
- [ ] Test script runs successfully
- [ ] Emails sent in dev mode

**Production:**
- [ ] CRON_SECRET set in Vercel
- [ ] vercel.json committed
- [ ] Deployment successful
- [ ] Cron jobs visible in dashboard
- [ ] Monitor first execution

---

**Last Updated:** November 24, 2025  
**Status:** Production Ready ✅
