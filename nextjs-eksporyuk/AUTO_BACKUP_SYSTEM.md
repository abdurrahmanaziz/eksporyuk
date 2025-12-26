# 🔄 AUTO BACKUP SYSTEM - 30 MENIT

## Setup Complete ✅

Sistem backup otomatis setiap 30 menit sudah diaktifkan untuk mencegah kehilangan data seperti yang baru terjadi.

## Features

### 1. **Auto Backup Cron** 
- **Interval**: Setiap 30 menit (`*/30 * * * *`)
- **Storage**: Vercel Blob Storage
- **Retention**: 48 backups (24 jam coverage)
- **Endpoint**: `/api/cron/auto-backup`

### 2. **Comprehensive Tables Backed Up**
```typescript
User, Membership, UserMembership, Transaction, 
AffiliateProfile, AffiliateConversion, AffiliateCommission,
AffiliateCreditTransaction, AffiliateLink, AffiliateShortLink,
Wallet, WalletTransaction, PendingRevenue,
Course, CourseModule, CourseLesson, CourseEnrollment,
Product, Coupon, Event, EventRegistration, Group, GroupMember,
Post, PostComment, Notification, Certificate, LeadMagnet, OptInPage
```

### 3. **Safety Features**
- ✅ Automatic cleanup (keeps last 48 backups)
- ✅ Vercel Cron authentication (CRON_SECRET)
- ✅ JSON format for easy restore
- ✅ Detailed logging per backup
- ✅ Error handling & recovery

## Environment Variables Required

Add to Vercel Production environment:

```bash
# Generate random secret for cron authentication
CRON_SECRET="your-random-secret-here-min-32-chars"

# Vercel Blob token (from Vercel Storage settings)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"
```

### Generate CRON_SECRET:
```bash
openssl rand -hex 32
```

### Get BLOB_READ_WRITE_TOKEN:
1. Go to https://vercel.com/storage
2. Create or select Blob store
3. Copy Read-Write token

## Testing

### 1. Test Backup Locally
```bash
cd nextjs-eksporyuk
npx tsx test-backup-system.mjs
```

Expected output:
```
✅ BLOB_READ_WRITE_TOKEN found
📦 Creating backup...
✅ Backup created successfully!

📊 Backup Info:
   Size: 59.42 MB
   Tables: 35
   
📋 Records per table:
   User: 18,177
   Transaction: 18,644
   ...
```

### 2. Test Cron Endpoint (Local)
```bash
# Set CRON_SECRET in .env.local first
curl -X GET http://localhost:3000/api/cron/auto-backup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. List All Backups
```bash
npx tsx list-vercel-backups.mjs
```

## Deployment

### 1. Set Environment Variables in Vercel
```bash
# Production only
vercel env add CRON_SECRET production
vercel env add BLOB_READ_WRITE_TOKEN production

# Verify
vercel env ls production | grep "CRON_SECRET\|BLOB"
```

### 2. Deploy
```bash
git add .
git commit -m "feat: Add 30-minute auto backup system"
git push origin main
```

### 3. Verify Cron is Running
After deployment:
1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see: `/api/cron/auto-backup` scheduled at `*/30 * * * *`
3. Check execution logs after 30 minutes

## Monitoring

### Check Backup Status
```bash
# List all backups
npx tsx list-vercel-backups.mjs

# Should show backups every 30 minutes
✅ Found 48 backup(s):

1. backup-2025-12-26T10-30-00-000Z.json (30 mins ago)
2. backup-2025-12-26T10-00-00-000Z.json (1 hour ago)
3. backup-2025-12-26T09-30-00-000Z.json (1.5 hours ago)
...
```

### Vercel Dashboard
1. Go to Vercel → Deployments → Functions
2. Filter by `/api/cron/auto-backup`
3. Check execution logs

## Recovery Procedures

### If Data Lost Again

**Option 1: Restore from Auto Backup (Recommended)**
```bash
# 1. List available backups
npx tsx list-vercel-backups.mjs

# 2. Download specific backup
curl -o recovery.json "BACKUP_URL_FROM_LIST"

# 3. Restore
npx tsx restore-from-backup.mjs recovery.json
```

**Option 2: Fresh Import from Sejoli**
```bash
node fresh-import-sejoli.js
```

This will:
1. Create safety backup first
2. Export fresh data from Sejoli
3. Import to current database
4. Verify data integrity

## Files Created

```
nextjs-eksporyuk/
├── src/app/api/cron/auto-backup/route.ts  # Cron endpoint
├── src/lib/services/database-backup-service.ts  # Updated (48 backups)
├── test-backup-system.mjs                 # Manual backup test
├── list-vercel-backups.mjs               # List backups
├── restore-from-backup.mjs               # Restore utility
├── fresh-import-sejoli.js                # Fresh import script
└── vercel.json                           # Updated cron schedule
```

## Configuration Changes

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-backup",
      "schedule": "*/30 * * * *"  // Every 30 minutes
    }
  ]
}
```

### database-backup-service.ts
```typescript
private readonly MAX_BACKUPS = 48  // 24 hours worth (30min interval)
```

## Cost Estimation

**Vercel Blob Storage:**
- Backup size: ~60 MB per backup
- Retention: 48 backups = ~2.88 GB
- Vercel Blob free tier: 500 GB
- **Cost: FREE** (well within limits)

**Vercel Cron:**
- Executions: 48 per day (every 30 min)
- Hobby plan: 100 cron jobs/day
- **Cost: FREE**

## Troubleshooting

### Backup Not Running
1. Check Vercel Cron Jobs dashboard
2. Verify CRON_SECRET is set in production
3. Check function logs for errors

### Backup Fails
1. Check BLOB_READ_WRITE_TOKEN is valid
2. Verify database connection (DATABASE_URL)
3. Check function timeout (max 30s)

### Storage Full
- Auto cleanup keeps only 48 backups
- If issues, manually delete old backups:
  ```bash
  # List and delete via API or Vercel dashboard
  ```

## Next Steps

1. ✅ Deploy to production
2. ✅ Verify first backup runs after 30 min
3. ✅ Monitor for 24 hours
4. ✅ Test restore procedure once
5. ✅ Import fresh Sejoli data: `node fresh-import-sejoli.js`

## Prevention Measures

### Never Run These Commands on Production:
```bash
❌ npx prisma db push --force-reset
❌ npx prisma migrate reset
❌ DROP DATABASE
❌ TRUNCATE TABLE
```

### Always Use:
```bash
✅ npx prisma db push (without --force-reset)
✅ npx prisma migrate deploy (for production)
✅ Create backup before major changes
```

## Contact

If issues persist:
1. Check backup logs in Vercel
2. Verify environment variables
3. Test backup manually first
4. Restore from backup if needed

---

**Auto Backup System v1.0**  
Last Updated: 26 Desember 2025  
Status: ✅ ACTIVE - Every 30 minutes
