# 🚀 QUICK REFERENCE - Transaction & Email System
**Status: ✅ PRODUCTION READY** | Date: 3 Januari 2026

## ⚡ Quick Test Commands

### Test Email System
```bash
# Via curl
curl -X POST https://eksporyuk.com/api/admin/branded-templates/test-email \
  -H "Content-Type: application/json" \
  -d '{"templateSlug":"affiliate-commission-received","testData":{"userName":"Test","commissionAmount":100000},"recipientEmail":"test@example.com"}'

# Via browser
https://eksporyuk.com/admin/branded-templates
# Click "Test Email" button on any template
```

### Check Database
```bash
cd nextjs-eksporyuk && npx prisma studio --port 5555
# Open: http://localhost:5555
# Tables: BrandedTemplate, Transaction, Wallet, EmailNotificationLog
```

### Monitor Logs
```bash
# Production logs
vercel logs --follow

# Local dev
npm run dev
# Watch console for "[Xendit Webhook]" and "📧" logs
```

## 📊 System Architecture

### Transaction Flow
```
Purchase → Transaction(PENDING) → Xendit Payment → Webhook → SUCCESS
→ Commission Split → Wallet Update → Email Sent → Tracking
```

### Commission Distribution
```
Sale: Rp 1,000,000

Affiliate (30%):        Rp 300,000 → wallet.balance (direct)
Remaining:              Rp 700,000

Admin (15%):            Rp 105,000 → wallet.balancePending
Remaining:              Rp 595,000

Founder (60%):          Rp 357,000 → wallet.balancePending
Co-Founder (40%):       Rp 238,000 → wallet.balancePending
```

### Email Templates
| Slug                              | Trigger                    |
|-----------------------------------|----------------------------|
| affiliate-commission-received     | After affiliate sale       |
| founder-commission-received       | After sale (pending)       |
| cofounder-commission-received     | After sale (pending)       |
| admin-fee-pending                 | After sale (pending)       |
| mentor-commission-received        | After course sale          |
| commission-settings-changed       | Admin updates config       |

## 🔧 Key Files

```
src/app/api/webhooks/xendit/route.ts         - Payment webhook
src/lib/commission-helper.ts                 - Commission logic
src/lib/revenue-split.ts                     - Revenue distribution
src/lib/integrations/mailketing.ts           - Email API
src/lib/branded-template-engine.ts           - Template rendering
```

## 🗄️ Database Models

```sql
Transaction       - Payment tracking (status, amount, affiliateId)
Wallet            - balance, balancePending, totalEarnings
PendingRevenue    - status: PENDING → APPROVED
EmailNotificationLog - status: QUEUED → SENT → DELIVERED → OPENED
BrandedTemplate   - Email templates with custom branding
```

## 🌐 API Endpoints

```
POST /api/webhooks/xendit                      - Payment webhook
POST /api/admin/branded-templates/test-email   - Test email
GET  /api/payment/confirm/[transactionId]      - Transaction details
```

## ⚙️ Environment Variables

```env
DATABASE_URL="postgresql://..."
MAILKETING_API_KEY="your_key"
XENDIT_API_KEY="xnd_..."
XENDIT_WEBHOOK_TOKEN="secret"
NEXT_PUBLIC_APP_URL="https://eksporyuk.com"
```

## 🐛 Debugging

### Check Transaction Status
```sql
SELECT id, type, status, amount, "paidAt"
FROM "Transaction"
WHERE status = 'SUCCESS'
ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Email Delivery
```sql
SELECT "templateSlug", "recipientEmail", status, "sentAt", "deliveredAt"
FROM "EmailNotificationLog"
ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Wallet Balance
```sql
SELECT u.name, w.balance, w."balancePending", w."totalEarnings"
FROM "Wallet" w
JOIN "User" u ON u.id = w."userId"
WHERE w.balance > 0 OR w."balancePending" > 0;
```

## 🚨 Common Issues

1. **Email not sending**
   - Check: MAILKETING_API_KEY in .env.local or IntegrationConfig
   - Check: Mailketing dashboard for API usage
   - Check: EmailNotificationLog for error messages

2. **Commission not calculated**
   - Check: affiliateId in Transaction.metadata
   - Check: Webhook signature validation
   - Check: Vercel logs for "[Xendit Webhook]" errors

3. **Wallet not updated**
   - Check: Transaction status = 'SUCCESS'
   - Check: PendingRevenue records created
   - Check: Wallet table for userId

## ✅ Verification Checklist

- [x] Database schema correct
- [x] API endpoints working
- [x] Mailketing integration active
- [x] Email templates configured
- [x] Commission logic verified
- [x] Webhook handler secure
- [x] Build compiles
- [x] Deployed to production

## 📚 Documentation

- Full Audit: `TRANSACTION_EMAIL_SYSTEM_AUDIT_COMPLETE.md`
- Test Script: `test-transaction-email-flow.cjs`
- Health Check: `check-email-system.mjs`

---

**Last Updated**: 3 Januari 2026  
**Status**: ✅ ALL SYSTEMS OPERATIONAL
